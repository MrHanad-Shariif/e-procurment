from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.procurement.schemas.purchase_invoice import CreateInvoiceSchema, InvoiceActionSchema
from app.domains.procurement.services.invoice_service import (
    create_invoice,
    get_invoice,
    list_invoices,
    transition_invoice,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

invoice_bp = Blueprint("purchase_invoices", __name__, url_prefix="/api/v1/invoices")


@invoice_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("invoice.view", "invoice.view_all")
def list_invoices_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search")
    result = list_invoices(org_id, page, per_page, status, search)
    return success_response(result["items"], meta=result["meta"])


@invoice_bp.route("/<invoice_id>", methods=["GET"])
@jwt_required()
@require_permissions("invoice.view", "invoice.view_all")
def get_invoice_route(invoice_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    inv = get_invoice(invoice_id, org_id)
    if not inv:
        return error_response("Invoice not found", 404)
    return success_response(inv)


@invoice_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("invoice.create")
@validate_json(CreateInvoiceSchema)
def create_invoice_route(body: CreateInvoiceSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    data = body.model_dump()
    try:
        inv = create_invoice(org_id, user_id, data)
    except ValueError as e:
        return error_response(str(e), 400)
    return success_response(inv, status=201)


@invoice_bp.route("/<invoice_id>/action", methods=["POST"])
@jwt_required()
@require_permissions(
    "invoice.create", "invoice.approve", "invoice.override_mismatch", "invoice.pay"
)
@validate_json(InvoiceActionSchema)
def action_invoice_route(invoice_id: str, body: InvoiceActionSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()

    valid_actions = {"submit", "approve", "pay", "cancel"}
    if body.action not in valid_actions:
        return error_response(f"Invalid action. Must be one of: {', '.join(valid_actions)}", 400)

    inv = transition_invoice(invoice_id, org_id, user_id, body.action, body.notes)
    if not inv:
        return error_response("Invalid state transition or invoice not found", 400)
    return success_response(inv)
