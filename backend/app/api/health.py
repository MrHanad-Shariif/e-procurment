from flask import Blueprint

from app.core.response import success_response

health_bp = Blueprint("health", __name__, url_prefix="/api/v1/health")


@health_bp.route("/", methods=["GET"])
def health_check():
    return success_response({"status": "ok", "version": "0.1.0"})
