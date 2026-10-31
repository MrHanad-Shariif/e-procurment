import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, FileText } from "lucide-react";
import { usePurchaseRequisitions } from "@/features/procurement/purchase-requisitions/hooks/usePurchaseRequisitions";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { PurchaseRequisition } from "@/shared/types/procurement";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600 font-semibold",
};

export function PrListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = usePurchaseRequisitions(page, 20, search || undefined, statusFilter || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const prs: PurchaseRequisition[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("pr.title")}</h1>
        <PermissionGate permission="purchase_request.create">
          <Button render={<Link to="/purchase-requisitions/new" />} nativeButton={false}>
              <Plus className="me-2 h-4 w-4" /> {t("pr.createPr")}
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
          <option value="">{t("pr.allStatuses")}</option>
          {["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{t(`pr.status.${s}`)}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.prNumber")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.titleLabel")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.priority")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pr.estimate")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pr.date")}</th>
                </tr>
              </thead>
              <tbody>
                {prs.map((pr) => (
                  <tr key={pr.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/purchase-requisitions/${pr.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <FileText className="h-4 w-4 shrink-0" />
                        {pr.prNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{pr.title}</td>
                    <td className="px-4 py-3">
                      <span className={PRIORITY_COLORS[pr.priority] || ""}>{t(`pr.priority.${pr.priority}`)}</span>
                    </td>
                    <td className="px-4 py-3 text-end font-mono">
                      {pr.totalEstimate.toLocaleString()} {pr.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[pr.status] || ""}`}>
                        {t(`pr.status.${pr.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(pr.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {prs.length === 0 && (
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
