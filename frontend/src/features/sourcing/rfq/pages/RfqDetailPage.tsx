import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import { useRfq, useRfqAction, useAwardSupplier } from "@/features/sourcing/rfq/hooks/useRfq";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { RequestForQuotation } from "@/shared/types/procurement";

const STATUS_ACTIONS: Record<string, Array<{ action: string; label: string; variant: "default" | "destructive" | "outline"; permission: string }>> = {
  DRAFT: [
    { action: "publish", label: "rfq.action.publish", variant: "default", permission: "rfq.publish" },
    { action: "cancel", label: "rfq.action.cancel", variant: "destructive", permission: "rfq.create" },
  ],
  PUBLISHED: [
    { action: "close", label: "rfq.action.close", variant: "outline", permission: "rfq.approve" },
  ],
};

export function RfqDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading } = useRfq(id || "") as { data: RequestForQuotation | undefined; isLoading: boolean };
  const rfqAction = useRfqAction(id || "");
  const awardSupplier = useAwardSupplier(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!rfq) return <div className="p-6">{t("rfq.notFound")}</div>;

  const actions = STATUS_ACTIONS[rfq.status] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/rfq")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{rfq.rfqNumber} — {rfq.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`rfq.status.${rfq.status}`)} · {rfq.currency}
            {rfq.deadline && ` · ${t("rfq.deadline")}: ${new Date(rfq.deadline).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          {actions.map((a) => (
            <PermissionGate key={a.action} permission={a.permission}>
              <Button
                variant={a.variant}
                size="sm"
                onClick={() => rfqAction.mutate(a.action)}
                disabled={rfqAction.isPending}
              >
                {t(a.label)}
              </Button>
            </PermissionGate>
          ))}
        </div>
      </div>

      {rfq.description && (
        <Card>
          <CardHeader><CardTitle>{t("rfq.description")}</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap">{rfq.description}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t("rfq.items")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">#</th>
                  <th className="px-4 py-3 text-start font-medium">{t("rfq.itemDescription")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.qty")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.unit")}</th>
                </tr>
              </thead>
              <tbody>
                {rfq.items?.map((item, idx) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>{item.description}</div>
                      {item.specifications && <div className="text-xs text-muted-foreground">{item.specifications}</div>}
                    </td>
                    <td className="px-4 py-3 text-end font-mono">{item.quantity}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("rfq.invitedSuppliers")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("suppliers.name")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("rfq.bids")}</th>
                  {rfq.status === "CLOSED" && (
                    <th className="px-4 py-3 text-end font-medium">{t("common.actions")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rfq.suppliers?.map((rs) => (
                  <tr key={rs.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{rs.supplier?.name || rs.supplierId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        rs.status === "AWARDED" ? "bg-green-100 text-green-800" :
                        rs.status === "RESPONDED" ? "bg-blue-100 text-blue-800" :
                        rs.status === "DECLINED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {t(`rfq.supplierStatus.${rs.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end font-mono">
                      {rs.bids?.length || 0}
                    </td>
                    {rfq.status === "CLOSED" && (
                      <td className="px-4 py-3 text-end">
                        <PermissionGate permission="rfq.approve">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => awardSupplier.mutate(rs.supplierId)}
                            disabled={awardSupplier.isPending || rs.status === "AWARDED"}
                          >
                            <Trophy className="me-1 h-3 w-3" /> {t("rfq.action.award")}
                          </Button>
                        </PermissionGate>
                      </td>
                    )}
                  </tr>
                ))}
                {(!rfq.suppliers || rfq.suppliers.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t("rfq.noSuppliers")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {rfq.termsAndConditions && (
        <Card>
          <CardHeader><CardTitle>{t("rfq.terms")}</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap">{rfq.termsAndConditions}</p></CardContent>
        </Card>
      )}
    </motion.div>
  );
}
