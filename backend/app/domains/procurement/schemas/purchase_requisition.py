from pydantic import BaseModel


class PrItemSchema(BaseModel):
    description: str
    quantity: float
    unit: str = "PCS"
    estimated_price: float = 0
    budget_code: str | None = None
    specifications: str | None = None


class CreatePrSchema(BaseModel):
    title: str
    description: str | None = None
    priority: str = "MEDIUM"
    required_date: str | None = None
    currency: str = "USD"
    items: list[PrItemSchema]


class UpdatePrSchema(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    required_date: str | None = None
    currency: str | None = None
    items: list[PrItemSchema] | None = None


class PrActionSchema(BaseModel):
    action: str
    notes: str | None = None
