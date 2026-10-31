from pydantic import BaseModel


class GrItemSchema(BaseModel):
    po_item_id: str
    description: str
    ordered_qty: float
    received_qty: float
    accepted_qty: float = 0
    rejected_qty: float = 0
    unit: str = "PCS"
    unit_price: float
    quality_notes: str | None = None


class CreateGrSchema(BaseModel):
    po_id: str
    warehouse: str | None = None
    delivery_note_ref: str | None = None
    received_date: str
    notes: str | None = None
    currency: str = "USD"
    items: list[GrItemSchema]


class GrActionSchema(BaseModel):
    action: str
    notes: str | None = None
