from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.domains.administration.services.audit_service import list_audit_logs
from app.core.decorators import require_permissions
from app.core.response import success_response

audit_bp = Blueprint("audit", __name__, url_prefix="/api/v1/audit")


@audit_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("settings.manage")
def list_logs():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 50, type=int)
    entity_type = request.args.get("entityType")
    entity_id = request.args.get("entityId")
    user_id = request.args.get("userId")

    result = list_audit_logs(org_id, entity_type, entity_id, user_id, page, per_page)
    return success_response(result["items"], meta=result["meta"])
