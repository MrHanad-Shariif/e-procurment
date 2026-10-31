import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCreateBudget } from "@/features/finance/budgets/hooks/useBudgets";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

export function BudgetCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createBudget = useCreateBudget();

  const [name, setName] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState("YEARLY");
  const [totalAmount, setTotalAmount] = useState(0);
  const [controlOnPr, setControlOnPr] = useState("WARN");
  const [controlOnPo, setControlOnPo] = useState("WARN");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createBudget.mutateAsync({
      name,
      cost_center: costCenter,
      fiscal_year: fiscalYear,
      period,
      total_amount: totalAmount,
      control_on_pr: controlOnPr,
      control_on_po: controlOnPo,
    });
    navigate("/budgets");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/budgets")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("budget.createBudget")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("budget.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("budget.name")} *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("budget.namePlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("budget.costCenter")} *</Label>
                <Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} required placeholder="IT, HR, Operations..." />
              </div>
              <div className="space-y-2">
                <Label>{t("budget.fiscalYear")} *</Label>
                <Input type="number" min={2020} max={2100} value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label>{t("budget.period")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {["MONTHLY", "QUARTERLY", "YEARLY"].map((p) => (
                    <option key={p} value={p}>{t(`budget.period.${p}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("budget.totalAmount")} *</Label>
                <Input type="number" min={0} step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("budget.controls")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("budget.controlOnPr")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={controlOnPr}
                  onChange={(e) => setControlOnPr(e.target.value)}
                >
                  {["WARN", "STOP", "IGNORE"].map((a) => (
                    <option key={a} value={a}>{t(`budget.action.${a}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("budget.controlOnPo")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={controlOnPo}
                  onChange={(e) => setControlOnPo(e.target.value)}
                >
                  {["WARN", "STOP", "IGNORE"].map((a) => (
                    <option key={a} value={a}>{t(`budget.action.${a}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={createBudget.isPending || !name || !costCenter || totalAmount <= 0}>
          {createBudget.isPending ? t("common.saving") : t("budget.createBudget")}
        </Button>
      </form>
    </motion.div>
  );
}
