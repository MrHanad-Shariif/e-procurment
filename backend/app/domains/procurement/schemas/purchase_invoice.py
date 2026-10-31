from pydantic import BaseModel


class InvoiceItemSchema(BaseModel):
    po_item_id: str | None = None
    gr_item_id: str | None = None
    description: str
    invoiced_qty: float
    unit_price: float


class CreateInvoiceSchema(BaseModel):
    po_id: str
    gr_id: str | None = None
    supplier_invoice_ref: str | None = None
    due_date: str | None = None
    payment_terms: str | None = None
    tax_amount: float = 0
    notes: str | None = None
    currency: str = "USD"
    items: list[InvoiceItemSchema]


class InvoiceActionSchema(BaseModel):
    action: str
    notes: str | None = None
