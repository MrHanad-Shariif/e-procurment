"""TenderRank API using shared JWTs, organizations, permissions and SQLAlchemy."""

from datetime import datetime, timezone
from pathlib import Path
from functools import wraps
from flask import Blueprint, abort, current_app, request, send_file
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.entities import User, Supplier, PurchaseRequisition, PurchaseOrder, Notification
from app.models.tendering import (
    Tender,
    TenderRequirement,
    Proposal,
    ProposalRequirement,
    ContactMessage,
    TenderAward,
    EvaluationRun,
    Inquiry,
)
from app.domains.sourcing.services.tendering_service import profile_dict, save_upload
from app.domains.administration.services.audit_service import log_action
from app.core.response import success_response, error_response

tendering_bp = Blueprint("tendering", __name__, url_prefix="/api/v1/tendering")


def access(permission):
    def decorate(fn):
        @wraps(fn)
        @jwt_required()
        def wrapped(*args, **kwargs):
            if permission not in get_jwt().get("permissions", []):
                return error_response("Insufficient permissions", 403)
            user = db.session.get(User, get_jwt_identity())
            if not user or not user.isActive or user.orgId != get_jwt().get("org_id"):
                return error_response("Account is unavailable", 401)
            return fn(user, *args, **kwargs)

        return wrapped

    return decorate


def scoped(model, identifier, org_id):
    row = db.session.scalar(select(model).where(model.id == identifier, model.org_id == org_id))
    if row is None:
        abort(404)
    return row


def body():
    return request.get_json(silent=True) or request.form.to_dict()


def parse_deadline(value):
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


@tendering_bp.get("/profile")
@access("tender.view")
def profile(user):
    return success_response(profile_dict(user))


@tendering_bp.patch("/profile")
@access("tender.view")
def update_profile(user):
    allowed = {
        "company_name",
        "company_type",
        "registration_number",
        "year_established",
        "country",
        "city",
        "address",
        "phone",
        "contact_person",
        "industry",
        "business_description",
        "main_services",
        "website",
    }
    user.profile = {**(user.profile or {}), **{k: v for k, v in body().items() if k in allowed}}
    return success_response(profile_dict(user))


@tendering_bp.get("/tenders/public")
def public_tenders():
    rows = db.session.scalars(
        select(Tender)
        .where(Tender.approval_status == "approved")
        .order_by(Tender.created_at.desc())
    )
    return success_response([row.to_dict(public=True) for row in rows])


@tendering_bp.get("/tenders/public/<identifier>")
def public_tender(identifier):
    row = db.session.scalar(
        select(Tender).where(Tender.id == identifier, Tender.approval_status == "approved")
    )
    if row is None:
        return error_response("Tender not found", 404)
    return success_response(row.to_dict(public=True))


@tendering_bp.get("/stats/public")
def public_stats():
    tenders = list(db.session.scalars(select(Tender).where(Tender.approval_status == "approved")))
    return success_response(
        {
            "total_tenders": len(tenders),
            "active_tenders": len(tenders),
            "total_suppliers": 0,
            "total_proposals": 0,
        }
    )


@tendering_bp.get("/tenders")
@access("tender.view")
def tenders(user):
    query = select(Tender).where(Tender.org_id == user.orgId)
    if user.supplierId:
        query = query.where(Tender.approval_status == "approved")
    return success_response(
        [
            row.to_dict(public=bool(user.supplierId))
            for row in db.session.scalars(query.order_by(Tender.created_at.desc()))
        ]
    )


@tendering_bp.get("/tenders/<identifier>")
@access("tender.view")
def tender(user, identifier):
    row = scoped(Tender, identifier, user.orgId)
    if user.supplierId and row.approval_status != "approved":
        abort(404)
    return success_response(row.to_dict(public=bool(user.supplierId)))


