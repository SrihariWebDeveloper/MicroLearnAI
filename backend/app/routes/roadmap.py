from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required


roadmap_bp = Blueprint("roadmap", __name__, url_prefix="/api/roadmap")


def _response(data):
    return jsonify({"success": True, "data": data})


@roadmap_bp.get("")
@jwt_required()
def get_roadmap():
    roadmap = current_app.extensions["roadmap_service"].get_roadmap_for_user(
        get_jwt_identity()
    )
    return _response(roadmap)


@roadmap_bp.post("/generate")
@jwt_required()
def generate_roadmap():
    user_id = get_jwt_identity()
    profile = current_app.extensions["auth_service"].get_learner_profile(user_id)
    if profile is None:
        return jsonify({"success": False, "error": "Complete onboarding before generating a roadmap."}), 409
    roadmap = current_app.extensions["roadmap_service"].generate_for_profile(user_id, profile)
    return _response(roadmap)


@roadmap_bp.get("/subtopics/<subtopic_id>")
@jwt_required()
def get_subtopic(subtopic_id):
    subtopic = current_app.extensions["roadmap_service"].get_subtopic_for_user(
        get_jwt_identity(), subtopic_id
    )
    if subtopic is None:
        return jsonify({"success": False, "error": "Subtopic not found."}), 404
    return _response(subtopic)