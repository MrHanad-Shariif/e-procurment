import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, ScrollText } from "lucide-react";
import { useContracts } from "@/features/finance/contracts/hooks/useContracts";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { Contract } from "@/shared/types/procurement";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  TERMINATED: "bg-gray-100 text-gray-500",
  RENEWED: "bg-blue-100 text-blue-800",
};

export function ContractListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useContracts(page, 20, search || undefined, statusFilter || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const contracts: Contract[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("contract.title")}</h1>
        <PermissionGate permission="contract.create">
          <Button render={<Link to="/contracts/new" />} nativeButton={false}>
            <Plus className="me-2 h-4 w-4" /> {t("contract.createContract")}
          </Button>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("common.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="ps-9" />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">{t("contract.allStatuses")}</option>
          {["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED", "RENEWED"].map((s) => (
            <option key={s} value={s}>{t(`contract.status.${s}`)}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("contract.contractNumber")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("contract.titleLabel")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("po.supplier")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("contract.totalValue")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("contract.endDate")}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/contracts/${c.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <ScrollText className="h-4 w-4 shrink-0" />
                        {c.contractNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.title}</td>
                    <td className="px-4 py-3">{c.supplier?.name || "—"}</td>
                    <td className="px-4 py-3 text-end font-mono">{c.totalValue.toLocaleString()} {c.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || ""}`}>
                        {t(`contract.status.${c.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(c.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