@tendering_bp.post("/tenders")
@access("tender.create")
def create_tender(user):
    data = body()
    if not str(data.get("title", "")).strip():
        return error_response("Title is required", 422)
    requisition = data.get("requisition_id")
    if requisition:
        source = db.session.scalar(
            select(PurchaseRequisition).where(
                PurchaseRequisition.id == requisition,
                PurchaseRequisition.orgId == user.orgId,
                PurchaseRequisition.status == "APPROVED",
            )
        )
        if source is None:
            return error_response("Select an approved requisition in this workspace", 422)
    row = Tender(
        org_id=user.orgId,
        title=data["title"].strip(),
        description=data.get("description"),
        sector=data.get("sector"),
        deadline=parse_deadline(data.get("deadline")),
        created_by_id=user.id,
        requisition_id=requisition,
        pdf_path=save_upload(request.files.get("file"), "tenders", user.orgId),
    )
    db.session.add(row)
    db.session.flush()
    for item in data.get("requirements", []) if isinstance(data.get("requirements"), list) else []:
        row.requirements.append(
            TenderRequirement(
                requirement_name=item["requirement_name"],
                display_label=item.get("display_label"),
                points=int(item.get("points", 0)),
                is_mandatory=bool(item.get("is_mandatory", False)),
            )
        )
    log_action("CREATE", "tender", row.id)
    return success_response(row.to_dict(), status=201)


@tendering_bp.patch("/tenders/<identifier>")
@access("tender.edit")
def update_tender(user, identifier):
    row = scoped(Tender, identifier, user.orgId)
    if row.approval_status not in {"draft", "rejected"}:
        return error_response("Only drafts may be edited", 409)
    data = body()
    for key in ["title", "description", "sector"]:
        if key in data:
            setattr(row, key, data[key])
    if "deadline" in data:
        row.deadline = parse_deadline(data["deadline"])
    if "requirements" in data:
        row.requirements.clear()
        for item in data["requirements"]:
            if not item.get("requirement_name", "").strip() or int(item.get("points", 0)) < 0:
                return error_response(
                    "Each criterion needs a description and non-negative points", 422
                )
            row.requirements.append(
                TenderRequirement(
                    requirement_name=item["requirement_name"],
                    display_label=item.get("display_label"),
                    points=int(item.get("points", 0)),
                    is_mandatory=bool(item.get("is_mandatory", False)),
                )
            )
    return success_response(row.to_dict())


@tendering_bp.delete("/tenders/<identifier>")
@access("tender.edit")
def delete_tender(user, identifier):
    row = scoped(Tender, identifier, user.orgId)
    if row.approval_status != "draft" or row.proposals:
        return error_response("Only unused drafts may be deleted", 409)
    db.session.delete(row)
    return success_response({"message": "Draft deleted"})


@tendering_bp.patch("/tenders/<identifier>/submit")
@access("tender.create")
def submit_tender(user, identifier):
    row = scoped(Tender, identifier, user.orgId)
    if row.approval_status not in {"draft", "rejected"}:
        return error_response("Invalid transition", 409)
    if not row.requirements:
        return error_response("Add and review evaluation requirements before submission", 422)
    row.approval_status = "pending"
    row.submitted_at = datetime.now(timezone.utc)
    row.rejection_reason = None
    log_action("SUBMIT", "tender", row.id)
    return success_response(row.to_dict())


@tendering_bp.get("/super-admin/queue")
@access("tender.approve")
def approval_queue(user):
    rows = db.session.scalars(
        select(Tender).where(Tender.org_id == user.orgId, Tender.approval_status == "pending")
    )
    return success_response(
        [
            {
                **row.to_dict(),
                "created_by_name": profile_dict(row.created_by)["name"] if row.created_by else "",
            }
            for row in rows
        ]
    )


@tendering_bp.post("/super-admin/tenders/<identifier>/<action>")
@access("tender.approve")
def review_tender(user, identifier, action):
    row = scoped(Tender, identifier, user.orgId)
    transitions = {
        "approve": ("pending", "approved"),
        "reject": ("pending", "rejected"),
        "unpublish": ("approved", "pending"),
    }
    if action not in transitions or row.approval_status != transitions[action][0]:
        return error_response("Invalid transition", 409)
    row.approval_status = transitions[action][1]
    row.reviewed_at = datetime.now(timezone.utc)
    row.rejection_reason = body().get("reason") if action == "reject" else None
    log_action(action.upper(), "tender", row.id)
    return success_response(row.to_dict())


@tendering_bp.get("/proposals")
@access("tender.view")
def proposals(user):
    query = select(Proposal).where(Proposal.org_id == user.orgId)
    if user.supplierId:
        query = query.where(Proposal.supplier_id == user.supplierId)
    return success_response(
        [row.to_dict() for row in db.session.scalars(query.order_by(Proposal.submitted_at.desc()))]
    )


