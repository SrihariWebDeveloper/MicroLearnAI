from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required


recommendations_bp = Blueprint("recommendations", __name__, url_prefix="/api/recommendations")


@recommendations_bp.get("")
@jwt_required()
def get_recommendations():
    items = current_app.extensions["recommendation_service"].get_for_user(get_jwt_identity())
    return jsonify({"success": True, "data": [item for item in items if item is not None]})


@recommendations_bp.post("/<recommendation_id>/dismiss")
@jwt_required()
def dismiss_recommendation(recommendation_id):
    current_app.extensions["recommendation_service"].dismiss(
        get_jwt_identity(), recommendation_id
    )
    return jsonify({"success": True, "data": {"dismissed": True}})