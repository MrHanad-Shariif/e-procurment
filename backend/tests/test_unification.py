"""Integration checks against PostgreSQL; every test rolls back its changes."""

from io import BytesIO
import os
from uuid import uuid4
import pytest
from sqlalchemy import select, text
from sqlalchemy.orm import scoped_session, sessionmaker
from app import create_app
from app.extensions import db
from app.models.entities import User, PurchaseOrder
from app.models.tendering import TenderAward


@pytest.fixture
def shared_client(tmp_path):
    from app.config import TestingConfig

    TestingConfig.SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"].replace(
        "postgresql://", "postgresql+psycopg2://", 1
    )
    app = create_app("testing")
    app.config["UPLOAD_FOLDER"] = str(tmp_path)
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        original = db.session
        db.session = scoped_session(
            sessionmaker(
                bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
            )
        )
        try:
            yield app.test_client()
        finally:
            db.session.remove()
            transaction.rollback()
            connection.close()
            db.session = original


def workspace(client):
    slug = f"test-{uuid4().hex[:10]}"
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "organization_name": "Integration workspace",
            "org_slug": slug,
            "email": f"admin-{slug}@example.com",
            "password": "Integration123!",
            "first_name": "Test",
            "last_name": "Admin",
            "preferred_language": "EN",
        },
    )
    assert response.status_code == 201, response.json
    result = response.json["data"]
    headers = {"Authorization": f"Bearer {result['accessToken']}", "X-Org-Slug": slug}
    return slug, headers


def test_both_legacy_password_formats_and_shared_modules(shared_client):
    for email, password in [
        ("admin@example.com", "admin123"),
        ("superadmin@tender.com", "superadminpass"),
        ("admin@tender.com", "adminpass"),
        ("supplier@tender.com", "supplierpass"),
    ]:
        result = shared_client.post(
            "/api/v1/auth/login", json={"email": email, "password": password, "org_slug": "default"}
        )
        assert result.status_code == 200, result.json
        headers = {"Authorization": "Bearer " + result.json["data"]["accessToken"]}
        assert shared_client.get("/api/v1/auth/me", headers=headers).status_code == 200
        assert shared_client.get("/api/v1/tendering/tenders", headers=headers).status_code == 200
    result = shared_client.post(
        "/api/v1/auth/login",
        json={
            "email": "superadmin@tender.com",
            "password": "superadminpass",
            "org_slug": "default",
        },
    )
    headers = {"Authorization": "Bearer " + result.json["data"]["accessToken"]}
    for route in [
        "purchase-requisitions/",
        "rfq/",
        "purchase-orders/",
        "goods-receipts/",
        "invoices/",
        "budgets/",
        "contracts/",
        "suppliers/",
        "roles/",
        "users/",
    ]:
        assert shared_client.get("/api/v1/" + route, headers=headers).status_code == 200, route


def test_tenant_isolation_and_supplier_permissions(shared_client):
    slug, admin = workspace(shared_client)
    other_slug, other = workspace(shared_client)
    tender = shared_client.post(
        "/api/v1/tendering/tenders", headers=admin, json={"title": "Private draft"}
    )
    assert tender.status_code == 201, tender.json
    identifier = tender.json["data"]["id"]
    assert (
        shared_client.get(f"/api/v1/tendering/tenders/{identifier}", headers=other).status_code
        == 404
    )
    assert shared_client.get("/api/v1/tendering/tenders/public/" + identifier).status_code == 404
    mismatch = {**admin, "X-Org-Slug": other_slug}
    assert shared_client.get("/api/v1/tendering/tenders", headers=mismatch).status_code == 403
    email = f"supplier-{slug}@example.com"
    registration = shared_client.post(
        "/api/v1/tendering/register",
        headers={"X-Org-Slug": slug},
        json={"name": "Supplier", "email": email, "password": "Integration123!"},
    )
    assert registration.status_code == 201, registration.json
    result = shared_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Integration123!", "org_slug": slug}
    )
    assert result.status_code == 200, result.json
    supplier_headers = {
        "Authorization": "Bearer " + result.json["data"]["accessToken"],
        "X-Org-Slug": slug,
    }
    assert (
        shared_client.get(
            f"/api/v1/tendering/tenders/{identifier}", headers=supplier_headers
        ).status_code
        == 404
    )
    assert (
        shared_client.post(
            f"/api/v1/tendering/super-admin/tenders/{identifier}/approve", headers=supplier_headers
        ).status_code
        == 403
    )
    assert shared_client.get("/api/v1/budgets/", headers=supplier_headers).status_code == 403