@tendering_bp.post("/proposals")
@access("tender.submit_proposal")
def submit_proposal(user):
    if not user.supplierId:
        return error_response("A supplier membership is required", 403)
    row = scoped(Tender, body().get("tender_id"), user.orgId)
    if row.approval_status != "approved" or (
        row.deadline and row.deadline <= datetime.now(timezone.utc)
    ):
        return error_response("Tender is not open for submissions", 409)
    if db.session.scalar(
        select(Proposal.id).where(
            Proposal.tender_id == row.id, Proposal.supplier_id == user.supplierId
        )
    ):
        return error_response("Your supplier has already submitted a proposal", 409)
    path = save_upload(request.files.get("file"), "proposals", user.orgId)
    if not path:
        return error_response("A proposal document is required", 422)
    proposal = Proposal(
        org_id=user.orgId,
        tender_id=row.id,
        supplier_id=user.supplierId,
        submitted_by_id=user.id,
        pdf_path=path,
    )
    db.session.add(proposal)
    db.session.flush()
    return success_response(proposal.to_dict(), status=201)


@tendering_bp.route("/proposals/<identifier>", methods=["GET", "PATCH", "DELETE"])
@access("tender.view")
def proposal(user, identifier):
    row = scoped(Proposal, identifier, user.orgId)
    if user.supplierId and row.supplier_id != user.supplierId:
        abort(404)
    if request.method != "GET":
        if not user.supplierId or row.supplier_id != user.supplierId:
            return error_response("Only the submitting supplier may change this proposal", 403)
        if row.tender.screening_status != "not_started" or (
            row.tender.deadline and row.tender.deadline <= datetime.now(timezone.utc)
        ):
            return error_response("Submission is locked", 409)
        if request.method == "DELETE":
            db.session.delete(row)
            return success_response({"message": "Proposal withdrawn"})
        row.pdf_path = (
            save_upload(request.files.get("file"), "proposals", user.orgId) or row.pdf_path
        )
    return success_response(row.to_dict())


@tendering_bp.get("/rankings/<identifier>")
@access("tender.evaluate")
def rankings(user, identifier):
    row = scoped(Tender, identifier, user.orgId)
    results = sorted(row.proposals, key=lambda item: item.score, reverse=True)
    return success_response(
        {
            "tender": row.to_dict(),
            "tender_title": row.title,
            "screening_status": row.screening_status,
            "rankings": [
                {
                    **item.to_dict(),
                    "rank": index + 1,
                    "proposal_id": item.id,
                    "supplier": {
                        "id": item.supplier_id,
                        "name": item.supplier.name,
                        "email": item.supplier.email,
                    },
                }
                for index, item in enumerate(results)
            ],
        }
    )


@tendering_bp.post("/tenders/<identifier>/start-screening")
@tendering_bp.post("/tenders/<identifier>/rescore")
@access("tender.evaluate")
def screening(user, identifier):
    import os

    row = scoped(Tender, identifier, user.orgId)
    if (
        os.getenv("AI_PROVIDER", "disabled") == "disabled"
        or not os.getenv("AI_API_KEY")
        or not os.getenv("AI_MODEL")
    ):
        return error_response("Configure an AI provider and model before starting evaluation", 503)
    if not row.requirements:
        return error_response("Review and save tender requirements first", 422)
    db.session.add(
        EvaluationRun(
            org_id=user.orgId,
            tender_id=row.id,
            provider=os.getenv("AI_PROVIDER"),
            model=os.getenv("AI_MODEL"),
        )
    )
    row.screening_status = "in_progress"
    row.screening_started_at = datetime.now(timezone.utc)
    return success_response({"message": "Evaluation queued"}, status=202)


@tendering_bp.get("/tenders/<identifier>/evaluations")
@access("tender.evaluate")
def evaluations(user, identifier):
    scoped(Tender, identifier, user.orgId)
    rows = db.session.scalars(
        select(EvaluationRun)
        .where(EvaluationRun.org_id == user.orgId, EvaluationRun.tender_id == identifier)
        .order_by(EvaluationRun.created_at.desc())
    )
    return success_response(
        [
            {
                "id": row.id,
                "status": row.status,
                "provider": row.provider,
                "model": row.model,
                "result": row.result,
                "error": row.error,
            }
            for row in rows
        ]
    )


