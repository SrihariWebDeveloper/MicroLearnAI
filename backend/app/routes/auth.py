from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from pydantic import ValidationError


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _response(data, status=200):
    return jsonify({"success": True, "data": data}), status


def _service():
    return current_app.extensions["auth_service"]


def _request_data():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("A JSON object is required.")
    return data


def _authenticated_user():
    user = _service().get_user_by_id(get_jwt_identity())
    if user is None:
        from flask import abort

        abort(401, description="The account for this token no longer exists.")
    return user


@auth_bp.post("/register")
def register():
    try:
        data = _request_data()
        result = _service().register(
            data.get("full_name"), data.get("email"), data.get("password")
        )
        return _response(result, 201)
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400


@auth_bp.post("/login")
def login():
    try:
        data = _request_data()
        return _response(_service().login(data.get("email"), data.get("password")))
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 401


@auth_bp.post("/logout")
@jwt_required()
def logout():
    token_data = get_jwt()
    current_app.extensions["db_manager"].get_collection("token_blocklist").insert_one(
        {
            "jti": token_data["jti"],
            "expires_at": datetime.fromtimestamp(token_data["exp"], timezone.utc),
        }
    )
    return _response({"logged_out": True})


@auth_bp.get("/me")
@jwt_required()
def current_user():
    return _response(_authenticated_user())


@auth_bp.put("/profile")
@jwt_required()
def update_profile():
    try:
        data = _request_data()
        user = _service().update_user(get_jwt_identity(), data.get("full_name"))
        return _response(user)
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400


@auth_bp.route("/onboarding", methods=["GET", "POST"])
@jwt_required()
def learner_profile():
    user_id = get_jwt_identity()
    if request.method == "GET":
        return _response(_service().get_learner_profile(user_id))

    try:
        profile = _service().save_learner_profile(user_id, _request_data())
        return _response(profile)
    except (ValueError, ValidationError) as error:
        message = str(error) if isinstance(error, ValueError) else "Learner profile validation failed."
        return jsonify({"success": False, "error": message}), 400