from flask import Blueprint, jsonify, send_file, request
import io
from glowai.auth.decorators import require_auth
from glowai.models.analysis import get_by_id
from glowai.reports.generator import generate_report

report_bp = Blueprint("report", __name__)


@report_bp.route("/<analysis_id>/download", methods=["GET"])
@require_auth
def download_report(analysis_id: str):
    user = request.current_user

    try:
        analysis = get_by_id(analysis_id)
    except Exception:
        return jsonify({"error": "not_found"}), 404

    if not analysis:
        return jsonify({"error": "not_found"}), 404

    if str(analysis["user_id"]) != str(user["_id"]):
        return jsonify({"error": "forbidden"}), 403

    try:
        pdf_bytes = generate_report(analysis, user)
    except Exception as e:
        return jsonify({"error": "report_generation_failed", "retry": True, "message": str(e)}), 500

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"glowai-report-{analysis_id[:8]}.pdf",
    )