@tendering_bp.post("/proposals/<identifier>/award")
@access("tender.award")
def award(user, identifier):
    row = scoped(Proposal, identifier, user.orgId)
    data = body()
    if not data.get("reason") or not data.get("items"):
        return error_response("Award reason and order items are required", 422)
    # Lock the proposal so concurrent requests cannot create duplicate orders.
    db.session.execute(select(Proposal).where(Proposal.id == row.id).with_for_update())
    existing = db.session.scalar(select(TenderAward).where(TenderAward.proposal_id == row.id))
    if existing:
        return success_response({"purchaseOrderId": existing.purchase_order_id})
    if row.tender.screening_status != "completed":
        return error_response("Complete evaluation before awarding", 409)
    if row.red_flags:
        return error_response("Resolve mandatory eligibility failures before awarding", 409)
    supplier = db.session.scalar(
        select(Supplier).where(
            Supplier.id == row.supplier_id,
            Supplier.orgId == user.orgId,
            Supplier.status == "APPROVED",
        )
    )
    if supplier is None:
        return error_response("Supplier must be approved", 409)
    from app.domains.procurement.services.po_service import create_po
    from app.domains.procurement.schemas.purchase_order import CreatePoSchema

    order = CreatePoSchema(
        **{
            "supplier_id": supplier.id,
            "currency": data.get("currency", "USD"),
            "notes": f"Tender {row.tender_id}; award: {data['reason']}",
            "items": data["items"],
        }
    )
    if any(item.quantity <= 0 or item.unit_price < 0 for item in order.items):
        return error_response(
            "Order quantities must be positive and prices cannot be negative", 422
        )
    po = create_po(user.orgId, user.id, order.model_dump())
    db.session.add(
        TenderAward(
            org_id=user.orgId,
            proposal_id=row.id,
            purchase_order_id=po["id"],
            approved_by_id=user.id,
            reason=data["reason"],
        )
    )
    row.status = "approved"
    log_action("AWARD", "proposal", row.id, new_data={"purchaseOrderId": po["id"]})
    return success_response({"purchaseOrderId": po["id"]}, status=201)


@tendering_bp.get("/admin/stats")
@tendering_bp.get("/super-admin/stats")
@access("tender.create")
def statistics(user):
    tenders = list(db.session.scalars(select(Tender).where(Tender.org_id == user.orgId)))
    proposals = list(db.session.scalars(select(Proposal).where(Proposal.org_id == user.orgId)))
    users = list(db.session.scalars(select(User).where(User.orgId == user.orgId)))
    scores = [row.score for row in proposals]
    return success_response(
        {
            "total_tenders": len(tenders),
            "active_tenders": sum(row.approval_status == "approved" for row in tenders),
            "pipeline": {
                status: sum(row.approval_status == status for row in tenders)
                for status in ["draft", "pending", "approved", "rejected"]
            },
            "pending_tenders": sum(row.approval_status == "pending" for row in tenders),
            "approved_tenders": sum(row.approval_status == "approved" for row in tenders),
            "rejected_tenders": sum(row.approval_status == "rejected" for row in tenders),
            "draft_tenders": sum(row.approval_status == "draft" for row in tenders),
            "total_admins": sum(not row.supplierId for row in users),
            "total_suppliers": sum(bool(row.supplierId) for row in users),
            "total_proposals": len(proposals),
            "pending_proposals": sum(row.status == "under_review" for row in proposals),
            "approved_proposals": sum(row.status == "approved" for row in proposals),
            "rejected_proposals": sum(row.status == "rejected" for row in proposals),
            "top_score": max(scores, default=0),
            "avg_score": sum(scores) / len(scores) if scores else 0,
            "recent_proposals": [row.to_dict() for row in proposals[-5:]],
            "recent_tenders": [row.to_dict() for row in tenders[-5:]],
        }
    )


@tendering_bp.get("/notifications")
@access("tender.view")
def notifications(user):
    rows = db.session.scalars(
        select(Notification).where(Notification.orgId == user.orgId, Notification.userId == user.id)
    )
    return success_response(
        [
            {
                "id": row.id,
                "title": row.title,
                "body": row.message,
                "type": row.type,
                "is_read": row.isRead,
                "created_at": row.createdAt.isoformat(),
            }
            for row in rows
        ]
    )


