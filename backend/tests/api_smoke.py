from app import create_app
from app.extensions import db as orm

"""Live HTTP regression test. Run: docker compose exec backend python tests/api_smoke.py.

Uses DATABASE_URL to create a temporary tenant, calls the running API, and removes
only that tenant's data in finally. No mocks or Flask test client are used.
"""
import json
import os
import secrets
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4
import bcrypt
from app.models import get_repository

BASE = os.getenv("SMOKE_API_URL", "http://127.0.0.1:5000/api/v1")


class Api:
    def __init__(self) -> None:
        self.token = ""
        self.slug = ""
        self.checks = 0

    def call(
        self,
        method: str,
        path: str,
        body=None,
        expected: int = 200,
        token: str | None = None,
        tenant: bool = True,
    ) -> dict:
        headers = {"Content-Type": "application/json"}
        auth = self.token if token is None else token
        if auth:
            headers["Authorization"] = f"Bearer {auth}"
        if tenant and self.slug:
            headers["X-Org-Slug"] = self.slug
        request = Request(
            BASE + path,
            data=json.dumps(body).encode() if body is not None else None,
            headers=headers,
            method=method,
        )
        try:
            with urlopen(request, timeout=20) as response:
                status, raw = (response.status, response.read())
        except HTTPError as error:
            status, raw = (error.code, error.read())
        assert status == expected, f"{method} {path}: expected {expected}, got {status}"
        payload = json.loads(raw)
        if expected < 300:
            assert payload["error"] is None, f"{method} {path}: {payload['error']}"
        self.checks += 1
        print(f"PASS {method} {path} ({status})", flush=True)
        return payload


