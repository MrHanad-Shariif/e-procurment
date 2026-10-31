from pydantic import BaseModel


class RfqItemSchema(BaseModel):
    description: str
    quantity: float
    unit: str = "PCS"
    specifications: str | None = None


class CreateRfqSchema(BaseModel):
    title: str
    description: str | None = None
    deadline: str | None = None
    terms_and_conditions: str | None = None
    currency: str = "USD"
    pr_id: str | None = None
    items: list[RfqItemSchema]
    supplier_ids: list[str] = []


class UpdateRfqSchema(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: str | None = None
    terms_and_conditions: str | None = None
    currency: str | None = None


class InviteSupplierSchema(BaseModel):
    supplier_ids: list[str]


class SubmitBidSchema(BaseModel):
    rfq_item_id: str
    unit_price: float
    delivery_days: int | None = None
    notes: str | None = None


class AwardSupplierSchema(BaseModel):
    supplier_id: str


class RfqActionSchema(BaseModel):
    action: str