@tendering_bp.patch("/notifications/<identifier>/read")
@tendering_bp.patch("/notifications/read-all")
@access("tender.view")
def read_notifications(user, identifier=None):
    query = select(Notification).where(
        Notification.orgId == user.orgId, Notification.userId == user.id
    )
    if identifier:
        query = query.where(Notification.id == identifier)
    for row in db.session.scalars(query):
        row.isRead = True
    return success_response({"message": "Notifications read"})


@tendering_bp.get("/documents/<path:relative>")
@access("tender.view")
def document(user, relative):
    # Authorization follows the owning document, not a guessable file path.
    tender = db.session.scalar(
        select(Tender).where(Tender.org_id == user.orgId, Tender.pdf_path == relative)
    )
    proposal = db.session.scalar(
        select(Proposal).where(Proposal.org_id == user.orgId, Proposal.pdf_path == relative)
    )
    allowed = (tender and (not user.supplierId or tender.approval_status == "approved")) or (
        proposal and (not user.supplierId or proposal.supplier_id == user.supplierId)
    )
    if not allowed:
        abort(404)
    root = Path(current_app.config["UPLOAD_FOLDER"]).resolve()
    target = (root / relative).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        abort(404)
    return send_file(target, as_attachment=True)


def public_org():
    from app.models.entities import Organization

    slug = request.headers.get("X-Org-Slug", "default")
    org = db.session.scalar(
        select(Organization).where(Organization.slug == slug, Organization.isActive.is_(True))
    )
    if org is None:
        abort(404)
    return org


@tendering_bp.post("/register")
def register_supplier():
    from app.domains.identity.services.auth_service import create_user
    from app.models.entities import Role

    data = body()
    if not all(data.get(key) for key in ["name", "email", "password"]):
        return error_response("Name, email and password are required", 422)
    if len(data["password"]) < 8:
        return error_response("Use a password of at least eight characters", 422)
    org = public_org()
    role = db.session.scalar(select(Role).where(Role.orgId == org.id, Role.slug == "supplier"))
    if not role:
        return error_response("Supplier registration is unavailable in this workspace", 409)
    parts = data["name"].split(" ", 1)
    try:
        result = create_user(
            data["email"],
            data["password"],
            parts[0],
            parts[1] if len(parts) > 1 else "",
            [role.id],
            org.id,
        )
    except ValueError as error:
        return error_response(str(error), 409)
    supplier = db.session.scalar(
        select(Supplier).where(Supplier.orgId == org.id, Supplier.email == data["email"])
    )
    if supplier:
        return error_response(
            "A supplier with this email exists; ask an administrator to link your account", 409
        )
    supplier = Supplier(
        orgId=org.id,
        name=data["name"],
        email=data["email"],
        status="PENDING",
        createdById=result["id"],
    )
    db.session.add(supplier)
    db.session.flush()
    db.session.get(User, result["id"]).supplierId = supplier.id
    return success_response(
        {"message": "Account created. Sign in using your chosen password.", "email_sent": False},
        status=201,
    )


@tendering_bp.get("/admin/suppliers/<identifier>")
@access("supplier.view")
def supplier_profile(user, identifier):
    supplier = db.session.scalar(
        select(Supplier).where(Supplier.id == identifier, Supplier.orgId == user.orgId)
    )
    if not supplier:
        abort(404)
    account = db.session.scalar(
        select(User).where(User.supplierId == supplier.id, User.orgId == user.orgId)
    )
    return success_response(
        profile_dict(account)
        if account
        else {"id": supplier.id, "name": supplier.name, "email": supplier.email}
    )


@tendering_bp.get("/super-admin/users")
@access("user.view")
def users(user):
    return success_response(
        [
            profile_dict(row)
            for row in db.session.scalars(select(User).where(User.orgId == user.orgId))
        ]
    )


@tendering_bp.post("/contact")
def contact():
    data = body()
    if not all(data.get(key) for key in ["name", "email", "message"]):
        return error_response("Name, email and message are required", 422)
    db.session.add(
        ContactMessage(
            org_id=public_org().id,
            **{key: data.get(key) for key in ["name", "email", "subject", "message"]},
        )
    )
    return success_response({"message": "Message received"}, status=201)