def exercise(api: Api, password: str) -> None:
    api.call("GET", "/health/")
    api.call("GET", f"/org/{api.slug}")
    login = api.call(
        "POST",
        "/auth/login",
        {"email": "smoke@example.com", "password": password, "org_slug": api.slug},
    )["data"]
    api.token = login["accessToken"]
    refresh = login["refreshToken"]
    uid = login["user"]["id"]
    for path in (
        "/auth/me",
        "/roles/",
        "/roles/permissions",
        "/users/",
        f"/users/{uid}",
        f"/users/{uid}/sessions",
        "/settings/",
        "/settings/smtp",
        "/settings/sessions",
        "/audit/",
        "/suppliers/",
        "/purchase-requisitions/",
        "/rfq/",
        "/purchase-orders/",
    ):
        api.call("GET", path)
    api.call("POST", "/auth/refresh", {}, token=refresh)
    api.call("GET", "/suppliers/", token="", expected=401)
    api.call("POST", "/suppliers/", {}, expected=422)
    role = api.call(
        "POST", "/roles/", {"name": "Smoke role", "slug": "smoke-role", "permission_ids": []}, 201
    )["data"]
    rid = role["id"]
    api.call("GET", f"/roles/{rid}")
    api.call("PATCH", f"/roles/{rid}", {"name": "Updated smoke role"})
    api.call("PUT", f"/roles/{rid}/permissions", {"permission_ids": []})
    api.call("DELETE", f"/roles/{rid}")
    supplier = api.call(
        "POST", "/suppliers/", {"name": "API smoke supplier", "email": "supplier@example.com"}, 201
    )["data"]
    sid = supplier["id"]
    api.call("GET", f"/suppliers/{sid}")
    api.call("PATCH", f"/suppliers/{sid}", {"city": "Nairobi"})
    api.call("PATCH", f"/suppliers/{sid}/status", {"status": "APPROVED"})
    items = [{"description": "Test item", "quantity": 2, "estimated_price": 25}]
    pr = api.call(
        "POST", "/purchase-requisitions/", {"title": "API smoke requisition", "items": items}, 201
    )["data"]
    pid = pr["id"]
    assert pr["totalEstimate"] == 50
    api.call("GET", f"/purchase-requisitions/{pid}")
    api.call(
        "PATCH",
        f"/purchase-requisitions/{pid}",
        {"title": "Updated API smoke requisition", "items": items},
    )
    api.call("POST", f"/purchase-requisitions/{pid}/action", {"action": "approve"}, 400)
    for action, status in (
        ("submit", "SUBMITTED"),
        ("review", "UNDER_REVIEW"),
        ("approve", "APPROVED"),
    ):
        result = api.call("POST", f"/purchase-requisitions/{pid}/action", {"action": action})[
            "data"
        ]
        assert result["status"] == status
    rfq = api.call(
        "POST",
        "/rfq/",
        {
            "title": "API smoke RFQ",
            "pr_id": pid,
            "items": [{"description": "Test item", "quantity": 2}],
        },
        201,
    )["data"]
    fid = rfq["id"]
    rfq = api.call("POST", f"/rfq/{fid}/invite", {"supplier_ids": [sid]})["data"]
    api.call("POST", f"/rfq/{fid}/action", {"action": "publish"})
    rfq = api.call(
        "POST",
        f"/rfq/{fid}/suppliers/{rfq['suppliers'][0]['id']}/bids",
        [{"rfq_item_id": rfq["items"][0]["id"], "unit_price": 20, "delivery_days": 5}],
    )["data"]
    assert rfq["suppliers"][0]["bids"][0]["totalPrice"] == 40
    api.call("POST", f"/rfq/{fid}/action", {"action": "close"})
    awarded = api.call("POST", f"/rfq/{fid}/award", {"supplier_id": sid})["data"]
    assert awarded["status"] == "AWARDED"
    po = api.call(
        "POST",
        "/purchase-orders/",
        {
            "supplier_id": sid,
            "rfq_id": fid,
            "items": [{"description": "Test item", "quantity": 2, "unit_price": 20}],
        },
        201,
    )["data"]
    oid = po["id"]
    assert po["totalAmount"] == 40
    for action, status in (
        ("submit", "PENDING_APPROVAL"),
        ("approve", "APPROVED"),
        ("send", "SENT"),
        ("acknowledge", "ACKNOWLEDGED"),
        ("complete", "COMPLETED"),
    ):
        result = api.call("POST", f"/purchase-orders/{oid}/action", {"action": action})["data"]
        assert result["status"] == status
    api.call("GET", f"/purchase-orders/{oid}")
    logs = api.call("GET", f"/audit/?entityId={sid}")["data"]
    assert {row["action"] for row in logs} >= {"CREATE", "UPDATE", "STATUS_CHANGE"}
    paths = [f"/org/{api.slug}", "/roles/", "/users/", "/suppliers/", "/audit/"] * 3
    with ThreadPoolExecutor(max_workers=5) as pool:
        list(pool.map(lambda path: api.call("GET", path), paths))
    disposable = api.call(
        "POST", "/suppliers/", {"name": "Disposable", "email": "disposable@example.com"}, 201
    )["data"]
    api.call("DELETE", f"/suppliers/{disposable['id']}")
    api.call("GET", f"/suppliers/{disposable['id']}", expected=404)
    draft = api.call(
        "POST", "/purchase-requisitions/", {"title": "Disposable", "items": items}, 201
    )["data"]
    api.call("DELETE", f"/purchase-requisitions/{draft['id']}")
    api.call("POST", "/auth/logout", {"refreshToken": refresh})
    api.call("POST", "/auth/refresh", {}, token=refresh, expected=401)


def exercise_main() -> None:
    db = get_repository()
    org_id = str(uuid4())
    api = Api()
    api.slug = f"api-smoke-{uuid4().hex}"
    password = secrets.token_urlsafe(24)
    try:
        db.organization.create(
            data={"id": org_id, "slug": api.slug, "name": "Temporary API smoke test"}
        )
        role = db.role.create(data={"name": "Smoke admin", "slug": "admin", "orgId": org_id})
        for permission in db.permission.find_many():
            db.rolepermission.create(data={"roleId": role.id, "permissionId": permission.id})
        user = db.user.create(
            data={
                "email": "smoke@example.com",
                "firstName": "API",
                "lastName": "Smoke",
                "passwordHash": bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
                "orgId": org_id,
            }
        )
        db.userrole.create(data={"userId": user.id, "roleId": role.id})
        db.systemsettings.create(data={"orgId": org_id})
        orm.session.commit()
        exercise(api, password)
        print(f"All {api.checks} live HTTP checks passed.", flush=True)
    finally:
        for model in (
            db.purchaseorder,
            db.requestforquotation,
            db.purchaserequisition,
            db.supplier,
            db.auditlog,
        ):
            model.delete_many(where={"orgId": org_id})
        db.organization.delete_many(where={"id": org_id})
        orm.session.commit()
        print("Temporary tenant and test data removed.", flush=True)


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        exercise_main()
