from flask import Flask, current_app, jsonify

from app.config import Config
from app.extensions import cors, jwt


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    if app.config["ENVIRONMENT"] == "production":
        development_secrets = {
            "microlearn_dev_secret_key_change_in_prod",
            "microlearn_dev_jwt_secret_key_change_in_prod",
        }
        secrets = (app.config["SECRET_KEY"], app.config["JWT_SECRET_KEY"])
        if (
            any(
                secret in development_secrets
                or secret.startswith("replace_with_")
                or len(secret) < 32
                for secret in secrets
            )
            or secrets[0] == secrets[1]
        ):
            raise RuntimeError("Production requires distinct, unique SECRET_KEY and JWT_SECRET_KEY values.")
        if app.config["ALLOW_IN_MEMORY_DB"]:
            raise RuntimeError("In-memory database fallback must be disabled in production.")

    from app.utils.db import MongoDatabaseManager, db_manager
    from app.services.auth_service import AuthService
    from app.services.roadmap_service import RoadmapService
    from app.services.code_execution_service import DockerCodeRunner
    from app.services.learning_service import LearningService
    from app.services.assessment_service import AssessmentService
    from app.services.analytics_service import AnalyticsService
    from app.services.recommendation_service import RecommendationService
    from app.services.notification_service import NotificationService
    from app.services.admin_service import AdminService
    from app.ai.agent_service import AgentService

    app_db_manager = (
        MongoDatabaseManager(use_memory=True)
        if app.config["TESTING"]
        else db_manager
    )
    app.extensions["db_manager"] = app_db_manager
    app.extensions["auth_service"] = AuthService(app_db_manager)
    roadmap_service = RoadmapService(app_db_manager)
    code_runner = app.config.get("CODE_RUNNER") or DockerCodeRunner(
        image=app.config.get("CODE_SANDBOX_IMAGE"),
        timeout_seconds=app.config.get("CODE_TIMEOUT_SECONDS", 5),
    )
    app.extensions["roadmap_service"] = roadmap_service
    app.extensions["code_runner"] = code_runner
    agent_service = AgentService(app_db_manager)
    app.extensions["agent_service"] = agent_service
    app.extensions["learning_service"] = LearningService(
        app_db_manager, roadmap_service, code_runner, agent_service
    )
    app.extensions["assessment_service"] = AssessmentService(app_db_manager, code_runner)
    app.extensions["analytics_service"] = AnalyticsService(app_db_manager)
    app.extensions["recommendation_service"] = RecommendationService(
        app_db_manager, roadmap_service
    )
    app.extensions["notification_service"] = NotificationService(app_db_manager)
    app.extensions["admin_service"] = AdminService(app_db_manager)

    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    jwt.init_app(app)

    @jwt.token_in_blocklist_loader
    def is_token_revoked(jwt_header, jwt_payload):
        blocked = current_app.extensions["db_manager"].get_collection("token_blocklist").find_one(
            {"jti": jwt_payload["jti"]}
        )
        return blocked is not None

    @app.errorhandler(400)
    @app.errorhandler(401)
    @app.errorhandler(403)
    def handle_client_error(error):
        return jsonify({"success": False, "error": error.description}), error.code

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({"success": False, "error": "Resource not found."}), 404

    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.roadmap import roadmap_bp
    from app.routes.learning import learning_bp
    from app.routes.assessments import assessment_bp
    from app.routes.performance import performance_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.notifications import notifications_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(roadmap_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(assessment_bp)
    app.register_blueprint(performance_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(notifications_bp)

    @app.get("/api/health")
    def health():
        database_connected = bool(
            getattr(current_app.extensions["db_manager"], "is_connected", False)
        )
        return jsonify({
            "success": database_connected,
            "data": {"ready": database_connected},
        }), 200 if database_connected else 503

    return app