"""Repeatable seed and non-destructive legacy import commands."""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5
import click
from sqlalchemy import select
from app.extensions import db
from app.models.entities import (
    Organization,
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
    SystemSettings,
    Supplier,
)
from app.models.tendering import (
    Tender,
    TenderRequirement,
    Proposal,
    ProposalRequirement,
    ContactMessage,
)
from app.permission_catalog import PERMISSIONS
from app.domains.identity.services.auth_service import hash_password
from app.models.entities import Notification
from app.models.tendering import Inquiry
from flask import current_app
import shutil

TENDER_PERMISSIONS = [
    ("tender", f"tender.{action}", f"Tender {action}")
    for action in ["view", "create", "edit", "approve", "evaluate", "award", "submit_proposal"]
]


def seed():
    permissions = {}
    for group, codename, description in PERMISSIONS + TENDER_PERMISSIONS:
        item = db.session.scalar(select(Permission).where(Permission.codename == codename))
        if item is None:
            item = Permission(group=group, codename=codename, description=description)
            db.session.add(item)
            db.session.flush()
        permissions[codename] = item
    organizations = list(db.session.scalars(select(Organization)))
    if not organizations:
        org = Organization(name="TenderRank Workspace", slug="default", systemName="TenderRank")
        db.session.add(org)
        db.session.flush()
        organizations = [org]
    for org in organizations:
        role_specs = {
            "admin": list(permissions),
            "procurement-officer": [
                key
                for key in permissions
                if key.startswith(
                    (
                        "tender.",
                        "purchase_request.",
                        "rfq.",
                        "purchase_order.",
                        "supplier.",
                        "goods_receipt.",
                        "invoice.",
                        "contract.",
                    )
                )
                and key != "tender.approve"
            ],
            "viewer": [key for key in permissions if key.endswith(".view")],
            "supplier": ["tender.view", "tender.submit_proposal"],
        }
        for slug, names in role_specs.items():
            role = db.session.scalar(select(Role).where(Role.orgId == org.id, Role.slug == slug))
            if role is None:
                role = Role(
                    orgId=org.id, name=slug.replace("-", " ").title(), slug=slug, isSystem=True
                )
                db.session.add(role)
                db.session.flush()
            # Existing custom permissions remain intact; add catalog grants idempotently.
            for name in names:
                if not db.session.scalar(
                    select(RolePermission.id).where(
                        RolePermission.roleId == role.id,
                        RolePermission.permissionId == permissions[name].id,
                    )
                ):
                    db.session.add(
                        RolePermission(roleId=role.id, permissionId=permissions[name].id)
                    )
        if not db.session.scalar(select(SystemSettings.id).where(SystemSettings.orgId == org.id)):
            db.session.add(SystemSettings(orgId=org.id))
        if org.slug == "default" and not db.session.scalar(
            select(User.id).where(User.orgId == org.id)
        ):
            admin = User(
                orgId=org.id,
                email="admin@example.com",
                firstName="System",
                lastName="Admin",
                passwordHash=hash_password("admin123"),
            )
            db.session.add(admin)
            db.session.flush()
            role = db.session.scalar(select(Role).where(Role.orgId == org.id, Role.slug == "admin"))
            db.session.add(UserRole(userId=admin.id, roleId=role.id))
    db.session.flush()


def legacy_id(table, value):
    return str(uuid5(NAMESPACE_URL, f"tenderrank-legacy:{table}:{value}"))


def parse_date(value):
    if not value:
        return None
    date = datetime.fromisoformat(value)
    return date if date.tzinfo else date.replace(tzinfo=timezone.utc)


