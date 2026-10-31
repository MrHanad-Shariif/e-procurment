"""Shared identity, document and evaluation helpers."""

from pathlib import Path
from uuid import uuid4
from flask import current_app
from sqlalchemy import select
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.entities import Supplier, UserRole, Role


def profile_dict(user):
    roles = list(
        db.session.scalars(
            select(Role.slug)
            .join(UserRole, UserRole.roleId == Role.id)
            .where(UserRole.userId == user.id)
        )
    )
    role = "super_admin" if "admin" in roles else "supplier" if "supplier" in roles else "admin"
    return {
        **(user.profile or {}),
        "id": user.id,
        "name": f"{user.firstName} {user.lastName}".strip(),
        "email": user.email,
        "role": role,
        "supplierId": user.supplierId,
        "must_change_password": bool((user.profile or {}).get("must_change_password")),
    }


def save_upload(file, category, org_id):
    if not file or not file.filename:
        return None
    name = secure_filename(file.filename)
    if Path(name).suffix.lower() not in {".pdf", ".docx", ".txt"}:
        raise ValueError("Upload a PDF, DOCX or text document")
    relative = Path(org_id) / category / f"{uuid4()}-{name}"
    target = Path(current_app.config["UPLOAD_FOLDER"]) / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    file.save(target)
    return relative.as_posix()


def extract_document(relative):
    target = Path(current_app.config["UPLOAD_FOLDER"]) / relative
    if target.suffix.lower() == ".pdf":
        import pdfplumber

        with pdfplumber.open(target) as document:
            return "\n".join(page.extract_text() or "" for page in document.pages)
    if target.suffix.lower() == ".docx":
        from docx import Document

        document = Document(target)
        return "\n".join(
            [p.text for p in document.paragraphs]
            + [
                " | ".join(c.text for c in row.cells)
                for table in document.tables
                for row in table.rows
            ]
        )
    return target.read_text(encoding="utf-8")
