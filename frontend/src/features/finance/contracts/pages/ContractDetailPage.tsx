import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, ScrollText } from "lucide-react";
import { useContract, useContractAction } from "@/features/finance/contracts/hooks/useContracts";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { Contract, ContractAmendment } from "@/shared/types/procurement";

const STATUS_ACTIONS: Record<string, Array<{ action: string; label: string; variant: "default" | "destructive" | "outline"; permission: string }>> = {
  DRAFT: [
    { action: "activate", label: "contract.action.activate", variant: "default", permission: "contract.approve" },
  ],
  ACTIVE: [
    { action: "terminate", label: "contract.action.terminate", variant: "destructive", permission: "contract.terminate" },
  ],
};

export function ContractDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(id || "") as { data: Contract | undefined; isLoading: boolean };
  const contractAction = useContractAction(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!contract) return <div className="p-6">{t("contract.notFound")}</div>;

  const actions = STATUS_ACTIONS[contract.status] || [];
  const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/contracts")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{contract.contractNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {contract.title} · {contract.supplier?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions.map((a) => (
            <PermissionGate key={a.action} permission={a.permission}>
              <Button
                variant={a.variant}
                size="sm"
                onClick={() => contractAction.mutate({ action: a.action })}
                disabled={contractAction.isPending}
              >
                {t(a.label)}
              </Button>
            </PermissionGate>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("users.status")}</p>
            <p className="mt-1 text-lg font-bold">{t(`contract.status.${contract.status}`)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("contract.totalValue")}</p>
            <p className="mt-1 text-lg font-bold">{contract.totalValue.toLocaleString()} {contract.currency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("contract.endDate")}</p>
            <p className="mt-1 text-lg font-bold">{new Date(contract.endDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("contract.daysRemaining")}</p>
            <p className={`mt-1 text-lg font-bold ${daysLeft < 30 ? "text-red-600" : daysLeft < 90 ? "text-amber-600" : "text-green-600"}`}>
              {daysLeft > 0 ? daysLeft : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("contract.details")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("contract.startDate")}</p>
              <p>{new Date(contract.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("contract.endDate")}</p>
              <p>{new Date(contract.endDate).toLocaleDateString()}</p>
            </div>
            {contract.renewalTerms && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">{t("contract.renewalTerms")}</p>
                <p className="whitespace-pre-wrap">{contract.renewalTerms}</p>
              </div>
            )}
          </div>
          {contract.termsAndConditions && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{t("contract.termsAndConditions")}</p>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{contract.termsAndConditions}</p>
            </div>
          )}
          {contract.description && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{t("pr.description")}</p>
              <p className="whitespace-pre-wrap">{contract.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {contract.amendments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("contract.amendments")} ({contract.amendments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contract.amendments.map((a: ContractAmendment) => (
              <div key={a.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">#{a.amendmentNumber}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.effectiveDate).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-sm">{a.description}</p>
                {(a.oldValue !== null || a.newValue !== null) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.oldValue?.toLocaleString()} → {a.newValue?.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
