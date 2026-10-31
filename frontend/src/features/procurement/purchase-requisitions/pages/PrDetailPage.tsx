import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { usePurchaseRequisition, usePrAction } from "@/features/procurement/purchase-requisitions/hooks/usePurchaseRequisitions";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { PurchaseRequisition, PrItem } from "@/shared/types/procurement";

const STATUS_ACTIONS: Record<string, Array<{ action: string; label: string; variant: "default" | "destructive" | "outline"; permission: string }>> = {
  DRAFT: [
    { action: "submit", label: "pr.action.submit", variant: "default", permission: "purchase_request.create" },
    { action: "cancel", label: "pr.action.cancel", variant: "destructive", permission: "purchase_request.create" },
  ],
  SUBMITTED: [
    { action: "review", label: "pr.action.review", variant: "default", permission: "purchase_request.approve" },
  ],
  UNDER_REVIEW: [
    { action: "approve", label: "pr.action.approve", variant: "default", permission: "purchase_request.approve" },
    { action: "reject", label: "pr.action.reject", variant: "destructive", permission: "purchase_request.reject" },
  ],
  REJECTED: [
    { action: "revise", label: "pr.action.revise", variant: "outline", permission: "purchase_request.create" },
  ],
};

export function PrDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pr, isLoading } = usePurchaseRequisition(id || "") as { data: PurchaseRequisition | undefined; isLoading: boolean };
  const prAction = usePrAction(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!pr) return <div className="p-6">{t("pr.notFound")}</div>;

  const actions = STATUS_ACTIONS[pr.status] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/purchase-requisitions")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pr.prNumber} — {pr.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`pr.status.${pr.status}`)} · {t(`pr.priority.${pr.priority}`)} · {pr.currency}
          </p>
        </div>
        <div className="flex gap-2">
          {actions.map((a) => (
            <PermissionGate key={a.action} permission={a.permission}>
              <Button
                variant={a.variant}
                size="sm"
                onClick={() => prAction.mutate({ action: a.action })}
                disabled={prAction.isPending}
              >
                {t(a.label)}
              </Button>
            </PermissionGate>
          ))}
        </div>
      </div>

      {pr.description && (
        <Card>
          <CardHeader><CardTitle>{t("pr.description")}</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap">{pr.description}</p></CardContent>
        </Card>
      )}

      {pr.rejectionNotes && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">{t("pr.rejectionNotes")}</CardTitle></CardHeader>
          <CardContent><p>{pr.rejectionNotes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("pr.lineItems")}</CardTitle>
            <span className="text-lg font-bold">{t("pr.total")}: {pr.totalEstimate.toLocaleString()} {pr.currency}</span>
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
                {pr.items.map((item: PrItem, idx: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>{item.description}</div>
                      {item.specifications && <div className="text-xs text-muted-foreground">{item.specifications}</div>}
                    </td>
                    <td className="px-4 py-3 text-end font-mono">{item.quantity}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-end font-mono">{item.estimatedPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end font-mono font-medium">{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("pr.info")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("pr.requiredDate")}</span>
              <p>{pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("pr.createdAt")}</span>
              <p>{new Date(pr.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("pr.approvedAt")}</span>
              <p>{pr.approvedAt ? new Date(pr.approvedAt).toLocaleString() : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
