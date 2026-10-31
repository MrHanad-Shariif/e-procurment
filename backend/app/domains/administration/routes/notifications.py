from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.administration.services.notification_service import (
    list_notifications,
    mark_all_read,
    mark_read,
    unread_count,
)
from app.core.response import success_response

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


@notification_bp.route("/", methods=["GET"])
@jwt_required()
def list_notifications_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    unread_only = request.args.get("unreadOnly", "false").lower() == "true"
    result = list_notifications(user_id, org_id, page, per_page, unread_only)
    return success_response(result["items"], meta=result["meta"])


@notification_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    count = unread_count(user_id, org_id)
    return success_response({"count": count})


@notification_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read_route(notification_id: str):
    user_id = get_jwt_identity()
    mark_read(notification_id, user_id)
    return success_response({"success": True})


@notification_bp.route("/mark-all-read", methods=["POST"])
@jwt_required()
def mark_all_read_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    count = mark_all_read(user_id, org_id)
    return success_response({"marked": count})
