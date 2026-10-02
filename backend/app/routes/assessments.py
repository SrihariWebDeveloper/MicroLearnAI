from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.code_execution_service import SandboxUnavailable


assessment_bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")


def _response(data):
    return jsonify({"success": True, "data": data})


def _accessible_subtopic(user_id, subtopic_id):
    subtopic = current_app.extensions["roadmap_service"].get_subtopic_for_user(
        user_id, subtopic_id
    )
    return subtopic if subtopic and subtopic.get("status") != "locked" else None


@assessment_bp.get("/<subtopic_id>")
@jwt_required()
def get_assessment(subtopic_id):
    user_id = get_jwt_identity()
    if _accessible_subtopic(user_id, subtopic_id) is None:
        return jsonify({"success": False, "error": "Assessment not found or locked."}), 404
    return _response(current_app.extensions["assessment_service"].get_assessment(subtopic_id))


@assessment_bp.post("/submit")
@jwt_required()
def submit_assessment():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    user_id = get_jwt_identity()
    subtopic_id = data.get("subtopic_id")
    if not isinstance(subtopic_id, str) or _accessible_subtopic(user_id, subtopic_id) is None:
        return jsonify({"success": False, "error": "Assessment not found or locked."}), 404
    try:
        result = current_app.extensions["assessment_service"].evaluate_assessment(user_id, data)
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except SandboxUnavailable as error:
        return jsonify({"success": False, "error": str(error)}), 503

    current_app.extensions["roadmap_service"].record_assessment_result(
        user_id,
        subtopic_id,
        result["overall_score"],
        result["passed"],
    )
    current_app.extensions["notification_service"].create(
        user_id,
        "Assessment passed" if result["passed"] else "Assessment needs review",
        (
            f"You scored {result['overall_score']}% and unlocked the next subtopic."
            if result["passed"]
            else f"You scored {result['overall_score']}%. Review the missed questions and try again."
        ),
        "achievement" if result["passed"] else "recommendation",
        "/roadmap" if result["passed"] else f"/assessment?subtopic={subtopic_id}",
    )
    return _response(result)


@assessment_bp.get("/results/<subtopic_id>")
@jwt_required()
def get_latest_result(subtopic_id):
    result = current_app.extensions["assessment_service"].get_latest_result(
        get_jwt_identity(), subtopic_id
    )
    if result is None:
        return jsonify({"success": False, "error": "No assessment result exists."}), 404
    return _response(result)