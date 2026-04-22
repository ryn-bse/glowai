import os
import uuid
from flask import Blueprint, request, jsonify
from PIL import Image
import io
from glowai.auth.decorators import require_auth
from glowai.models.analysis import save_analysis, get_by_id, get_history_for_user
from bson import ObjectId

analysis_bp = Blueprint("analysis", __name__)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
MIN_RESOLUTION = (224, 224)

# Cloud storage stub — replace with real cloud SDK (e.g. boto3 / GCS) in production
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")


def _store_image(image_bytes: bytes, filename: str) -> str:
    """Store image — uses Supabase if configured, otherwise local uploads/."""
    try:
        from glowai.supabase_storage import upload_image, is_configured
        if is_configured():
            ext = filename.rsplit('.', 1)[-1]
            mime_map = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
            mime = mime_map.get(ext, "image/jpeg")
            return upload_image(image_bytes, mime)
    except Exception:
        pass
    # Fallback: local storage
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(image_bytes)
    return f"/uploads/{filename}"


def _serialize_analysis(doc: dict) -> dict:
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, dict):
            result[k] = _serialize_analysis(v)
        elif isinstance(v, list):
            result[k] = [
                _serialize_analysis(i) if isinstance(i, dict) else
                str(i) if isinstance(i, ObjectId) else i
                for i in v
            ]
        else:
            result[k] = v
    return result


def _validate_image(file) -> tuple[bytes, str]:
    """
    Validate uploaded image file.
    Returns (image_bytes, mime_type) or raises ValueError with descriptive message.
    """
    image_bytes = file.read()

    # Check file size
    if len(image_bytes) > MAX_FILE_SIZE:
        raise ValueError("file_too_large")

    # Check MIME type via Pillow (more reliable than Content-Type header)
    try:
        img = Image.open(io.BytesIO(image_bytes))
        fmt = img.format  # JPEG, PNG, WEBP
    except Exception:
        raise ValueError("invalid_format")

    fmt_to_mime = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
    mime = fmt_to_mime.get(fmt)
    if not mime:
        raise ValueError("invalid_format")

    # Check minimum resolution
    if img.width < MIN_RESOLUTION[0] or img.height < MIN_RESOLUTION[1]:
        raise ValueError("resolution_too_low")

    return image_bytes, mime


@analysis_bp.route("/submit", methods=["POST"])
@require_auth
def submit_analysis():
    if "image" not in request.files:
        return jsonify({"error": "validation_error", "fields": {"image": "Image file is required."}}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "validation_error", "fields": {"image": "No file selected."}}), 400

    try:
        image_bytes, mime_type = _validate_image(file)
    except ValueError as e:
        reason = str(e)
        if reason == "file_too_large":
            return jsonify({"error": "file_too_large", "max_bytes": MAX_FILE_SIZE}), 400
        elif reason == "invalid_format":
            return jsonify({"error": "invalid_format", "message": "Accepted formats: JPEG, PNG, WebP"}), 400
        elif reason == "resolution_too_low":
            return jsonify({"error": "resolution_too_low", "min": "224x224"}), 400
        return jsonify({"error": "invalid_image", "message": reason}), 400

    # Store image
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    filename = f"{uuid.uuid4()}.{ext_map[mime_type]}"
    image_url = _store_image(image_bytes, filename)

    # Run AI pipeline (imported lazily to avoid heavy imports at startup)
    try:
        from glowai.pipeline.preprocessor import preprocess, PreprocessError
        from glowai.pipeline.face_detector import detect_and_segment, NoFaceError, MultipleFacesError
        from glowai.pipeline.cnn_classifier import classify
        from glowai.pipeline.recommender import recommend
    except ImportError as e:
        return jsonify({"error": "pipeline_unavailable", "message": str(e)}), 500

    try:
        tensor = preprocess(image_bytes)
    except PreprocessError as e:
        return jsonify({"error": "image_quality", "reason": str(e)}), 422

    try:
        face_regions = detect_and_segment(tensor)
    except NoFaceError:
        return jsonify({"error": "no_face_detected"}), 422
    except MultipleFacesError:
        return jsonify({"error": "multiple_faces_detected"}), 422

    try:
        analysis_result = classify(face_regions)
    except Exception as e:
        return jsonify({"error": "model_inference_failed", "message": str(e)}), 500

    user = request.current_user
    try:
        recommendations = recommend(analysis_result, user)
        recommendations_available = True
    except Exception:
        recommendations = []
        recommendations_available = False

    analysis_data = {
        "image_url": image_url,
        "skin_type": analysis_result["skin_type"],
        "skin_type_confidence": analysis_result["skin_type_confidence"],
        "low_confidence_flag": analysis_result.get("low_confidence_flag", False),
        "conditions": analysis_result.get("conditions", []),
        "face_regions": analysis_result.get("face_regions", {}),
        "recommendations": recommendations,
    }

    saved = save_analysis(str(user["_id"]), analysis_data)

    response = _serialize_analysis(saved)
    response["recommendations_available"] = recommendations_available
    return jsonify(response), 201


@analysis_bp.route("/history", methods=["GET"])
@require_auth
def get_history():
    user = request.current_user
    history = get_history_for_user(str(user["_id"]))
    return jsonify([_serialize_analysis(a) for a in history]), 200


@analysis_bp.route("/<analysis_id>", methods=["GET"])
@require_auth
def get_analysis(analysis_id: str):
    user = request.current_user
    try:
        analysis = get_by_id(analysis_id)
    except Exception:
        return jsonify({"error": "not_found"}), 404

    if not analysis:
        return jsonify({"error": "not_found"}), 404

    if str(analysis["user_id"]) != str(user["_id"]):
        return jsonify({"error": "forbidden"}), 403

    return jsonify(_serialize_analysis(analysis)), 200
