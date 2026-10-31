from flask import Blueprint
from flask_jwt_extended import get_jwt, jwt_required

from app.domains.administration.schemas.roles import CreateRoleSchema, SetPermissionsSchema, UpdateRoleSchema
from app.domains.administration.services.role_service import (
    create_role,
    delete_role,
    get_role,
    list_permissions,
    list_roles,
    set_role_permissions,
    update_role,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

roles_bp = Blueprint("roles", __name__, url_prefix="/api/v1/roles")


@roles_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("role.view")
def list_roles_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    roles = list_roles(org_id)
    return success_response(roles)


@roles_bp.route("/<role_id>", methods=["GET"])
@jwt_required()
@require_permissions("role.view")
def get_role_route(role_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    role = get_role(role_id, org_id)
    if not role:
        return error_response("Role not found", 404)
    return success_response(role)


@roles_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("role.create")
@validate_json(CreateRoleSchema)
def create_role_route(body: CreateRoleSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    role = create_role(org_id, body.name, body.slug, body.description, body.permission_ids)
    return success_response(role, status=201)


@roles_bp.route("/<role_id>", methods=["PATCH"])
@jwt_required()
@require_permissions("role.edit")
@validate_json(UpdateRoleSchema)
def update_role_route(role_id: str, body: UpdateRoleSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = body.model_dump(exclude_none=True)
    role = update_role(role_id, org_id, data)
    if not role:
        return error_response("Role not found", 404)
    return success_response(role)


@roles_bp.route("/<role_id>", methods=["DELETE"])
@jwt_required()
@require_permissions("role.delete")
def delete_role_route(role_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    success, message = delete_role(role_id, org_id)
    if not success:
        return error_response(message, 400)
    return success_response({"message": message})


@roles_bp.route("/<role_id>/permissions", methods=["PUT"])
@jwt_required()
@require_permissions("role.edit")
@validate_json(SetPermissionsSchema)
def set_permissions_route(role_id: str, body: SetPermissionsSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    role = set_role_permissions(role_id, org_id, body.permission_ids)
    if not role:
        return error_response("Role not found", 404)
    return success_response(role)


@roles_bp.route("/permissions", methods=["GET"])
@jwt_required()
@require_permissions("role.view")
def list_permissions_route():
    permissions = list_permissions()
    return success_response(permissions)
