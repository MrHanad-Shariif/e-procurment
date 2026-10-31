import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { usePurchaseOrder, usePoAction } from "@/features/procurement/purchase-orders/hooks/usePurchaseOrders";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { PurchaseOrder, PoItem } from "@/shared/types/procurement";

const STATUS_ACTIONS: Record<string, Array<{ action: string; label: string; variant: "default" | "destructive" | "outline"; permission: string }>> = {
  DRAFT: [
    { action: "submit", label: "po.action.submit", variant: "default", permission: "purchase_order.create" },
    { action: "cancel", label: "po.action.cancel", variant: "destructive", permission: "purchase_order.create" },
  ],
  PENDING_APPROVAL: [
    { action: "approve", label: "po.action.approve", variant: "default", permission: "purchase_order.approve" },
  ],
  APPROVED: [
    { action: "send", label: "po.action.send", variant: "default", permission: "purchase_order.create" },
  ],
  SENT: [
    { action: "acknowledge", label: "po.action.acknowledge", variant: "outline", permission: "purchase_order.create" },
  ],
  ACKNOWLEDGED: [
    { action: "complete", label: "po.action.complete", variant: "default", permission: "purchase_order.create" },
  ],
};

export function PoDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: po, isLoading } = usePurchaseOrder(id || "") as { data: PurchaseOrder | undefined; isLoading: boolean };
  const poAction = usePoAction(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!po) return <div className="p-6">{t("po.notFound")}</div>;

  const actions = STATUS_ACTIONS[po.status] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/purchase-orders")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{po.poNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`po.status.${po.status}`)} · {po.supplier?.name} · {po.currency}
          </p>
        </div>
        <div className="flex gap-2">
          {actions.map((a) => (
            <PermissionGate key={a.action} permission={a.permission}>
              <Button
                variant={a.variant}
                size="sm"
                onClick={() => poAction.mutate({ action: a.action })}
                disabled={poAction.isPending}
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
            <CardTitle>{t("po.lineItems")}</CardTitle>
            <span className="text-lg font-bold">{t("pr.total")}: {po.totalAmount.toLocaleString()} {po.currency}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">#</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.itemDescription")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.qty")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.unit")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.unitPrice")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.lineTotal")}</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item: PoItem, idx: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.quantity}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end font-mono font-medium">{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("po.info")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("po.deliveryDate")}</span>
              <p>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("po.deliveryAddress")}</span>
              <p>{po.deliveryAddress || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("po.paymentTerms")}</span>
              <p>{po.paymentTerms || "—"}</p>
            </div>
          </div>
          {po.notes && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">{t("suppliers.notes")}</span>
              <p className="whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
