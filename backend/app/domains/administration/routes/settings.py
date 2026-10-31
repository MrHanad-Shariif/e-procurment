from flask import Blueprint
from flask_jwt_extended import get_jwt, jwt_required

from app.extensions import limiter
from app.domains.administration.schemas.settings import OrgSettingsUpdateSchema, SessionSettingsSchema, SmtpSettingsSchema
from app.domains.administration.services.settings_service import (
    get_org_settings,
    get_session_settings,
    get_smtp_settings,
    update_org_settings,
    update_session_settings,
    update_smtp_settings,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

settings_bp = Blueprint("settings", __name__, url_prefix="/api/v1/settings")


@settings_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("settings.view")
def get_settings():
    claims = get_jwt()
    org_id = claims.get("org_id")
    settings = get_org_settings(org_id)
    if not settings:
        return error_response("Organization not found", 404)
    return success_response(settings)


@settings_bp.route("/", methods=["PATCH"])
@jwt_required()
@require_permissions("settings.manage")
@validate_json(OrgSettingsUpdateSchema)
def update_settings(body: OrgSettingsUpdateSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = body.model_dump(exclude_none=True)
    settings = update_org_settings(org_id, data)
    return success_response(settings)


@settings_bp.route("/smtp", methods=["GET"])
@jwt_required()
@require_permissions("settings.manage_smtp")
def get_smtp():
    claims = get_jwt()
    org_id = claims.get("org_id")
    settings = get_smtp_settings(org_id)
    if not settings:
        return error_response("Settings not found", 404)
    return success_response(settings)


@settings_bp.route("/smtp", methods=["PUT"])
@jwt_required()
@require_permissions("settings.manage_smtp")
@validate_json(SmtpSettingsSchema)
def update_smtp(body: SmtpSettingsSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = body.model_dump()
    settings = update_smtp_settings(org_id, data)
    return success_response(settings)


@settings_bp.route("/sessions", methods=["GET"])
@jwt_required()
@require_permissions("settings.manage")
def get_sessions():
    claims = get_jwt()
    org_id = claims.get("org_id")
    settings = get_session_settings(org_id)
    return success_response(settings)


@settings_bp.route("/sessions", methods=["PUT"])
@jwt_required()
@require_permissions("settings.manage")
@validate_json(SessionSettingsSchema)
def update_sessions(body: SessionSettingsSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    settings = update_session_settings(org_id, body.max_concurrent_sessions)
    return success_response(settings)
