import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, Wallet } from "lucide-react";
import { useBudgets } from "@/features/finance/budgets/hooks/useBudgets";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { Budget } from "@/shared/types/procurement";

function ProgressBar({ budget }: { budget: Budget }) {
  const spentPct = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
  const committedPct = budget.totalAmount > 0 ? (budget.committedAmount / budget.totalAmount) * 100 : 0;
  const totalPct = spentPct + committedPct;
  const overBudget = totalPct > 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(totalPct)}%</span>
        <span>{budget.availableAmount.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="flex h-full">
          <div
            className={`${overBudget ? "bg-red-500" : "bg-emerald-500"} transition-all`}
            style={{ width: `${Math.min(spentPct, 100)}%` }}
          />
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${Math.min(committedPct, 100 - Math.min(spentPct, 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function BudgetListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useBudgets(page, 20, search || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const budgets: Budget[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("budget.title")}</h1>
        <PermissionGate permission="budget.create">
          <Button render={<Link to="/budgets/new" />} nativeButton={false}>
            <Plus className="me-2 h-4 w-4" /> {t("budget.createBudget")}
          </Button>
        </PermissionGate>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t("common.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="ps-9" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => (
          <Link key={b.id} to={`/budgets/${b.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{b.name}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {b.isActive ? t("users.active") : t("users.inactive")}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {b.costCenter} · FY{b.fiscalYear} · {t(`budget.period.${b.period}`)}
                </div>
                <ProgressBar budget={b} />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">{t("budget.spent")}</p>
                    <p className="font-mono font-medium">{b.spentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("budget.committed")}</p>
                    <p className="font-mono font-medium">{b.committedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("budget.total")}</p>
                    <p className="font-mono font-medium">{b.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {budgets.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground">{t("common.noResults")}</div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("common.previous")}</Button>
          <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>{t("common.next")}</Button>
        </div>
      )}
    </motion.div>
  );
}
