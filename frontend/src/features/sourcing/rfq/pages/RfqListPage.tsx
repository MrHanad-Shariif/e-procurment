import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, FileText } from "lucide-react";
import { useRfqs } from "@/features/sourcing/rfq/hooks/useRfq";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { RequestForQuotation } from "@/shared/types/procurement";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-purple-100 text-purple-800",
  AWARDED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function RfqListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useRfqs(page, 20, search || undefined, statusFilter || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const rfqs: RequestForQuotation[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("rfq.title")}</h1>
        <PermissionGate permission="rfq.create">
          <Button render={<Link to="/rfq/new" />} nativeButton={false}>
              <Plus className="me-2 h-4 w-4" /> {t("rfq.createRfq")}
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
          <option value="">{t("rfq.allStatuses")}</option>
          {["DRAFT", "PUBLISHED", "CLOSED", "AWARDED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{t(`rfq.status.${s}`)}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("rfq.rfqNumber")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("rfq.titleLabel")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("rfq.suppliers")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("rfq.deadline")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/rfq/${rfq.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <FileText className="h-4 w-4 shrink-0" />
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{rfq.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rfq.suppliers?.length || 0}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[rfq.status] || ""}`}>
                        {t(`rfq.status.${rfq.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
                {rfqs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
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
