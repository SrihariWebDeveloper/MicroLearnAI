from functools import wraps

from flask import Blueprint, abort, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(view):
    @wraps(view)
    @jwt_required()
    def wrapped(*args, **kwargs):
        user = current_app.extensions["auth_service"].get_user_by_id(get_jwt_identity())
        if user is None or user.get("role") != "admin":
            abort(403, description="Administrator access is required.")
        return view(*args, **kwargs)

    return wrapped


@admin_bp.get("/status")
@admin_required
def status():
    return jsonify({"success": True, "data": current_app.extensions["admin_service"].get_status()})


@admin_bp.get("/users")
@admin_required
def list_users():
    return jsonify({"success": True, "data": current_app.extensions["admin_service"].list_users()})


@admin_bp.patch("/users/<user_id>/role")
@admin_required
def update_user_role(user_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    try:
        updated = current_app.extensions["admin_service"].update_role(
            get_jwt_identity(), user_id, data.get("role")
        )
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    if not updated:
        return jsonify({"success": False, "error": "User not found."}), 404
    return jsonify({"success": True, "data": {"updated": True}})