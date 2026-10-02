from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required


performance_bp = Blueprint("performance", __name__, url_prefix="/api/performance")


def _response(data):
    return jsonify({"success": True, "data": data})


@performance_bp.get("")
@jwt_required()
def get_performance():
    return _response(current_app.extensions["analytics_service"].get_performance(get_jwt_identity()))


@performance_bp.get("/mastery")
@jwt_required()
def get_mastery():
    return _response(current_app.extensions["analytics_service"].get_mastery_prediction(get_jwt_identity()))