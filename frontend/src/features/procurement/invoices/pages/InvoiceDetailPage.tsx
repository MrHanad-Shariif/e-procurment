import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useInvoice, useInvoiceAction } from "@/features/procurement/invoices/hooks/useInvoices";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { PurchaseInvoice, InvoiceItem } from "@/shared/types/procurement";

const STATUS_ACTIONS: Record<string, Array<{ action: string; label: string; variant: "default" | "destructive" | "outline"; permission: string }>> = {
  DRAFT: [
    { action: "submit", label: "invoice.action.submit", variant: "default", permission: "invoice.create" },
    { action: "cancel", label: "invoice.action.cancel", variant: "destructive", permission: "invoice.create" },
  ],
  MATCHED: [
    { action: "approve", label: "invoice.action.approve", variant: "default", permission: "invoice.approve" },
  ],
  MISMATCHED: [
    { action: "approve", label: "invoice.action.approveOverride", variant: "outline", permission: "invoice.override_mismatch" },
  ],
  APPROVED: [
    { action: "pay", label: "invoice.action.pay", variant: "default", permission: "invoice.pay" },
  ],
};

const MATCH_COLORS: Record<string, string> = {
  MATCHED: "bg-green-100 text-green-800",
  QTY_MISMATCH: "bg-orange-100 text-orange-800",
  RATE_MISMATCH: "bg-orange-100 text-orange-800",
  BOTH_MISMATCH: "bg-red-100 text-red-800",
  UNMATCHED: "bg-gray-100 text-gray-600",
};

export function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: inv, isLoading } = useInvoice(id || "") as { data: PurchaseInvoice | undefined; isLoading: boolean };
  const invoiceAction = useInvoiceAction(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!inv) return <div className="p-6">{t("invoice.notFound")}</div>;

  const actions = STATUS_ACTIONS[inv.status] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/invoices")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{inv.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`invoice.status.${inv.status}`)} · {inv.currency}
            {inv.supplierInvoiceRef && ` · ${inv.supplierInvoiceRef}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${MATCH_COLORS[inv.matchStatus] || ""}`}>
            {t(`invoice.matchStatus.${inv.matchStatus}`)}
          </span>
          {actions.map((a) => (
            <PermissionGate key={a.action} permission={a.permission}>
              <Button
                variant={a.variant}
                size="sm"
                onClick={() => invoiceAction.mutate({ action: a.action })}
                disabled={invoiceAction.isPending}
              >
                {t(a.label)}
              </Button>
            </PermissionGate>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("invoice.lineItems")}</CardTitle>
            <div className="text-end">
              <div className="text-sm text-muted-foreground">{t("invoice.subtotal")}: {inv.subtotal.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{t("invoice.tax")}: {inv.taxAmount.toLocaleString()}</div>
              <div className="text-lg font-bold">{t("pr.total")}: {inv.totalAmount.toLocaleString()} {inv.currency}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">#</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.itemDescription")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("invoice.invoicedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("gr.orderedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("gr.receivedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.unitPrice")}</th>
                  <th className="px-4 py-3 text-center font-medium">{t("invoice.qtyMatch")}</th>
                  <th className="px-4 py-3 text-center font-medium">{t("invoice.rateMatch")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.lineTotal")}</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item: InvoiceItem, idx: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.invoicedQty}</td>
                    <td className="px-4 py-3 text-end font-mono text-muted-foreground">{item.orderedQty}</td>
                    <td className="px-4 py-3 text-end font-mono text-muted-foreground">{item.receivedQty}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {item.qtyMatch
                        ? <CheckCircle2 className="inline h-4 w-4 text-green-600" />
                        : <XCircle className="inline h-4 w-4 text-red-500" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.rateMatch
                        ? <CheckCircle2 className="inline h-4 w-4 text-green-600" />
                        : <XCircle className="inline h-4 w-4 text-red-500" />}
                    </td>
                    <td className="px-4 py-3 text-end font-mono font-medium">{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("invoice.info")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("invoice.dueDate")}</span>
              <p>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("po.paymentTerms")}</span>
              <p>{inv.paymentTerms || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("invoice.paidAt")}</span>
              <p>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          {inv.notes && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">{t("suppliers.notes")}</span>
              <p className="whitespace-pre-wrap">{inv.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
