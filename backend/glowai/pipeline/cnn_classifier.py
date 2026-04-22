"""
CNN Classifier for skin type classification and condition detection.

In production, this loads a trained TensorFlow/Keras model from disk.
The model architecture uses a CNN backbone (e.g. MobileNetV2) fine-tuned on
skin type and condition datasets.

For development/testing without a trained model, a mock inference path is
provided that returns plausible random outputs with the correct structure.
"""
import os
import numpy as np
from glowai.pipeline.face_detector import FaceRegions, BoundingBox

# Model file paths — set via environment variables
SKIN_TYPE_MODEL_PATH = os.environ.get("SKIN_TYPE_MODEL_PATH", "")
CONDITION_MODEL_PATH = os.environ.get("CONDITION_MODEL_PATH", "")

SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"]
CONDITIONS = ["acne", "dark_spots", "enlarged_pores", "wrinkles"]

SKIN_TYPE_CONFIDENCE_THRESHOLD = 0.60
CONDITION_CONFIDENCE_THRESHOLD = 0.50

# Lazy-loaded models
_skin_type_model = None
_condition_model = None


def _load_skin_type_model():
    global _skin_type_model
    if _skin_type_model is None and SKIN_TYPE_MODEL_PATH and os.path.exists(SKIN_TYPE_MODEL_PATH):
        try:
            import tensorflow as tf
            _skin_type_model = tf.keras.models.load_model(SKIN_TYPE_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Could not load skin type model: {e}")
    return _skin_type_model


def _load_condition_model():
    global _condition_model
    if _condition_model is None and CONDITION_MODEL_PATH and os.path.exists(CONDITION_MODEL_PATH):
        try:
            import tensorflow as tf
            _condition_model = tf.keras.models.load_model(CONDITION_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Could not load condition model: {e}")
    return _condition_model


def _crop_region(image: np.ndarray, bbox: BoundingBox, target_size: tuple = (224, 224)) -> np.ndarray:
    """Crop a region from the image tensor and resize to target_size."""
    import cv2
    h, w = image.shape[:2]
    x1 = max(0, bbox.x)
    y1 = max(0, bbox.y)
    x2 = min(w, bbox.x + bbox.w)
    y2 = min(h, bbox.y + bbox.h)
    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        crop = image  # fallback to full image
    resized = cv2.resize(crop, target_size, interpolation=cv2.INTER_AREA)
    return resized


def _mock_skin_type_inference(image: np.ndarray) -> dict[str, float]:
    """
    Mock inference for development without a trained model.
    Returns a dict of skin_type -> confidence_score.
    Uses image statistics to produce deterministic-ish results.
    """
    # Use mean pixel values to seed a pseudo-deterministic result
    mean_val = float(np.mean(image))
    rng = np.random.default_rng(seed=int(mean_val * 1000) % 2**32)
    raw = rng.dirichlet(np.ones(len(SKIN_TYPES)) * 2)
    return {skin_type: float(score) for skin_type, score in zip(SKIN_TYPES, raw)}


def _mock_condition_inference(image: np.ndarray) -> dict[str, float]:
    """
    Mock inference for development without a trained model.
    Returns a dict of condition -> confidence_score.
    """
    mean_val = float(np.mean(image))
    rng = np.random.default_rng(seed=int(mean_val * 999) % 2**32)
    return {condition: float(rng.uniform(0.1, 0.9)) for condition in CONDITIONS}


def _run_skin_type_inference(image: np.ndarray) -> dict[str, float]:
    """Run skin type classification. Returns confidence scores per class."""
    model = _load_skin_type_model()
    if model is None:
        return _mock_skin_type_inference(image)
    batch = np.expand_dims(image, axis=0)  # (1, 224, 224, 3)
    predictions = model.predict(batch, verbose=0)[0]  # (num_classes,)
    return {skin_type: float(score) for skin_type, score in zip(SKIN_TYPES, predictions)}


def _run_condition_inference(image: np.ndarray) -> dict[str, float]:
    """Run condition detection. Returns confidence scores per condition."""
    model = _load_condition_model()
    if model is None:
        return _mock_condition_inference(image)
    batch = np.expand_dims(image, axis=0)
    predictions = model.predict(batch, verbose=0)[0]
    return {condition: float(score) for condition, score in zip(CONDITIONS, predictions)}


def classify(regions: FaceRegions) -> dict:
    """
    Classify skin type and detect conditions from face regions.

    Args:
        regions: FaceRegions from face_detector.detect_and_segment()

    Returns:
        dict with keys:
            skin_type: str
            skin_type_confidence: float
            skin_type_scores: dict[str, float]
            low_confidence_flag: bool
            conditions: list of condition dicts
            face_regions: dict of region bounding boxes
    """
    image = regions.image  # (224, 224, 3) float32

    # --- Skin Type Classification ---
    # Use the full face image for skin type
    skin_type_scores = _run_skin_type_inference(image)

    # Pick the highest confidence class
    best_skin_type = max(skin_type_scores, key=lambda k: skin_type_scores[k])
    best_confidence = skin_type_scores[best_skin_type]
    low_confidence_flag = best_confidence < SKIN_TYPE_CONFIDENCE_THRESHOLD

    # --- Condition Detection ---
    # Run condition detection on each region and aggregate
    region_map = {
        "forehead": regions.forehead,
        "left_cheek": regions.left_cheek,
        "right_cheek": regions.right_cheek,
        "chin": regions.chin,
    }

    # Aggregate condition scores across all regions (max pooling)
    aggregated_condition_scores: dict[str, float] = {c: 0.0 for c in CONDITIONS}
    condition_region_map: dict[str, str] = {}  # condition -> region with highest score

    for region_name, bbox in region_map.items():
        region_crop = _crop_region(image, bbox)
        region_scores = _run_condition_inference(region_crop)
        for condition, score in region_scores.items():
            if score > aggregated_condition_scores[condition]:
                aggregated_condition_scores[condition] = score
                condition_region_map[condition] = region_name

    # Build detected conditions list (only above threshold)
    detected_conditions = []
    for condition, confidence in aggregated_condition_scores.items():
        if confidence >= CONDITION_CONFIDENCE_THRESHOLD:
            region_name = condition_region_map.get(condition, "forehead")
            bbox = region_map[region_name]
            detected_conditions.append({
                "name": condition,
                "confidence": round(confidence, 4),
                "bbox": {
                    "region": region_name,
                    **bbox.to_dict(),
                },
            })

    # Sort conditions by confidence descending
    detected_conditions.sort(key=lambda c: c["confidence"], reverse=True)

    return {
        "skin_type": best_skin_type,
        "skin_type_confidence": round(best_confidence, 4),
        "skin_type_scores": {k: round(v, 4) for k, v in skin_type_scores.items()},
        "low_confidence_flag": low_confidence_flag,
        "conditions": detected_conditions,
        "face_regions": regions.to_dict(),
    }
