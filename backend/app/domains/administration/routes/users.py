from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.domains.administration.schemas.users import AssignRolesSchema, CreateUserSchema, UpdateUserSchema
from app.domains.identity.services.auth_service import create_user
from app.domains.administration.services.user_service import (
    get_user,
    get_user_sessions,
    list_users,
    revoke_user_session,
    toggle_user_active,
    update_user,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


@users_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("user.view")
def list_users_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    search = request.args.get("search")
    result = list_users(org_id, page, per_page, search)
    return success_response(result["items"], meta=result["meta"])


@users_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
@require_permissions("user.view")
def get_user_route(user_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user = get_user(user_id, org_id)
    if not user:
        return error_response("User not found", 404)
    return success_response(user)


@users_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("user.create")
@validate_json(CreateUserSchema)
def create_user_route(body: CreateUserSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    try:
        user = create_user(
            email=body.email,
            password=body.password,
            first_name=body.first_name,
            last_name=body.last_name,
            role_ids=body.role_ids,
            org_id=org_id,
            preferred_language=body.preferred_language,
        )
    except ValueError as e:
        return error_response(str(e), 409)
    return success_response(user, status=201)


@users_bp.route("/<user_id>", methods=["PATCH"])
@jwt_required()
@require_permissions("user.edit")
@validate_json(UpdateUserSchema)
def update_user_route(user_id: str, body: UpdateUserSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = body.model_dump(exclude_none=True)
    user = update_user(user_id, org_id, data)
    if not user:
        return error_response("User not found", 404)
    return success_response(user)


@users_bp.route("/<user_id>/activate", methods=["PATCH"])
@jwt_required()
@require_permissions("user.deactivate")
def toggle_active_route(user_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user = toggle_user_active(user_id, org_id)
    if not user:
        return error_response("User not found", 404)
    return success_response(user)


@users_bp.route("/<user_id>/sessions", methods=["GET"])
@jwt_required()
@require_permissions("user.view")
def list_sessions_route(user_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    sessions = get_user_sessions(user_id, org_id)
    return success_response(sessions)


@users_bp.route("/<user_id>/sessions/<session_id>", methods=["DELETE"])
@jwt_required()
@require_permissions("user.edit")
def revoke_session_route(user_id: str, session_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    revoked = revoke_user_session(user_id, session_id, org_id)
    if not revoked:
        return error_response("Session not found", 404)
    return success_response({"message": "Session revoked"})