def import_tenderrank(path, org_slug):
    source = sqlite3.connect(f"file:{Path(path).resolve()}?mode=ro", uri=True)
    source.row_factory = sqlite3.Row
    org = db.session.scalar(select(Organization).where(Organization.slug == org_slug))
    if not org:
        raise click.ClickException("Destination organization does not exist")
    tables = {row[0] for row in source.execute("SELECT name FROM sqlite_master WHERE type='table'")}

    def rows(table):
        return (
            [dict(r) for r in source.execute(f'SELECT * FROM "{table}"')] if table in tables else []
        )

    users, suppliers = {}, {}

    def import_file(legacy_path):
        if not legacy_path:
            return None
        normalized = str(legacy_path).replace('\\', '/')
        relative = Path(normalized.rsplit('uploads/', 1)[-1])
        source_root = (Path(path).resolve().parent.parent / 'uploads').resolve()
        source_file = (source_root / relative).resolve()
        if not source_file.is_relative_to(source_root) or not source_file.is_file():
            raise click.ClickException(f'Missing or invalid legacy attachment: {relative}')
        destination_root = Path(current_app.config['UPLOAD_FOLDER']).resolve()
        destination_relative = Path(org.id) / 'legacy' / relative
        destination = (destination_root / destination_relative).resolve()
        if not destination.is_relative_to(destination_root):
            raise click.ClickException('Invalid attachment destination')
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_file, destination)
        return destination_relative.as_posix()
    counts = {}
    for old in rows("users"):
        user = db.session.scalar(
            select(User).where(User.orgId == org.id, User.email == old["email"])
        )
        target_id = legacy_id("users", old["id"])
        if user and user.id != target_id:
            raise click.ClickException(
                f"Identity collision for {old['email']}; resolve before importing"
            )
        if not user:
            parts = old["name"].split(" ", 1)
            profile = {
                k: v for k, v in old.items() if k not in {"password", "id", "role", "name", "email"}
            }
            user = User(
                id=target_id,
                orgId=org.id,
                email=old["email"],
                firstName=parts[0],
                lastName=parts[1] if len(parts) > 1 else "",
                passwordHash=old["password"],
                profile=profile,
            )
            db.session.add(user)
            db.session.flush()
            slug = {"super_admin": "admin", "admin": "procurement-officer", "supplier": "supplier"}[
                old["role"]
            ]
            role = db.session.scalar(select(Role).where(Role.orgId == org.id, Role.slug == slug))
            db.session.add(UserRole(userId=user.id, roleId=role.id))
        users[old["id"]] = user.id
        if old["role"] == "supplier":
            supplier = db.session.scalar(
                select(Supplier).where(Supplier.orgId == org.id, Supplier.email == old["email"])
            )
            if not supplier:
                supplier = Supplier(
                    orgId=org.id,
                    name=old.get("company_name") or old["name"],
                    email=old["email"],
                    status="APPROVED",
                    createdById=user.id,
                )
                db.session.add(supplier)
                db.session.flush()
            user.supplierId = supplier.id
            suppliers[old["id"]] = supplier.id
    counts["users"] = len(users)
    for table, model, fields in [
        (
            "tenders",
            Tender,
            [
                "title",
                "description",
                "sector",
                "pdf_path",
                "approval_status",
                "rejection_reason",
                "screening_status",
            ],
        ),
        (
            "tender_requirements",
            TenderRequirement,
            ["requirement_name", "display_label", "points", "is_mandatory"],
        ),
        ("proposals", Proposal, ["pdf_path", "score", "status"]),
        (
            "proposal_requirements",
            ProposalRequirement,
            [
                "requirement_name",
                "display_label",
                "detected",
                "is_mandatory",
                "points_earned",
                "points_possible",
                "confidence",
                "matched_text",
            ],
        ),
    ]:
        source_rows = rows(table)
        for old in source_rows:
            target_id = legacy_id(table, old["id"])
            if db.session.get(model, target_id):
                continue
            data = {key: old[key] for key in fields if key in old and old[key] is not None}
            data["id"] = target_id
            if data.get('pdf_path'):
                data['pdf_path'] = import_file(data['pdf_path'])
            if table == "tenders":
                data.update(org_id=org.id, created_by_id=users.get(old.get("created_by_id")))
                for key in [
                    "deadline",
                    "created_at",
                    "submitted_at",
                    "reviewed_at",
                    "screening_started_at",
                    "results_notified_at",
                ]:
                    if old.get(key):
                        data[key] = parse_date(old[key])
            elif table == "tender_requirements":
                data["tender_id"] = legacy_id("tenders", old["tender_id"])
            elif table == "proposals":
                data.update(
                    org_id=org.id,
                    tender_id=legacy_id("tenders", old["tender_id"]),
                    supplier_id=suppliers[old["supplier_id"]],
                    submitted_by_id=users[old["supplier_id"]],
                    red_flags=json.loads(old.get("red_flags") or "[]"),
                    submitted_at=parse_date(old["submitted_at"]),
                )
            else:
                data["proposal_id"] = legacy_id("proposals", old["proposal_id"])
            db.session.add(model(**data))
        db.session.flush()
        counts[table] = len(source_rows)
    for old in rows("contact_messages"):
        target_id = legacy_id("contact_messages", old["id"])
        if not db.session.get(ContactMessage, target_id):
            db.session.add(
                ContactMessage(
                    id=target_id,
                    org_id=org.id,
                    **{
                        key: old[key]
                        for key in ["name", "email", "subject", "message", "is_read"]
                        if key in old
                    },
                )
            )
    for old in rows('notifications'):
        target_id = legacy_id('notifications', old['id'])
        if not db.session.get(Notification, target_id):
            db.session.add(Notification(id=target_id, orgId=org.id,
                userId=users[old['user_id']], type=old['type'], title=old['title'],
                message=old.get('body') or '', isRead=bool(old.get('is_read')),
                entityType='tender' if old.get('tender_id') else None,
                entityId=legacy_id('tenders', old['tender_id']) if old.get('tender_id') else None,
                createdAt=parse_date(old.get('created_at')) or datetime.now(timezone.utc)))
    counts['notifications'] = len(rows('notifications'))
    for old in rows('inquiries'):
        target_id = legacy_id('inquiries', old['id'])
        if not db.session.get(Inquiry, target_id):
            detail = json.loads(old.get('verification_detail') or '{}')
            db.session.add(Inquiry(id=target_id, org_id=org.id, email=old['email'],
                contact_name=old['contact_name'], company_name=old['company_name'],
                status=old.get('status') or 'pending', profile_path=import_file(old.get('profile_path')),
                rejection_reason=old.get('rejection_reason'),
                created_at=parse_date(old.get('created_at')) or datetime.now(timezone.utc),
                reviewed_at=parse_date(old.get('reviewed_at')),
                details={**{key: old.get(key) for key in ['website', 'dns_ok', 'http_ok',
                    'content_ok', 'extracted_domain', 'extracted_company']},
                    'verification_detail': detail, 'verdict': detail.get('verdict'),
                    'confidence': detail.get('confidence')}))
    counts['inquiries'] = len(rows('inquiries'))
    counts['contact_messages'] = len(rows('contact_messages'))
    source.close()
    return counts


def register_commands(app):
    @app.cli.command("seed")
    def seed_command():
        seed()
        db.session.commit()
        click.echo("Shared permissions and workspace initialized; existing passwords preserved.")

    @app.cli.command("import-tenderrank")
    @click.argument("path", type=click.Path(exists=True))
    @click.option("--org", "org_slug", default="default")
    def import_command(path, org_slug):
        try:
            counts = import_tenderrank(path, org_slug)
            db.session.commit()
            click.echo(json.dumps(counts))
        except Exception:
            db.session.rollback()
            raise
