from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required


notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.get("")
@jwt_required()
def get_notifications():
    items = current_app.extensions["notification_service"].get_for_user(get_jwt_identity())
    return jsonify({"success": True, "data": items})


@notifications_bp.post("/<notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    current_app.extensions["notification_service"].mark_read(
        get_jwt_identity(), notification_id
    )
    return jsonify({"success": True, "data": {"is_read": True}})


@notifications_bp.post("/read-all")
@jwt_required()
def mark_all_read():
    current_app.extensions["notification_service"].mark_all_read(get_jwt_identity())
    return jsonify({"success": True, "data": {"is_read": True}})