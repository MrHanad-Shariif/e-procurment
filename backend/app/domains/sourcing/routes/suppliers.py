from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.sourcing.schemas.supplier import (
    CreateSupplierSchema,
    UpdateSupplierSchema,
    UpdateSupplierStatusSchema,
)
from app.domains.sourcing.services.supplier_service import (
    create_supplier,
    delete_supplier,
    get_supplier,
    list_suppliers,
    update_supplier,
    update_supplier_status,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/v1/suppliers")


@suppliers_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("supplier.view")
def list_suppliers_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    search = request.args.get("search")
    status = request.args.get("status")
    category = request.args.get("category")
    result = list_suppliers(org_id, page, per_page, search, status, category)
    return success_response(result["items"], meta=result["meta"])


@suppliers_bp.route("/<supplier_id>", methods=["GET"])
@jwt_required()
@require_permissions("supplier.view")
def get_supplier_route(supplier_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    supplier = get_supplier(supplier_id, org_id)
    if not supplier:
        return error_response("Supplier not found", 404)
    return success_response(supplier)


@suppliers_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("supplier.create")
@validate_json(CreateSupplierSchema)
def create_supplier_route(body: CreateSupplierSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    data = body.model_dump(exclude_none=True)
    supplier = create_supplier(org_id, user_id, data)
    return success_response(supplier, status=201)


@suppliers_bp.route("/<supplier_id>", methods=["PATCH"])
@jwt_required()
@require_permissions("supplier.edit")
@validate_json(UpdateSupplierSchema)
def update_supplier_route(supplier_id: str, body: UpdateSupplierSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = body.model_dump(exclude_none=True)
    supplier = update_supplier(supplier_id, org_id, data)
    if not supplier:
        return error_response("Supplier not found", 404)
    return success_response(supplier)


@suppliers_bp.route("/<supplier_id>/status", methods=["PATCH"])
@jwt_required()
@require_permissions("supplier.approve")
@validate_json(UpdateSupplierStatusSchema)
def update_status_route(supplier_id: str, body: UpdateSupplierStatusSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    valid_statuses = {"PENDING", "APPROVED", "SUSPENDED", "BLACKLISTED"}
    if body.status not in valid_statuses:
        return error_response(f"Invalid status. Must be one of: {', '.join(valid_statuses)}", 400)
    supplier = update_supplier_status(supplier_id, org_id, user_id, body.status)
    if not supplier:
        return error_response("Supplier not found", 404)
    return success_response(supplier)


@suppliers_bp.route("/<supplier_id>", methods=["DELETE"])
@jwt_required()
@require_permissions("supplier.delete")
def delete_supplier_route(supplier_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    success, message = delete_supplier(supplier_id, org_id)
    if not success:
        return error_response(message, 400)
    return success_response({"message": message})
