from pydantic import BaseModel


class PoItemSchema(BaseModel):
    description: str
    quantity: float
    unit: str = "PCS"
    unit_price: float
    specifications: str | None = None


class CreatePoSchema(BaseModel):
    supplier_id: str
    rfq_id: str | None = None
    delivery_date: str | None = None
    delivery_address: str | None = None
    payment_terms: str | None = None
    notes: str | None = None
    currency: str = "USD"
    items: list[PoItemSchema]


class UpdatePoSchema(BaseModel):
    delivery_date: str | None = None
    delivery_address: str | None = None
    payment_terms: str | None = None
    notes: str | None = None


class PoActionSchema(BaseModel):
    action: str
    notes: str | None = None