@tendering_bp.get("/super-admin/messages")
@access("settings.manage")
def messages(user):
    rows = list(
        db.session.scalars(
            select(ContactMessage)
            .where(ContactMessage.org_id == user.orgId)
            .order_by(ContactMessage.created_at.desc())
        )
    )
    return success_response(
        {
            "messages": [
                {
                    "id": row.id,
                    "name": row.name,
                    "email": row.email,
                    "subject": row.subject,
                    "message": row.message,
                    "is_read": row.is_read,
                    "created_at": row.created_at.isoformat(),
                }
                for row in rows
            ],
            "unread": sum(not row.is_read for row in rows),
        }
    )


@tendering_bp.patch("/super-admin/messages/<identifier>/read")
@tendering_bp.patch("/super-admin/messages/read-all")
@access("settings.manage")
def read_messages(user, identifier=None):
    query = select(ContactMessage).where(ContactMessage.org_id == user.orgId)
    if identifier:
        query = query.where(ContactMessage.id == identifier)
    for row in db.session.scalars(query):
        row.is_read = True
    return success_response({"message": "Messages read"})


@tendering_bp.post("/public/inquiries")
def inquiry():
    data = body()
    if not all(data.get(key) for key in ["email", "contact_name", "company_name"]):
        return error_response("Contact, email and company are required", 422)
    org = public_org()
    row = Inquiry(
        org_id=org.id,
        email=data["email"],
        contact_name=data["contact_name"],
        company_name=data["company_name"],
        profile_path=save_upload(request.files.get("file"), "inquiries", org.id),
        details={"website": data.get("website"), "verdict": "not_checked"},
    )
    db.session.add(row)
    db.session.flush()
    return success_response(row.to_dict(), status=201)


@tendering_bp.get("/super-admin/inquiries")
@access("settings.manage")
def inquiries(user):
    return success_response(
        [
            row.to_dict()
            for row in db.session.scalars(select(Inquiry).where(Inquiry.org_id == user.orgId))
        ]
    )


@tendering_bp.post("/super-admin/inquiries/<identifier>/<action>")
@access("settings.manage")
def review_inquiry(user, identifier, action):
    row = scoped(Inquiry, identifier, user.orgId)
    if action == "reverify":
        return error_response("Company verification is not configured", 503)
    if row.status != "pending" or action not in {"approve", "reject"}:
        return error_response("Invalid transition", 409)
    if action == "approve":
        import secrets

        temporary_password = secrets.token_urlsafe(18)
        account = provision_user(
            user,
            {
                "name": row.contact_name,
                "email": row.email,
                "password": temporary_password,
                "role": "admin",
            },
        )
        account.profile = {
            **(account.profile or {}),
            "company_name": row.company_name,
            "must_change_password": True,
        }
        row.status = "approved"
        row.reviewed_at = datetime.now(timezone.utc)
        log_action("APPROVE", "inquiry", row.id)
        return success_response(
            {
                "message": "Procurement officer account created",
                "email_sent": False,
                "credentials": {"email": row.email, "temporary_password": temporary_password},
            }
        )
    row.status = "rejected"
    row.rejection_reason = body().get("reason")
    row.reviewed_at = datetime.now(timezone.utc)
    return success_response(row.to_dict())


def provision_user(actor, data):
    if "user.create" not in get_jwt().get("permissions", []):
        abort(403)
    from app.models.entities import Role
    from app.domains.identity.services.auth_service import create_user

    if not all(data.get(key) for key in ["name", "email", "password"]):
        raise ValueError("Name, email and password are required")
    if len(data["password"]) < 10 or len(data["password"].encode()) > 72:
        raise ValueError("Use a password of 10 to 72 UTF-8 bytes")
    role_slug = {
        "admin": "procurement-officer",
        "super_admin": "admin",
        "supplier": "supplier",
    }.get(data.get("role"))
    if not role_slug:
        raise ValueError("Select a valid role")
    if role_slug == "admin" and "role.edit" not in get_jwt().get("permissions", []):
        abort(403)
    role = db.session.scalar(select(Role).where(Role.orgId == actor.orgId, Role.slug == role_slug))
    if role is None:
        raise ValueError("Role is unavailable")
    parts = data["name"].split(" ", 1)
    result = create_user(
        data["email"],
        data["password"],
        parts[0],
        parts[1] if len(parts) > 1 else "",
        [role.id],
        actor.orgId,
    )
    account = db.session.get(User, result["id"])
    account.profile = {"must_change_password": True}
    if role_slug == "supplier":
        supplier = Supplier(
            orgId=actor.orgId,
            name=data["name"],
            email=data["email"],
            status="PENDING",
            createdById=actor.id,
        )
        db.session.add(supplier)
        db.session.flush()
        account.supplierId = supplier.id
    return account


