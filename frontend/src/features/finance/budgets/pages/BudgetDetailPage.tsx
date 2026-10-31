import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet } from "lucide-react";
import { useBudget, useUpdateBudget } from "@/features/finance/budgets/hooks/useBudgets";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { Budget } from "@/shared/types/procurement";

export function BudgetDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: budget, isLoading } = useBudget(id || "") as { data: Budget | undefined; isLoading: boolean };
  const updateBudget = useUpdateBudget(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!budget) return <div className="p-6">{t("budget.notFound")}</div>;

  const spentPct = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
  const committedPct = budget.totalAmount > 0 ? (budget.committedAmount / budget.totalAmount) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/budgets")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{budget.name}</h1>
            <p className="text-sm text-muted-foreground">
              {budget.costCenter} · FY{budget.fiscalYear} · {t(`budget.period.${budget.period}`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${budget.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
            {budget.isActive ? t("users.active") : t("users.inactive")}
          </span>
          <PermissionGate permission="budget.manage">
            <Button
              variant={budget.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => updateBudget.mutate({ is_active: !budget.isActive })}
              disabled={updateBudget.isPending}
            >
              {budget.isActive ? t("users.deactivate") : t("users.activate")}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("budget.total")}</p>
            <p className="mt-1 text-2xl font-bold">{budget.totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("budget.spent")}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{budget.spentAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{spentPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("budget.committed")}</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{budget.committedAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{committedPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("budget.available")}</p>
            <p className={`mt-1 text-2xl font-bold ${budget.availableAmount < 0 ? "text-red-600" : "text-blue-600"}`}>
              {budget.availableAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("budget.controls")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.controlOnPr")}</p>
              <p className="font-medium">{t(`budget.action.${budget.controlOnPr}`)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.controlOnPo")}</p>
              <p className="font-medium">{t(`budget.action.${budget.controlOnPo}`)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
