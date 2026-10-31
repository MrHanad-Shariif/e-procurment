export type ContractStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "RENEWED";

export interface ContractAmendment {
  id: string;
  amendmentNumber: number;
  description: string;
  oldValue: number | null;
  newValue: number | null;
  effectiveDate: string;
  createdById: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  totalValue: number;
  currency: string;
  termsAndConditions: string | null;
  renewalTerms: string | null;
  supplierId: string;
  supplier?: { id: string; name: string };
  amendments: ContractAmendment[];
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type BudgetAction = "WARN" | "STOP" | "IGNORE";

export interface Budget {
  id: string;
  name: string;
  costCenter: string;
  fiscalYear: number;
  period: BudgetPeriod;
  totalAmount: number;
  spentAmount: number;
  committedAmount: number;
  availableAmount: number;
  controlOnPr: BudgetAction;
  controlOnPo: BudgetAction;
  isActive: boolean;
  orgId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  taxId: string | null;
  category: string | null;
  website: string | null;
  contactName: string | null;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "BLACKLISTED";
  rating: number | null;
  notes: string | null;
  createdById: string;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type PrStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
export type RfqStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "AWARDED" | "CANCELLED";
export type PoStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "ACKNOWLEDGED" | "COMPLETED" | "CANCELLED";

export interface PrItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
  budgetCode: string | null;
  specifications: string | null;
  sortOrder: number;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  title: string;
  description: string | null;
  status: PrStatus;
  priority: Priority;
  requiredDate: string | null;
  totalEstimate: number;
  currency: string;
  rejectionNotes: string | null;
  createdById: string;
  createdByName?: string;
  reviewerId: string | null;
  approvedById: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  items: PrItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RfqItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string | null;
  sortOrder: number;
}

export interface SupplierBid {
  id: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number | null;
  notes: string | null;
  rfqItemId: string;
  rfqSupplierId: string;
}

export interface RfqSupplier {
  id: string;
  supplierId: string;
  status: "INVITED" | "RESPONDED" | "AWARDED" | "DECLINED";
  invitedAt: string;
  respondedAt: string | null;
  supplier: Pick<Supplier, "id" | "name" | "email">;
  bids: SupplierBid[];
}

export interface RequestForQuotation {
  id: string;
  rfqNumber: string;
  title: string;
  description: string | null;
  status: RfqStatus;
  deadline: string | null;
  termsAndConditions: string | null;
  currency: string;
  prId: string | null;
  createdById: string;
  items: RfqItem[];
  suppliers: RfqSupplier[];
  createdAt: string;
  updatedAt: string;
}

export interface PoItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

export type GrStatus = "DRAFT" | "SUBMITTED" | "INSPECTING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
export type QualityStatus = "PENDING" | "PASSED" | "FAILED";

export interface GrItem {
  id: string;
  poItemId: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  qualityStatus: QualityStatus;
  qualityNotes: string | null;
  sortOrder: number;
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  status: GrStatus;
  receivedDate: string;
  deliveryNoteRef: string | null;
  warehouse: string | null;
  notes: string | null;
  totalAmount: number;
  currency: string;
  poId: string;
  supplierId: string;
  receivedById: string;
  inspectedById: string | null;
  inspectedAt: string | null;
  purchaseOrder?: { id: string; poNumber: string; status: string };
  items: GrItem[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "DRAFT" | "SUBMITTED" | "MATCHED" | "MISMATCHED" | "APPROVED" | "PAID" | "CANCELLED";
export type MatchStatus = "MATCHED" | "QTY_MISMATCH" | "RATE_MISMATCH" | "BOTH_MISMATCH" | "UNMATCHED";

export interface InvoiceItem {
  id: string;
  poItemId: string | null;
  grItemId: string | null;
  description: string;
  invoicedQty: number;
  unitPrice: number;
  totalPrice: number;
  orderedQty: number;
  receivedQty: number;
  qtyMatch: boolean;
  rateMatch: boolean;
  sortOrder: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceRef: string | null;
  status: InvoiceStatus;
  matchStatus: MatchStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  dueDate: string | null;
  paymentTerms: string | null;
  notes: string | null;
  poId: string;
  grId: string | null;
  supplierId: string;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: PoStatus;
  totalAmount: number;
  currency: string;
  deliveryDate: string | null;
  deliveryAddress: string | null;
  paymentTerms: string | null;
  notes: string | null;
  supplierId: string;
  supplierName?: string;
  supplier?: Pick<Supplier, "id" | "name" | "email">;
  rfqId: string | null;
  createdById: string;
  approvedById: string | null;
  items: PoItem[];
  createdAt: string;
  updatedAt: string;
}
