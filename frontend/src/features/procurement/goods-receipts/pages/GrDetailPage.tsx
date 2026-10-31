import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGoodsReceipt, useGrAction } from "@/features/procurement/goods-receipts/hooks/useGoodsReceipts";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { GoodsReceipt, GrItem } from "@/shared/types/procurement";

const STATUS_ACTIONS: Record<string, Array<{ action: string; label: string; variant: "default" | "destructive" | "outline"; permission: string }>> = {
  DRAFT: [
    { action: "submit", label: "gr.action.submit", variant: "default", permission: "goods_receipt.create" },
    { action: "cancel", label: "gr.action.cancel", variant: "destructive", permission: "goods_receipt.create" },
  ],
  SUBMITTED: [
    { action: "inspect", label: "gr.action.inspect", variant: "outline", permission: "goods_receipt.inspect" },
    { action: "accept", label: "gr.action.accept", variant: "default", permission: "goods_receipt.accept" },
  ],
  INSPECTING: [
    { action: "accept", label: "gr.action.accept", variant: "default", permission: "goods_receipt.accept" },
    { action: "reject", label: "gr.action.reject", variant: "destructive", permission: "goods_receipt.accept" },
  ],
};

const QUALITY_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PASSED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export function GrDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: gr, isLoading } = useGoodsReceipt(id || "") as { data: GoodsReceipt | undefined; isLoading: boolean };
  const grAction = useGrAction(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!gr) return <div className="p-6">{t("gr.notFound")}</div>;

  const actions = STATUS_ACTIONS[gr.status] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/goods-receipts")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{gr.grNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`gr.status.${gr.status}`)} · {gr.purchaseOrder?.poNumber} · {gr.currency}
          </p>
        </div>
        <div className="flex gap-2">
          {actions.map((a) => (
            <PermissionGate key={a.action} permission={a.permission}>
              <Button
                variant={a.variant}
                size="sm"
                onClick={() => grAction.mutate({ action: a.action })}
                disabled={grAction.isPending}
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
            <CardTitle>{t("gr.lineItems")}</CardTitle>
            <span className="text-lg font-bold">{t("pr.total")}: {gr.totalAmount.toLocaleString()} {gr.currency}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">#</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.itemDescription")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("gr.orderedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("gr.receivedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("gr.acceptedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("gr.rejectedQty")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("gr.quality")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.lineTotal")}</th>
                </tr>
              </thead>
              <tbody>
                {gr.items.map((item: GrItem, idx: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.orderedQty}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.receivedQty}</td>
                    <td className="px-4 py-3 text-end font-mono text-green-700">{item.acceptedQty}</td>
                    <td className="px-4 py-3 text-end font-mono text-red-700">{item.rejectedQty}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${QUALITY_COLORS[item.qualityStatus] || ""}`}>
                        {t(`gr.qualityStatus.${item.qualityStatus}`)}
                      </span>
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
        <CardHeader><CardTitle>{t("gr.info")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("gr.receivedDate")}</span>
              <p>{new Date(gr.receivedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("gr.warehouse")}</span>
              <p>{gr.warehouse || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("gr.deliveryNoteRef")}</span>
              <p>{gr.deliveryNoteRef || "—"}</p>
            </div>
          </div>
          {gr.notes && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">{t("suppliers.notes")}</span>
              <p className="whitespace-pre-wrap">{gr.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