@tendering_bp.post("/super-admin/users")
@access("user.create")
def create_portal_user(user):
    account = provision_user(user, body())
    log_action("CREATE", "user", account.id)
    return success_response(profile_dict(account), status=201)


@tendering_bp.post("/auth/change-password")
@access("tender.view")
def change_password(user):
    from app.domains.identity.services.auth_service import verify_password, hash_password
    from app.models.entities import Session

    data = body()
    if not verify_password(data.get("current_password", ""), user.passwordHash):
        return error_response("Current password is incorrect", 422)
    value = data.get("new_password", "")
    if len(value) < 10 or len(value.encode()) > 72:
        return error_response("Use a password of 10 to 72 UTF-8 bytes", 422)
    user.passwordHash = hash_password(value)
    user.profile = {**(user.profile or {}), "must_change_password": False}
    for session in db.session.scalars(select(Session).where(Session.userId == user.id)):
        db.session.delete(session)
    log_action("PASSWORD_CHANGE", "user", user.id)
    return success_response(
        {"message": "Password updated; sign in again", "user": profile_dict(user)}
    )


@tendering_bp.post("/proposals/<identifier>/review")
@access("tender.evaluate")
def manual_review(user, identifier):
    row = scoped(Proposal, identifier, user.orgId)
    data = body()
    if not data.get("reason"):
        return error_response("A review justification is required", 422)
    if db.session.scalar(select(TenderAward.id).where(TenderAward.proposal_id == row.id)):
        return error_response("An awarded proposal cannot be rescored", 409)
    expected = {criterion.id: criterion for criterion in row.tender.requirements}
    results = data.get("results", [])
    if (
        not expected
        or {item.get("criterionId") for item in results} != set(expected)
        or len(results) != len(expected)
    ):
        return error_response("Review each published criterion exactly once", 422)
    validated = []
    for item in results:
        criterion = expected[item["criterionId"]]
        points = float(item.get("points", -1))
        if points < 0 or points > criterion.points or not item.get("evidence", "").strip():
            return error_response("Points must fit the criterion and evidence is required", 422)
        validated.append((criterion, item, points))
    row.requirements.clear()
    mandatory_failures = []
    for criterion, item, points in validated:
        passed = bool(item.get("met"))
        if criterion.is_mandatory and not passed:
            mandatory_failures.append(criterion.requirement_name)
        row.requirements.append(
            ProposalRequirement(
                requirement_name=criterion.requirement_name,
                display_label=criterion.display_label,
                detected=passed,
                is_mandatory=criterion.is_mandatory,
                points_earned=points,
                points_possible=criterion.points,
                matched_text=item["evidence"],
                verdict="met" if passed else "not_met",
                confidence=1,
            )
        )
    maximum = sum(criterion.points for criterion in expected.values())
    row.score = (
        round(sum(points for _, _, points in validated) / maximum * 100, 2) if maximum else 0
    )
    row.red_flags = mandatory_failures
    row.tender.screening_status = (
        "completed"
        if all(p.id == row.id or p.requirements for p in row.tender.proposals)
        else "in_progress"
    )
    db.session.add(
        EvaluationRun(
            org_id=user.orgId,
            tender_id=row.tender_id,
            status="completed",
            provider="human",
            model="manual-review-v1",
        )
    )
    log_action(
        "REVIEW", "proposal", row.id, new_data={"score": row.score, "reason": data["reason"]}
    )
    return success_response(row.to_dict())


@tendering_bp.patch("/proposals/<identifier>/status")
@access("tender.award")
def proposal_status(user, identifier):
    row = scoped(Proposal, identifier, user.orgId)
    status = body().get("status")
    if status not in {"approved", "rejected", "under_review"}:
        return error_response("Invalid proposal status", 422)
    if row.tender.screening_status != "completed":
        return error_response("Complete the evaluation first", 409)
    row.status = status
    log_action("STATUS_CHANGE", "proposal", row.id, new_data={"status": status})
    return success_response(row.to_dict())
