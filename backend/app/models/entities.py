"""SQLAlchemy models preserving existing procurement table/column names."""

from datetime import datetime, timezone
from uuid import uuid4
from app.extensions import db


def new_id():
    return str(uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class Organization(db.Model):
    __tablename__ = "organizations"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    name = db.Column("name", db.Text, nullable=False)
    slug = db.Column("slug", db.Text, nullable=False, unique=True)
    logoUrl = db.Column("logo_url", db.Text, nullable=True)
    primaryColor = db.Column("primary_color", db.Text, nullable=False, default="#1a56db")
    secondaryColor = db.Column("secondary_color", db.Text, nullable=False, default="#6b7280")
    systemName = db.Column("system_name", db.Text, nullable=False, default="E-Procurement")
    defaultLanguage = db.Column(
        "default_language", db.Enum("EN", "AR", "FR", name="Language"), nullable=False, default="EN"
    )
    isActive = db.Column("is_active", db.Boolean, nullable=False, default=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    users = db.relationship("User", foreign_keys="User.orgId", viewonly=True, uselist=True)
    roles = db.relationship("Role", foreign_keys="Role.orgId", viewonly=True, uselist=True)
    settings = db.relationship(
        "SystemSettings", foreign_keys="SystemSettings.orgId", viewonly=True, uselist=False
    )
    budgets = db.relationship("Budget", foreign_keys="Budget.orgId", viewonly=True, uselist=True)
    contracts = db.relationship(
        "Contract", foreign_keys="Contract.orgId", viewonly=True, uselist=True
    )


class Permission(db.Model):
    __tablename__ = "permissions"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    codename = db.Column("codename", db.Text, nullable=False, unique=True)
    group = db.Column("group", db.Text, nullable=False)
    description = db.Column("description", db.Text, nullable=False)
    roles = db.relationship(
        "RolePermission", foreign_keys="RolePermission.permissionId", viewonly=True, uselist=True
    )


class Role(db.Model):
    __tablename__ = "roles"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    name = db.Column("name", db.Text, nullable=False)
    slug = db.Column("slug", db.Text, nullable=False)
    description = db.Column("description", db.Text, nullable=True)
    isSystem = db.Column("is_system", db.Boolean, nullable=False, default=False)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    orgId = db.Column(
        "org_id", db.Text, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    organization = db.relationship("Organization", foreign_keys=[orgId])
    permissions = db.relationship(
        "RolePermission", foreign_keys="RolePermission.roleId", viewonly=True, uselist=True
    )
    users = db.relationship("UserRole", foreign_keys="UserRole.roleId", viewonly=True, uselist=True)
    __table_args__ = (db.UniqueConstraint("slug", "org_id"),)


class RolePermission(db.Model):
    __tablename__ = "role_permissions"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    roleId = db.Column(
        "role_id", db.Text, db.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    permissionId = db.Column(
        "permission_id",
        db.Text,
        db.ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    role = db.relationship("Role", foreign_keys=[roleId])
    permission = db.relationship("Permission", foreign_keys=[permissionId])
    __table_args__ = (db.UniqueConstraint("role_id", "permission_id"),)


class UserRole(db.Model):
    __tablename__ = "user_roles"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    userId = db.Column(
        "user_id", db.Text, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    roleId = db.Column(
        "role_id", db.Text, db.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    user = db.relationship("User", foreign_keys=[userId])
    role = db.relationship("Role", foreign_keys=[roleId])
    __table_args__ = (db.UniqueConstraint("user_id", "role_id"),)


class User(db.Model):
    __tablename__ = "users"
    supplierId = db.Column("supplier_id", db.Text, db.ForeignKey("suppliers.id"))
    profile = db.Column(db.JSON)
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    email = db.Column("email", db.Text, nullable=False)
    passwordHash = db.Column("password_hash", db.Text, nullable=False)
    firstName = db.Column("first_name", db.Text, nullable=False)
    lastName = db.Column("last_name", db.Text, nullable=False)
    preferredLanguage = db.Column(
        "preferred_language",
        db.Enum("EN", "AR", "FR", name="Language"),
        nullable=False,
        default="EN",
    )
    isActive = db.Column("is_active", db.Boolean, nullable=False, default=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    orgId = db.Column(
        "org_id", db.Text, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    organization = db.relationship("Organization", foreign_keys=[orgId])
    roles = db.relationship("UserRole", foreign_keys="UserRole.userId", viewonly=True, uselist=True)
    sessions = db.relationship(
        "Session", foreign_keys="Session.userId", viewonly=True, uselist=True
    )
    budgetsCreated = db.relationship(
        "Budget", foreign_keys="Budget.createdById", viewonly=True, uselist=True
    )
    contractsCreated = db.relationship(
        "Contract", foreign_keys="Contract.createdById", viewonly=True, uselist=True
    )
    contractsApproved = db.relationship(
        "Contract", foreign_keys="Contract.approvedById", viewonly=True, uselist=True
    )
    notifications = db.relationship(
        "Notification", foreign_keys="Notification.userId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("email", "org_id"),)


class Session(db.Model):
    __tablename__ = "sessions"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    refreshToken = db.Column("refresh_token", db.Text, nullable=False, unique=True)
    ipAddress = db.Column("ip_address", db.Text, nullable=True)
    userAgent = db.Column("user_agent", db.Text, nullable=True)
    expiresAt = db.Column("expires_at", db.DateTime(timezone=True), nullable=False)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    userId = db.Column(
        "user_id", db.Text, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user = db.relationship("User", foreign_keys=[userId])


class SystemSettings(db.Model):
    __tablename__ = "system_settings"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    smtpHost = db.Column("smtp_host", db.Text, nullable=True)
    smtpPort = db.Column("smtp_port", db.Integer, nullable=True, default=587)
    smtpUsername = db.Column("smtp_username", db.Text, nullable=True)
    smtpPasswordEncrypted = db.Column("smtp_password_encrypted", db.Text, nullable=True)
    emailFromName = db.Column("email_from_name", db.Text, nullable=True)
    emailFromAddress = db.Column("email_from_address", db.Text, nullable=True)
    maxConcurrentSessions = db.Column(
        "max_concurrent_sessions", db.Integer, nullable=False, default=5
    )
    globalRateLimit = db.Column("global_rate_limit", db.Integer, nullable=False, default=100)
    authRateLimit = db.Column("auth_rate_limit", db.Integer, nullable=False, default=5)
    rateTolerance = db.Column("rate_tolerance", db.Float, nullable=False, default=0)
    qtyTolerance = db.Column("qty_tolerance", db.Float, nullable=False, default=0)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    orgId = db.Column(
        "org_id",
        db.Text,
        db.ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    organization = db.relationship("Organization", foreign_keys=[orgId])


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    action = db.Column("action", db.Text, nullable=False)
    entityType = db.Column("entity_type", db.Text, nullable=False)
    entityId = db.Column("entity_id", db.Text, nullable=False)
    oldData = db.Column("old_data", db.JSON, nullable=True)
    newData = db.Column("new_data", db.JSON, nullable=True)
    ipAddress = db.Column("ip_address", db.Text, nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    userId = db.Column("user_id", db.Text, nullable=False)
    orgId = db.Column("org_id", db.Text, nullable=False)


class Supplier(db.Model):
    __tablename__ = "suppliers"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    name = db.Column("name", db.Text, nullable=False)
    email = db.Column("email", db.Text, nullable=False)
    phone = db.Column("phone", db.Text, nullable=True)
    address = db.Column("address", db.Text, nullable=True)
    city = db.Column("city", db.Text, nullable=True)
    country = db.Column("country", db.Text, nullable=True)
    taxId = db.Column("tax_id", db.Text, nullable=True)
    category = db.Column("category", db.Text, nullable=True)
    website = db.Column("website", db.Text, nullable=True)
    contactName = db.Column("contact_name", db.Text, nullable=True)
    status = db.Column(
        "status",
        db.Enum("PENDING", "APPROVED", "SUSPENDED", "BLACKLISTED", name="SupplierStatus"),
        nullable=False,
        default="PENDING",
    )
    rating = db.Column("rating", db.Float, nullable=True)
    notes = db.Column("notes", db.Text, nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    orgId = db.Column("org_id", db.Text, nullable=False)
    createdById = db.Column("created_by_id", db.Text, nullable=False)
    approvedById = db.Column("approved_by_id", db.Text, nullable=True)
    rfqSuppliers = db.relationship(
        "RfqSupplier", foreign_keys="RfqSupplier.supplierId", viewonly=True, uselist=True
    )
    purchaseOrders = db.relationship(
        "PurchaseOrder", foreign_keys="PurchaseOrder.supplierId", viewonly=True, uselist=True
    )
    contracts = db.relationship(
        "Contract", foreign_keys="Contract.supplierId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("email", "org_id"),)


class PurchaseRequisition(db.Model):
    __tablename__ = "purchase_requisitions"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    prNumber = db.Column("pr_number", db.Text, nullable=False)
    title = db.Column("title", db.Text, nullable=False)
    description = db.Column("description", db.Text, nullable=True)
    status = db.Column(
        "status",
        db.Enum(
            "DRAFT",
            "SUBMITTED",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "CANCELLED",
            name="PrStatus",
        ),
        nullable=False,
        default="DRAFT",
    )
    priority = db.Column(
        "priority",
        db.Enum("LOW", "MEDIUM", "HIGH", "URGENT", name="Priority"),
        nullable=False,
        default="MEDIUM",
    )
    requiredDate = db.Column("required_date", db.DateTime(timezone=True), nullable=True)
    totalEstimate = db.Column("total_estimate", db.Float, nullable=False, default=0)
    currency = db.Column("currency", db.Text, nullable=False, default="USD")
    rejectionNotes = db.Column("rejection_notes", db.Text, nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    submittedAt = db.Column("submitted_at", db.DateTime(timezone=True), nullable=True)
    approvedAt = db.Column("approved_at", db.DateTime(timezone=True), nullable=True)
    orgId = db.Column("org_id", db.Text, nullable=False)
    createdById = db.Column("created_by_id", db.Text, nullable=False)
    reviewerId = db.Column("reviewer_id", db.Text, nullable=True)
    approvedById = db.Column("approved_by_id", db.Text, nullable=True)
    items = db.relationship(
        "PurchaseRequisitionItem",
        foreign_keys="PurchaseRequisitionItem.prId",
        viewonly=True,
        uselist=True,
    )
    rfqs = db.relationship(
        "RequestForQuotation", foreign_keys="RequestForQuotation.prId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("pr_number", "org_id"),)


class PurchaseRequisitionItem(db.Model):
    __tablename__ = "purchase_requisition_items"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    description = db.Column("description", db.Text, nullable=False)
    quantity = db.Column("quantity", db.Float, nullable=False)
    unit = db.Column("unit", db.Text, nullable=False, default="PCS")
    estimatedPrice = db.Column("estimated_price", db.Float, nullable=False, default=0)
    totalPrice = db.Column("total_price", db.Float, nullable=False, default=0)
    budgetCode = db.Column("budget_code", db.Text, nullable=True)
    specifications = db.Column("specifications", db.Text, nullable=True)
    sortOrder = db.Column("sort_order", db.Integer, nullable=False, default=0)
    prId = db.Column(
        "pr_id",
        db.Text,
        db.ForeignKey("purchase_requisitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    purchaseRequisition = db.relationship("PurchaseRequisition", foreign_keys=[prId])


class RequestForQuotation(db.Model):
    __tablename__ = "request_for_quotations"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    rfqNumber = db.Column("rfq_number", db.Text, nullable=False)
    title = db.Column("title", db.Text, nullable=False)
    description = db.Column("description", db.Text, nullable=True)
    status = db.Column(
        "status",
        db.Enum("DRAFT", "PUBLISHED", "CLOSED", "AWARDED", "CANCELLED", name="RfqStatus"),
        nullable=False,
        default="DRAFT",
    )
    deadline = db.Column("deadline", db.DateTime(timezone=True), nullable=True)
    termsAndConditions = db.Column("terms_and_conditions", db.Text, nullable=True)
    currency = db.Column("currency", db.Text, nullable=False, default="USD")
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    publishedAt = db.Column("published_at", db.DateTime(timezone=True), nullable=True)
    closedAt = db.Column("closed_at", db.DateTime(timezone=True), nullable=True)
    orgId = db.Column("org_id", db.Text, nullable=False)
    createdById = db.Column("created_by_id", db.Text, nullable=False)
    prId = db.Column("pr_id", db.Text, db.ForeignKey("purchase_requisitions.id"), nullable=True)
    purchaseRequisition = db.relationship("PurchaseRequisition", foreign_keys=[prId])
    items = db.relationship("RfqItem", foreign_keys="RfqItem.rfqId", viewonly=True, uselist=True)
    suppliers = db.relationship(
        "RfqSupplier", foreign_keys="RfqSupplier.rfqId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("rfq_number", "org_id"),)


class RfqItem(db.Model):
    __tablename__ = "rfq_items"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    description = db.Column("description", db.Text, nullable=False)
    quantity = db.Column("quantity", db.Float, nullable=False)
    unit = db.Column("unit", db.Text, nullable=False, default="PCS")
    specifications = db.Column("specifications", db.Text, nullable=True)
    sortOrder = db.Column("sort_order", db.Integer, nullable=False, default=0)
    rfqId = db.Column(
        "rfq_id",
        db.Text,
        db.ForeignKey("request_for_quotations.id", ondelete="CASCADE"),
        nullable=False,
    )
    rfq = db.relationship("RequestForQuotation", foreign_keys=[rfqId])
    bids = db.relationship(
        "SupplierBid", foreign_keys="SupplierBid.rfqItemId", viewonly=True, uselist=True
    )


class RfqSupplier(db.Model):
    __tablename__ = "rfq_suppliers"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    status = db.Column(
        "status",
        db.Enum("INVITED", "RESPONDED", "AWARDED", "DECLINED", name="RfqSupplierStatus"),
        nullable=False,
        default="INVITED",
    )
    invitedAt = db.Column("invited_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    respondedAt = db.Column("responded_at", db.DateTime(timezone=True), nullable=True)
    notes = db.Column("notes", db.Text, nullable=True)
    rfqId = db.Column(
        "rfq_id",
        db.Text,
        db.ForeignKey("request_for_quotations.id", ondelete="CASCADE"),
        nullable=False,
    )
    supplierId = db.Column("supplier_id", db.Text, db.ForeignKey("suppliers.id"), nullable=False)
    rfq = db.relationship("RequestForQuotation", foreign_keys=[rfqId])
    supplier = db.relationship("Supplier", foreign_keys=[supplierId])
    bids = db.relationship(
        "SupplierBid", foreign_keys="SupplierBid.rfqSupplierId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("rfq_id", "supplier_id"),)


class SupplierBid(db.Model):
    __tablename__ = "supplier_bids"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    unitPrice = db.Column("unit_price", db.Float, nullable=False)
    totalPrice = db.Column("total_price", db.Float, nullable=False)
    deliveryDays = db.Column("delivery_days", db.Integer, nullable=True)
    notes = db.Column("notes", db.Text, nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    rfqSupplierId = db.Column(
        "rfq_supplier_id",
        db.Text,
        db.ForeignKey("rfq_suppliers.id", ondelete="CASCADE"),
        nullable=False,
    )
    rfqItemId = db.Column(
        "rfq_item_id", db.Text, db.ForeignKey("rfq_items.id", ondelete="CASCADE"), nullable=False
    )
    rfqSupplier = db.relationship("RfqSupplier", foreign_keys=[rfqSupplierId])
    rfqItem = db.relationship("RfqItem", foreign_keys=[rfqItemId])
    __table_args__ = (db.UniqueConstraint("rfq_supplier_id", "rfq_item_id"),)


class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    poNumber = db.Column("po_number", db.Text, nullable=False)
    status = db.Column(
        "status",
        db.Enum(
            "DRAFT",
            "PENDING_APPROVAL",
            "APPROVED",
            "SENT",
            "ACKNOWLEDGED",
            "COMPLETED",
            "CANCELLED",
            name="PoStatus",
        ),
        nullable=False,
        default="DRAFT",
    )
    totalAmount = db.Column("total_amount", db.Float, nullable=False, default=0)
    currency = db.Column("currency", db.Text, nullable=False, default="USD")
    deliveryDate = db.Column("delivery_date", db.DateTime(timezone=True), nullable=True)
    deliveryAddress = db.Column("delivery_address", db.Text, nullable=True)
    paymentTerms = db.Column("payment_terms", db.Text, nullable=True)
    notes = db.Column("notes", db.Text, nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    approvedAt = db.Column("approved_at", db.DateTime(timezone=True), nullable=True)
    sentAt = db.Column("sent_at", db.DateTime(timezone=True), nullable=True)
    orgId = db.Column("org_id", db.Text, nullable=False)
    createdById = db.Column("created_by_id", db.Text, nullable=False)
    approvedById = db.Column("approved_by_id", db.Text, nullable=True)
    supplierId = db.Column("supplier_id", db.Text, db.ForeignKey("suppliers.id"), nullable=False)
    rfqId = db.Column("rfq_id", db.Text, nullable=True)
    supplier = db.relationship("Supplier", foreign_keys=[supplierId])
    items = db.relationship(
        "PurchaseOrderItem", foreign_keys="PurchaseOrderItem.poId", viewonly=True, uselist=True
    )
    goodsReceipts = db.relationship(
        "GoodsReceipt", foreign_keys="GoodsReceipt.poId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("po_number", "org_id"),)


class PurchaseOrderItem(db.Model):
    __tablename__ = "purchase_order_items"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    description = db.Column("description", db.Text, nullable=False)
    quantity = db.Column("quantity", db.Float, nullable=False)
    unit = db.Column("unit", db.Text, nullable=False, default="PCS")
    unitPrice = db.Column("unit_price", db.Float, nullable=False)
    totalPrice = db.Column("total_price", db.Float, nullable=False)
    sortOrder = db.Column("sort_order", db.Integer, nullable=False, default=0)
    poId = db.Column(
        "po_id", db.Text, db.ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False
    )
    purchaseOrder = db.relationship("PurchaseOrder", foreign_keys=[poId])


class GoodsReceipt(db.Model):
    __tablename__ = "goods_receipts"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    grNumber = db.Column("gr_number", db.Text, nullable=False)
    status = db.Column(
        "status",
        db.Enum(
            "DRAFT", "SUBMITTED", "INSPECTING", "ACCEPTED", "REJECTED", "CANCELLED", name="GrStatus"
        ),
        nullable=False,
        default="DRAFT",
    )
    receivedDate = db.Column("received_date", db.DateTime(timezone=True), nullable=False)
    deliveryNoteRef = db.Column("delivery_note_ref", db.Text, nullable=True)
    warehouse = db.Column("warehouse", db.Text, nullable=True)
    notes = db.Column("notes", db.Text, nullable=True)
    totalAmount = db.Column("total_amount", db.Float, nullable=False, default=0)
    currency = db.Column("currency", db.Text, nullable=False, default="USD")
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    inspectedAt = db.Column("inspected_at", db.DateTime(timezone=True), nullable=True)
    orgId = db.Column("org_id", db.Text, nullable=False)
    poId = db.Column("po_id", db.Text, db.ForeignKey("purchase_orders.id"), nullable=False)
    supplierId = db.Column("supplier_id", db.Text, nullable=False)
    receivedById = db.Column("received_by_id", db.Text, nullable=False)
    inspectedById = db.Column("inspected_by_id", db.Text, nullable=True)
    purchaseOrder = db.relationship("PurchaseOrder", foreign_keys=[poId])
    items = db.relationship(
        "GoodsReceiptItem", foreign_keys="GoodsReceiptItem.grId", viewonly=True, uselist=True
    )
    __table_args__ = (db.UniqueConstraint("gr_number", "org_id"),)


class GoodsReceiptItem(db.Model):
    __tablename__ = "goods_receipt_items"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    description = db.Column("description", db.Text, nullable=False)
    orderedQty = db.Column("ordered_qty", db.Float, nullable=False)
    receivedQty = db.Column("received_qty", db.Float, nullable=False)
    acceptedQty = db.Column("accepted_qty", db.Float, nullable=False, default=0)
    rejectedQty = db.Column("rejected_qty", db.Float, nullable=False, default=0)
    unit = db.Column("unit", db.Text, nullable=False, default="PCS")
    unitPrice = db.Column("unit_price", db.Float, nullable=False)
    totalPrice = db.Column("total_price", db.Float, nullable=False)
    qualityStatus = db.Column(
        "quality_status",
        db.Enum("PENDING", "PASSED", "FAILED", name="QualityStatus"),
        nullable=False,
        default="PENDING",
    )
    qualityNotes = db.Column("quality_notes", db.Text, nullable=True)
    sortOrder = db.Column("sort_order", db.Integer, nullable=False, default=0)
    grId = db.Column(
        "gr_id", db.Text, db.ForeignKey("goods_receipts.id", ondelete="CASCADE"), nullable=False
    )
    poItemId = db.Column("po_item_id", db.Text, nullable=False)
    goodsReceipt = db.relationship("GoodsReceipt", foreign_keys=[grId])


class PurchaseInvoice(db.Model):
    __tablename__ = "purchase_invoices"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    invoiceNumber = db.Column("invoice_number", db.Text, nullable=False)
    supplierInvoiceRef = db.Column("supplier_invoice_ref", db.Text, nullable=True)
    status = db.Column(
        "status",
        db.Enum(
            "DRAFT",
            "SUBMITTED",
            "MATCHED",
            "MISMATCHED",
            "APPROVED",
            "PAID",
            "CANCELLED",
            name="InvoiceStatus",
        ),
        nullable=False,
        default="DRAFT",
    )
    matchStatus = db.Column(
        "match_status",
        db.Enum(
            "MATCHED",
            "QTY_MISMATCH",
            "RATE_MISMATCH",
            "BOTH_MISMATCH",
            "UNMATCHED",
            name="MatchStatus",
        ),
        nullable=False,
        default="UNMATCHED",
    )
    subtotal = db.Column("subtotal", db.Float, nullable=False, default=0)
    taxAmount = db.Column("tax_amount", db.Float, nullable=False, default=0)
    totalAmount = db.Column("total_amount", db.Float, nullable=False, default=0)
    currency = db.Column("currency", db.Text, nullable=False, default="USD")
    dueDate = db.Column("due_date", db.DateTime(timezone=True), nullable=True)
    paymentTerms = db.Column("payment_terms", db.Text, nullable=True)
    notes = db.Column("notes", db.Text, nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    approvedAt = db.Column("approved_at", db.DateTime(timezone=True), nullable=True)
    paidAt = db.Column("paid_at", db.DateTime(timezone=True), nullable=True)
    orgId = db.Column("org_id", db.Text, nullable=False)
    poId = db.Column("po_id", db.Text, nullable=False)
    grId = db.Column("gr_id", db.Text, nullable=True)
    supplierId = db.Column("supplier_id", db.Text, nullable=False)
    createdById = db.Column("created_by_id", db.Text, nullable=False)
    approvedById = db.Column("approved_by_id", db.Text, nullable=True)
    items = db.relationship(
        "PurchaseInvoiceItem",
        foreign_keys="PurchaseInvoiceItem.invoiceId",
        viewonly=True,
        uselist=True,
    )
    __table_args__ = (db.UniqueConstraint("invoice_number", "org_id"),)


class PurchaseInvoiceItem(db.Model):
    __tablename__ = "purchase_invoice_items"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    description = db.Column("description", db.Text, nullable=False)
    invoicedQty = db.Column("invoiced_qty", db.Float, nullable=False)
    unitPrice = db.Column("unit_price", db.Float, nullable=False)
    totalPrice = db.Column("total_price", db.Float, nullable=False)
    orderedQty = db.Column("ordered_qty", db.Float, nullable=False, default=0)
    receivedQty = db.Column("received_qty", db.Float, nullable=False, default=0)
    qtyMatch = db.Column("qty_match", db.Boolean, nullable=False, default=False)
    rateMatch = db.Column("rate_match", db.Boolean, nullable=False, default=False)
    sortOrder = db.Column("sort_order", db.Integer, nullable=False, default=0)
    invoiceId = db.Column(
        "invoice_id",
        db.Text,
        db.ForeignKey("purchase_invoices.id", ondelete="CASCADE"),
        nullable=False,
    )
    poItemId = db.Column("po_item_id", db.Text, nullable=True)
    grItemId = db.Column("gr_item_id", db.Text, nullable=True)
    invoice = db.relationship("PurchaseInvoice", foreign_keys=[invoiceId])


class Budget(db.Model):
    __tablename__ = "budgets"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    name = db.Column("name", db.Text, nullable=False)
    costCenter = db.Column("cost_center", db.Text, nullable=False)
    fiscalYear = db.Column("fiscal_year", db.Integer, nullable=False)
    period = db.Column(
        "period",
        db.Enum("MONTHLY", "QUARTERLY", "YEARLY", name="BudgetPeriod"),
        nullable=False,
        default="YEARLY",
    )
    totalAmount = db.Column("total_amount", db.Float, nullable=False)
    spentAmount = db.Column("spent_amount", db.Float, nullable=False, default=0)
    committedAmount = db.Column("committed_amount", db.Float, nullable=False, default=0)
    controlOnPr = db.Column(
        "control_on_pr",
        db.Enum("WARN", "STOP", "IGNORE", name="BudgetAction"),
        nullable=False,
        default="WARN",
    )
    controlOnPo = db.Column(
        "control_on_po",
        db.Enum("WARN", "STOP", "IGNORE", name="BudgetAction"),
        nullable=False,
        default="WARN",
    )
    isActive = db.Column("is_active", db.Boolean, nullable=False, default=True)
    orgId = db.Column("org_id", db.Text, db.ForeignKey("organizations.id"), nullable=False)
    createdById = db.Column("created_by_id", db.Text, db.ForeignKey("users.id"), nullable=False)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    org = db.relationship("Organization", foreign_keys=[orgId])
    createdBy = db.relationship("User", foreign_keys=[createdById])


class Contract(db.Model):
    __tablename__ = "contracts"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    contractNumber = db.Column("contract_number", db.Text, nullable=False)
    title = db.Column("title", db.Text, nullable=False)
    description = db.Column("description", db.Text, nullable=True)
    status = db.Column(
        "status",
        db.Enum("DRAFT", "ACTIVE", "EXPIRED", "TERMINATED", "RENEWED", name="ContractStatus"),
        nullable=False,
        default="DRAFT",
    )
    startDate = db.Column("start_date", db.DateTime(timezone=True), nullable=False)
    endDate = db.Column("end_date", db.DateTime(timezone=True), nullable=False)
    totalValue = db.Column("total_value", db.Float, nullable=False)
    currency = db.Column("currency", db.Text, nullable=False, default="USD")
    termsAndConditions = db.Column("terms_and_conditions", db.Text, nullable=True)
    renewalTerms = db.Column("renewal_terms", db.Text, nullable=True)
    supplierId = db.Column("supplier_id", db.Text, db.ForeignKey("suppliers.id"), nullable=False)
    orgId = db.Column("org_id", db.Text, db.ForeignKey("organizations.id"), nullable=False)
    createdById = db.Column("created_by_id", db.Text, db.ForeignKey("users.id"), nullable=False)
    approvedById = db.Column("approved_by_id", db.Text, db.ForeignKey("users.id"), nullable=True)
    approvedAt = db.Column("approved_at", db.DateTime(timezone=True), nullable=True)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    updatedAt = db.Column(
        "updated_at", db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    supplier = db.relationship("Supplier", foreign_keys=[supplierId])
    org = db.relationship("Organization", foreign_keys=[orgId])
    createdBy = db.relationship("User", foreign_keys=[createdById])
    approvedBy = db.relationship("User", foreign_keys=[approvedById])
    amendments = db.relationship(
        "ContractAmendment",
        foreign_keys="ContractAmendment.contractId",
        viewonly=True,
        uselist=True,
    )
    __table_args__ = (db.UniqueConstraint("org_id", "contract_number"),)


class ContractAmendment(db.Model):
    __tablename__ = "contract_amendments"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    amendmentNumber = db.Column("amendment_number", db.Integer, nullable=False)
    description = db.Column("description", db.Text, nullable=False)
    oldValue = db.Column("old_value", db.Float, nullable=True)
    newValue = db.Column("new_value", db.Float, nullable=True)
    effectiveDate = db.Column("effective_date", db.DateTime(timezone=True), nullable=False)
    contractId = db.Column(
        "contract_id", db.Text, db.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )
    createdById = db.Column("created_by_id", db.Text, nullable=False)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    contract = db.relationship("Contract", foreign_keys=[contractId])


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column("id", db.Text, nullable=False, primary_key=True, default=new_id)
    type = db.Column("type", db.Text, nullable=False)
    title = db.Column("title", db.Text, nullable=False)
    message = db.Column("message", db.Text, nullable=False)
    entityType = db.Column("entity_type", db.Text, nullable=True)
    entityId = db.Column("entity_id", db.Text, nullable=True)
    isRead = db.Column("is_read", db.Boolean, nullable=False, default=False)
    userId = db.Column(
        "user_id", db.Text, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    orgId = db.Column("org_id", db.Text, nullable=False)
    createdAt = db.Column("created_at", db.DateTime(timezone=True), nullable=False, default=utcnow)
    user = db.relationship("User", foreign_keys=[userId])


MODEL_REGISTRY = {
    "organization": Organization,
    "permission": Permission,
    "role": Role,
    "rolepermission": RolePermission,
    "userrole": UserRole,
    "user": User,
    "session": Session,
    "systemsettings": SystemSettings,
    "auditlog": AuditLog,
    "supplier": Supplier,
    "purchaserequisition": PurchaseRequisition,
    "purchaserequisitionitem": PurchaseRequisitionItem,
    "requestforquotation": RequestForQuotation,
    "rfqitem": RfqItem,
    "rfqsupplier": RfqSupplier,
    "supplierbid": SupplierBid,
    "purchaseorder": PurchaseOrder,
    "purchaseorderitem": PurchaseOrderItem,
    "goodsreceipt": GoodsReceipt,
    "goodsreceiptitem": GoodsReceiptItem,
    "purchaseinvoice": PurchaseInvoice,
    "purchaseinvoiceitem": PurchaseInvoiceItem,
    "budget": Budget,
    "contract": Contract,
    "contractamendment": ContractAmendment,
    "notification": Notification,
}
MODEL_REGISTRY["rfq"] = RequestForQuotation
