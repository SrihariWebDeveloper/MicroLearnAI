from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.code_execution_service import SandboxUnavailable


learning_bp = Blueprint("learning", __name__, url_prefix="/api/learning")


def _response(data):
    return jsonify({"success": True, "data": data})


@learning_bp.get("/lessons/<subtopic_id>")
@jwt_required()
def get_lesson(subtopic_id):
    lesson = current_app.extensions["learning_service"].get_lesson(
        get_jwt_identity(), subtopic_id
    )
    if lesson is None:
        return jsonify({"success": False, "error": "Lesson not found or locked."}), 404
    return _response(lesson)


@learning_bp.post("/lessons/<subtopic_id>/generate")
@jwt_required()
def generate_lesson(subtopic_id):
    try:
        lesson = current_app.extensions["learning_service"].generate_lesson(
            get_jwt_identity(), subtopic_id
        )
    except (RuntimeError, ValueError) as error:
        return jsonify({"success": False, "error": str(error)}), 503
    if lesson is None:
        return jsonify({"success": False, "error": "Lesson not found or locked."}), 404
    return _response(lesson)


@learning_bp.post("/lessons/<subtopic_id>/complete")
@jwt_required()
def complete_lesson(subtopic_id):
    completion = current_app.extensions["learning_service"].complete_lesson(
        get_jwt_identity(), subtopic_id
    )
    if completion is None:
        return jsonify({"success": False, "error": "Lesson not found or locked."}), 404
    return _response({"success": True, "completed_at": completion["completed_at"]})


@learning_bp.get("/labs/<subtopic_id>")
@jwt_required()
def get_coding_problem(subtopic_id):
    problem = current_app.extensions["learning_service"].get_coding_problem(
        get_jwt_identity(), subtopic_id
    )
    if problem is None:
        return jsonify({"success": False, "error": "Coding problem not found or locked."}), 404
    return _response(problem)


@learning_bp.post("/labs/submit")
@jwt_required()
def submit_code():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    try:
        result = current_app.extensions["learning_service"].submit_code(
            get_jwt_identity(),
            data.get("problem_id"),
            data.get("code"),
            data.get("language"),
        )
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except SandboxUnavailable as error:
        return jsonify({"success": False, "error": str(error)}), 503
    if result is None:
        return jsonify({"success": False, "error": "Coding problem not found or locked."}), 404
    return _response(result)