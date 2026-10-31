from app import create_app
from app.extensions import db as orm

"""Live workspace signup checks; remove only the unique test organization afterward."""
import secrets
from uuid import uuid4
from app.models import get_repository
from tests.api_smoke import Api


def exercise_main() -> None:
    db = get_repository()
    slug = f"signup-smoke-{uuid4().hex[:16]}"
    api = Api()
    password = secrets.token_urlsafe(24)
    body = {
        "organization_name": "Signup smoke organization",
        "org_slug": slug,
        "first_name": "Signup",
        "last_name": "Admin",
        "email": "signup@example.com",
        "password": password,
        "preferred_language": "EN",
    }

    def exercise() -> None:
        invalid = api.call("POST", "/auth/signup", {**body, "password": "Xy!47"}, 422)
        assert "Xy!47" not in str(invalid), "Validation response exposed a password"
        api.call("POST", "/auth/signup", {**body, "role_ids": ["admin"]}, 422)
        result = api.call("POST", "/auth/signup", body, 201)["data"]
        assert result["organization"]["slug"] == slug
        assert result["user"]["orgId"] == result["organization"]["id"]
        assert "settings.manage" in result["user"]["permissions"]
        assert [role["slug"] for role in result["user"]["roles"]] == ["admin"]
        api.token = result["accessToken"]
        api.slug = slug
        profile = api.call("GET", "/auth/me")["data"]
        users = api.call("GET", "/users/")["data"]
        assert len(users) == 1 and users[0]["id"] == profile["id"]
        roles = api.call("GET", "/roles/")["data"]
        assert {role["slug"] for role in roles} == {
            "admin",
            "procurement-officer",
            "viewer",
            "supplier",
        }
        settings = api.call("GET", "/settings/")["data"]
        assert settings["name"] == body["organization_name"]
        assert api.call("GET", "/suppliers/")["data"] == []
        api.call("POST", "/auth/signup", body, 409)
        api.call("POST", "/auth/signup", {**body, "org_slug": "default"}, 409)
        login = api.call(
            "POST", "/auth/login", {"email": body["email"], "password": password, "org_slug": slug}
        )["data"]
        api.token = login["accessToken"]
        api.call("POST", "/auth/logout", {"refreshToken": login["refreshToken"]})
        api.call("POST", "/auth/refresh", {}, token=login["refreshToken"], expected=401)
        print(f"All {api.checks} signup HTTP checks passed.", flush=True)

    try:
        orm.session.commit()
        exercise()
        org = db.organization.find_unique(where={"slug": slug})
        assert org and db.user.count(where={"orgId": org.id}) == 1
    finally:
        org = db.organization.find_unique(where={"slug": slug})
        if org:
            db.organization.delete(where={"id": org.id})
        orm.session.commit()
        print("Temporary signup organization removed.", flush=True)


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        exercise_main()
