from typing import Any
from app.models import get_repository


def _get_org_settings(org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    org = db.organization.find_unique(where={"id": org_id})
    if not org:
        return None
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "logoUrl": org.logoUrl,
        "primaryColor": org.primaryColor,
        "secondaryColor": org.secondaryColor,
        "systemName": org.systemName,
        "defaultLanguage": org.defaultLanguage,
    }


def get_org_settings(org_id: str) -> dict[str, Any] | None:
    return _get_org_settings(org_id)


def _update_org_settings(org_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    update_data: dict[str, Any] = {}
    field_map = {
        "name": "name",
        "logo_url": "logoUrl",
        "primary_color": "primaryColor",
        "secondary_color": "secondaryColor",
        "system_name": "systemName",
        "default_language": "defaultLanguage",
    }
    for key, prisma_key in field_map.items():
        if key in data and data[key] is not None:
            update_data[prisma_key] = data[key]
    org = db.organization.update(where={"id": org_id}, data=update_data)
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "logoUrl": org.logoUrl,
        "primaryColor": org.primaryColor,
        "secondaryColor": org.secondaryColor,
        "systemName": org.systemName,
        "defaultLanguage": org.defaultLanguage,
    }


def update_org_settings(org_id: str, data: dict[str, Any]) -> dict[str, Any]:
    return _update_org_settings(org_id, data)


def _get_smtp_settings(org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    settings = db.systemsettings.find_unique(where={"orgId": org_id})
    if not settings:
        return None
    return {
        "smtpHost": settings.smtpHost,
        "smtpPort": settings.smtpPort,
        "smtpUsername": settings.smtpUsername,
        "smtpPasswordSet": settings.smtpPasswordEncrypted is not None,
        "emailFromName": settings.emailFromName,
        "emailFromAddress": settings.emailFromAddress,
    }


def get_smtp_settings(org_id: str) -> dict[str, Any] | None:
    return _get_smtp_settings(org_id)


def _update_smtp_settings(org_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    update_data: dict[str, Any] = {
        "smtpHost": data["smtp_host"],
        "smtpPort": data["smtp_port"],
        "smtpUsername": data["smtp_username"],
        "emailFromName": data["email_from_name"],
        "emailFromAddress": data["email_from_address"],
    }
    if data.get("smtp_password"):
        update_data["smtpPasswordEncrypted"] = data["smtp_password"]
    db.systemsettings.upsert(
        where={"orgId": org_id},
        data={"create": {**update_data, "orgId": org_id}, "update": update_data},
    )
    return _get_smtp_settings(org_id)


def update_smtp_settings(org_id: str, data: dict[str, Any]) -> dict[str, Any]:
    return _update_smtp_settings(org_id, data)


def _get_session_settings(org_id: str) -> dict[str, Any]:
    db = get_repository()
    settings = db.systemsettings.find_unique(where={"orgId": org_id})
    return {"maxConcurrentSessions": settings.maxConcurrentSessions if settings else 5}


def get_session_settings(org_id: str) -> dict[str, Any]:
    return _get_session_settings(org_id)


def _update_session_settings(org_id: str, max_sessions: int) -> dict[str, Any]:
    db = get_repository()
    db.systemsettings.upsert(
        where={"orgId": org_id},
        data={
            "create": {"orgId": org_id, "maxConcurrentSessions": max_sessions},
            "update": {"maxConcurrentSessions": max_sessions},
        },
    )
    return {"maxConcurrentSessions": max_sessions}


def update_session_settings(org_id: str, max_sessions: int) -> dict[str, Any]:
    return _update_session_settings(org_id, max_sessions)
