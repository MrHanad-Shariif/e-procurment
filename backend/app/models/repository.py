"""SQLAlchemy repositories retaining procurement service query contracts.

Operations share the request session and commit once per successful request.
New domains use SQLAlchemy statements directly; this boundary keeps existing
procurement APIs stable while their services move to native statements.
"""

from contextlib import contextmanager
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import selectinload
from flask import has_request_context
from flask_jwt_extended import get_jwt
from app.extensions import db
from app.models.entities import MODEL_REGISTRY


def attribute(model, name):
    if hasattr(model, name):
        return getattr(model, name)
    for prop in model.__mapper__.column_attrs:
        if prop.columns[0].name == name:
            return getattr(model, prop.key)
    raise ValueError(f"Unknown field {model.__name__}.{name}")


def predicate(model, where):
    clauses = []
    for key, value in (where or {}).items():
        if key in {"OR", "AND", "NOT"}:
            values = value if isinstance(value, list) else [value]
            grouped = [predicate(model, item) for item in values]
            clause = or_(*grouped) if key == "OR" else and_(*grouped)
            clauses.append(~clause if key == "NOT" else clause)
            continue
        if not hasattr(model, key) and isinstance(value, dict):
            clauses.append(predicate(model, value))
            continue
        column = attribute(model, key)
        if not isinstance(value, dict):
            clauses.append(column == value)
            continue
        for op, operand in value.items():
            if op == "mode":
                continue
            if op == "contains":
                escaped = str(operand).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
                pattern = f"%{escaped}%"
                clauses.append(
                    column.ilike(pattern, escape="\\")
                    if value.get("mode") == "insensitive"
                    else column.like(pattern, escape="\\")
                )
            elif op == "in":
                clauses.append(column.in_(operand))
            elif op == "not":
                clauses.append(column != operand)
            elif op == "gte":
                clauses.append(column >= operand)
            elif op == "gt":
                clauses.append(column > operand)
            elif op == "lte":
                clauses.append(column <= operand)
            elif op == "lt":
                clauses.append(column < operand)
            elif op == "equals":
                clauses.append(column == operand)
            else:
                raise ValueError(f"Unsupported query operator {op}")
    return and_(*clauses) if clauses else True


class ModelRepository:
    def __init__(self, model):
        self.model = model

    def find_many(self, where=None, order=None, skip=0, take=None, include=None):
        statement = select(self.model).where(predicate(self.model, where))
        org_id = current_org_id()
        if org_id and hasattr(self.model, "orgId"):
            statement = statement.where(self.model.orgId == org_id)
        statement = statement.options(*eager_options(self.model, include))
        if include:
            statement = statement.execution_options(populate_existing=True)
        for ordering in [order] if isinstance(order, dict) else order or []:
            for key, direction in ordering.items():
                column = attribute(self.model, key)
                statement = statement.order_by(
                    column.desc() if direction == "desc" else column.asc()
                )
        statement = statement.offset(skip)
        if take is not None:
            statement = statement.limit(take)
        rows = list(db.session.scalars(statement).unique())
        for row in rows:
            self._include(row, include)
        return rows

    def _include(self, row, include):
        for name, options in (include or {}).items():
            if not options:
                continue
            related = getattr(row, name)
            if not isinstance(options, dict):
                continue
            children = related if isinstance(related, list) else [related] if related else []
            order = options.get("order_by", options.get("order"))
            if order and isinstance(related, list):
                for field, direction in reversed(list(order.items())):
                    related.sort(
                        key=lambda child: getattr(child, attribute(type(child), field).key),
                        reverse=direction == "desc",
                    )
            for child in children:
                self._include(child, options.get("include"))

    def find_first(self, where=None, include=None, order=None):
        rows = self.find_many(where=where, include=include, order=order, take=1)
        return rows[0] if rows else None

    find_unique = find_first

    def count(self, where=None):
        return db.session.scalar(
            select(func.count()).select_from(self.model).where(predicate(self.model, where))
        )

    def create(self, data, include=None):
        validate_references(self.model, data)
        row = self.model(**data)
        db.session.add(row)
        db.session.flush()
        self._include(row, include)
        return row

    def create_many(self, data):
        for item in data:
            validate_references(self.model, item)
            db.session.add(self.model(**item))
        db.session.flush()
        return len(data)

    def update(self, where, data, include=None):
        row = self.find_first(where=where)
        if row is None:
            raise ValueError(f"{self.model.__name__} not found")
        validate_references(self.model, data)
        for key, value in data.items():
            setattr(row, key, value)
        db.session.flush()
        self._include(row, include)
        return row

    def upsert(self, where, data):
        row = self.find_first(where=where)
        return self.update(where, data["update"]) if row else self.create(data["create"])

    def delete(self, where):
        row = self.find_first(where=where)
        if row is None:
            raise ValueError(f"{self.model.__name__} not found")
        db.session.delete(row)
        db.session.flush()
        return row

    def delete_many(self, where):
        rows = self.find_many(where=where)
        for row in rows:
            db.session.delete(row)
        db.session.flush()
        return len(rows)

    def update_many(self, where, data):
        rows = self.find_many(where=where)
        for row in rows:
            for key, value in data.items():
                setattr(row, key, value)
        db.session.flush()
        return len(rows)


class Repository:
    def __getattr__(self, name):
        try:
            return ModelRepository(MODEL_REGISTRY[name])
        except KeyError as error:
            raise AttributeError(name) from error

    @contextmanager
    def tx(self, **options):
        with db.session.begin_nested():
            yield self


def current_org_id():
    if not has_request_context():
        return None
    try:
        return get_jwt().get("org_id")
    except RuntimeError:
        return None


def eager_options(model, include):
    options = []
    for key, value in (include or {}).items():
        if not value:
            continue
        relation = getattr(model, key)
        loader = selectinload(relation)
        if isinstance(value, dict):
            loader = loader.options(
                *eager_options(relation.property.mapper.class_, value.get("include"))
            )
        options.append(loader)
    return options


def validate_references(model, data):
    org_id = current_org_id()
    if not org_id:
        return
    if data.get("orgId", org_id) != org_id:
        raise ValueError("Cross-organization records are not allowed")
    targets = {
        "supplierId": "supplier",
        "userId": "user",
        "roleId": "role",
        "prId": "purchaserequisition",
        "rfqId": "requestforquotation",
        "poId": "purchaseorder",
        "grId": "goodsreceipt",
        "invoiceId": "purchaseinvoice",
        "contractId": "contract",
        "poItemId": "purchaseorderitem",
        "grItemId": "goodsreceiptitem",
    }
    for field, target in targets.items():
        if not data.get(field):
            continue
        parent = db.session.get(MODEL_REGISTRY[target], data[field])
        if parent is None:
            raise ValueError(f"Unknown source {field}")
        parent_org = getattr(parent, "orgId", None)
        if parent_org is None:
            parent_org = (
                parent.purchaseOrder.orgId
                if target == "purchaseorderitem"
                else parent.goodsReceipt.orgId
                if target == "goodsreceiptitem"
                else None
            )
        if parent_org and parent_org != org_id:
            raise ValueError("Source belongs to another organization")
    if data.get("grId") and data.get("poId"):
        receipt = db.session.get(MODEL_REGISTRY["goodsreceipt"], data["grId"])
        if receipt.poId != data["poId"]:
            raise ValueError("Receipt does not belong to this order")