def test_tender_submission_review_award_creates_one_shared_order(shared_client):
    slug, headers = workspace(shared_client)
    created = shared_client.post(
        "/api/v1/tendering/tenders",
        headers=headers,
        json={
            "title": "Integration tender",
            "requirements": [
                {"requirement_name": "Valid license", "points": 100, "is_mandatory": True}
            ],
        },
    )
    assert created.status_code == 201, created.json
    tender = created.json["data"]
    assert (
        shared_client.patch(
            f"/api/v1/tendering/tenders/{tender['id']}/submit", headers=headers
        ).status_code
        == 200
    )
    assert (
        shared_client.post(
            f"/api/v1/tendering/super-admin/tenders/{tender['id']}/approve", headers=headers
        ).status_code
        == 200
    )
    email = f"supplier-{slug}@example.com"
    shared_client.post(
        "/api/v1/tendering/register",
        headers={"X-Org-Slug": slug},
        json={"name": "Integration supplier", "email": email, "password": "Integration123!"},
    )
    supplier_user = db.session.scalar(select(User).where(User.email == email))
    from app.models.entities import Supplier

    db.session.get(Supplier, supplier_user.supplierId).status = "APPROVED"
    db.session.flush()
    result = shared_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Integration123!", "org_slug": slug}
    )
    assert result.status_code == 200, result.json
    supplier_headers = {
        "Authorization": "Bearer " + result.json["data"]["accessToken"],
        "X-Org-Slug": slug,
    }
    submitted = shared_client.post(
        "/api/v1/tendering/proposals",
        headers=supplier_headers,
        data={
            "tender_id": tender["id"],
            "file": (BytesIO(b"License ABC-123 is valid."), "proposal.txt"),
        },
        content_type="multipart/form-data",
    )
    assert submitted.status_code == 201, submitted.json
    proposal = submitted.json["data"]
    reviewed = shared_client.post(
        f"/api/v1/tendering/proposals/{proposal['id']}/review",
        headers=headers,
        json={
            "reason": "License checked",
            "results": [
                {
                    "criterionId": tender["requirements"][0]["id"],
                    "points": 100,
                    "met": True,
                    "evidence": "License ABC-123",
                }
            ],
        },
    )
    assert reviewed.status_code == 200, reviewed.json
    assert reviewed.json["data"]["score"] == 100
    request = {
        "reason": "Approved evaluation",
        "items": [{"description": "Adapters", "quantity": 10, "unit_price": 100}],
    }
    awarded = shared_client.post(
        f"/api/v1/tendering/proposals/{proposal['id']}/award", headers=headers, json=request
    )
    assert awarded.status_code == 201, awarded.json
    retry = shared_client.post(
        f"/api/v1/tendering/proposals/{proposal['id']}/award", headers=headers, json=request
    )
    assert retry.json["data"]["purchaseOrderId"] == awarded.json["data"]["purchaseOrderId"]
    order = db.session.get(PurchaseOrder, awarded.json["data"]["purchaseOrderId"])
    assert order.supplierId == supplier_user.supplierId
    assert order.totalAmount == 1000
    assert order.status == "DRAFT"
    assert (
        shared_client.get(f"/api/v1/purchase-orders/{order.id}", headers=headers).status_code == 200
    )
    assert (
        shared_client.get(
            f"/api/v1/purchase-orders/{order.id}", headers=supplier_headers
        ).status_code
        == 403
    )


def test_failed_request_rolls_back_partial_document(shared_client):
    _, headers = workspace(shared_client)
    before = db.session.scalar(select(db.func.count()).select_from(PurchaseOrder))
    # A bad supplier reference must never create an order as part of an award.
    response = shared_client.post(
        "/api/v1/tendering/proposals/missing/award",
        headers=headers,
        json={"reason": "invalid", "items": []},
    )
    assert response.status_code == 404
    assert db.session.scalar(select(db.func.count()).select_from(PurchaseOrder)) == before


def test_cross_organization_supplier_reference_is_rejected(shared_client):
    _, first = workspace(shared_client)
    _, second = workspace(shared_client)
    supplier = shared_client.post(
        "/api/v1/suppliers/",
        headers=second,
        json={"name": "Other organization supplier", "email": "foreign-supplier@example.com"},
    )
    assert supplier.status_code == 201, supplier.json
    response = shared_client.post(
        "/api/v1/purchase-orders/",
        headers=first,
        json={
            "supplier_id": supplier.json["data"]["id"],
            "items": [{"description": "Should fail", "quantity": 1, "unit_price": 100}],
        },
    )
    assert response.status_code == 422, response.json
    assert "another organization" in response.json["error"]
