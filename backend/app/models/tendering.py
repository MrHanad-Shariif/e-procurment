"""Organization-scoped tendering models sharing procurement identities."""

from app.extensions import db
from app.models.entities import new_id, utcnow


class Tender(db.Model):
    __tablename__ = "tenders"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    org_id = db.Column(db.Text, db.ForeignKey("organizations.id"), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    sector = db.Column(db.Text)
    pdf_path = db.Column(db.Text)
    deadline = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    created_by_id = db.Column(db.Text, db.ForeignKey("users.id"))
    requisition_id = db.Column(db.Text, db.ForeignKey("purchase_requisitions.id"))
    approval_status = db.Column(db.Text, default="draft", nullable=False)
    rejection_reason = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime(timezone=True))
    reviewed_at = db.Column(db.DateTime(timezone=True))
    screening_status = db.Column(db.Text, default="not_started", nullable=False)
    screening_started_at = db.Column(db.DateTime(timezone=True))
    results_notified_at = db.Column(db.DateTime(timezone=True))
    created_by = db.relationship("User", foreign_keys=[created_by_id])
    requirements = db.relationship(
        "TenderRequirement", backref="tender", cascade="all, delete-orphan"
    )
    proposals = db.relationship("Proposal", backref="tender", cascade="all, delete-orphan")

    def to_dict(self, public=False):
        from app.domains.sourcing.services.tendering_service import profile_dict

        result = {
            key: getattr(self, key)
            for key in [
                "id",
                "title",
                "description",
                "sector",
                "approval_status",
                "screening_status",
            ]
        }
        for key in [
            "deadline",
            "created_at",
            "submitted_at",
            "reviewed_at",
            "screening_started_at",
            "results_notified_at",
        ]:
            result[key] = getattr(self, key).isoformat() if getattr(self, key) else None
        result["requirements"] = [row.to_dict() for row in self.requirements]
        result["pdf_path"] = self.pdf_path
        result["organizationId"] = self.org_id
        if not public:
            result.update(
                pdf_path=self.pdf_path,
                created_by_id=self.created_by_id,
                requisition_id=self.requisition_id,
                rejection_reason=self.rejection_reason,
                proposals_count=len(self.proposals),
                created_by=profile_dict(self.created_by) if self.created_by else None,
            )
        return result


class TenderRequirement(db.Model):
    __tablename__ = "tender_requirements"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    tender_id = db.Column(db.Text, db.ForeignKey("tenders.id"), nullable=False, index=True)
    requirement_name = db.Column(db.Text, nullable=False)
    display_label = db.Column(db.Text)
    points = db.Column(db.Integer, default=0, nullable=False)
    is_mandatory = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "tender_id": self.tender_id,
            "requirement_name": self.requirement_name,
            "display_label": self.display_label or self.requirement_name.replace("_", " ").title(),
            "points": self.points,
            "is_mandatory": self.is_mandatory,
        }


class Proposal(db.Model):
    __tablename__ = "proposals"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    org_id = db.Column(db.Text, db.ForeignKey("organizations.id"), nullable=False, index=True)
    tender_id = db.Column(db.Text, db.ForeignKey("tenders.id"), nullable=False, index=True)
    supplier_id = db.Column(db.Text, db.ForeignKey("suppliers.id"), nullable=False, index=True)
    submitted_by_id = db.Column(db.Text, db.ForeignKey("users.id"), nullable=False)
    pdf_path = db.Column(db.Text)
    score = db.Column(db.Float, default=0, nullable=False)
    status = db.Column(db.Text, default="under_review", nullable=False)
    red_flags = db.Column(db.JSON, default=list)
    submitted_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    supplier = db.relationship("Supplier", foreign_keys=[supplier_id])
    requirements = db.relationship(
        "ProposalRequirement", backref="proposal", cascade="all, delete-orphan"
    )
    __table_args__ = (db.UniqueConstraint("tender_id", "supplier_id"),)

    def to_dict(self):
        return {
            "id": self.id,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name,
            "supplier_email": self.supplier.email,
            "tender_id": self.tender_id,
            "tender_title": self.tender.title,
            "tender_screening_status": self.tender.screening_status,
            "pdf_path": self.pdf_path,
            "score": self.score,
            "status": self.status,
            "red_flags": self.red_flags or [],
            "disqualified": bool(self.red_flags),
            "submitted_at": self.submitted_at.isoformat(),
            "requirements": [row.to_dict() for row in self.requirements],
        }


class ProposalRequirement(db.Model):
    __tablename__ = "proposal_requirements"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    proposal_id = db.Column(db.Text, db.ForeignKey("proposals.id"), nullable=False, index=True)
    requirement_name = db.Column(db.Text, nullable=False)
    display_label = db.Column(db.Text)
    detected = db.Column(db.Boolean, default=False, nullable=False)
    is_mandatory = db.Column(db.Boolean, default=False, nullable=False)
    points_earned = db.Column(db.Integer, default=0, nullable=False)
    points_possible = db.Column(db.Integer, default=0, nullable=False)
    confidence = db.Column(db.Float, default=0, nullable=False)
    matched_text = db.Column(db.Text)
    verdict = db.Column(db.Text)
    evidence_page = db.Column(db.Integer)

    def to_dict(self):
        return {col.key: getattr(self, col.key) for col in self.__mapper__.column_attrs}


class TenderAward(db.Model):
    __tablename__ = "tender_awards"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    org_id = db.Column(db.Text, db.ForeignKey("organizations.id"), nullable=False)
    proposal_id = db.Column(db.Text, db.ForeignKey("proposals.id"), nullable=False, unique=True)
    purchase_order_id = db.Column(db.Text, db.ForeignKey("purchase_orders.id"), unique=True)
    approved_by_id = db.Column(db.Text, db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class EvaluationRun(db.Model):
    __tablename__ = "evaluation_runs"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    org_id = db.Column(db.Text, db.ForeignKey("organizations.id"), nullable=False)
    tender_id = db.Column(db.Text, db.ForeignKey("tenders.id"), nullable=False)
    status = db.Column(db.Text, default="queued", nullable=False)
    provider = db.Column(db.Text)
    model = db.Column(db.Text)
    error = db.Column(db.Text)
    result = db.Column(db.JSON)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    org_id = db.Column(db.Text, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, nullable=False)
    subject = db.Column(db.Text)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class Inquiry(db.Model):
    __tablename__ = "inquiries"
    id = db.Column(db.Text, primary_key=True, default=new_id)
    org_id = db.Column(db.Text, db.ForeignKey("organizations.id"), nullable=False)
    email = db.Column(db.Text, nullable=False)
    contact_name = db.Column(db.Text, nullable=False)
    company_name = db.Column(db.Text, nullable=False)
    status = db.Column(db.Text, default="pending", nullable=False)
    profile_path = db.Column(db.Text)
    details = db.Column(db.JSON, default=dict)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    reviewed_at = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        return {
            **(self.details or {}),
            "id": self.id,
            "email": self.email,
            "contact_name": self.contact_name,
            "company_name": self.company_name,
            "status": self.status,
            "profile_path": self.profile_path,
            "rejection_reason": self.rejection_reason,
            "created_at": self.created_at.isoformat(),
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }
