import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, FileCheck } from "lucide-react";
import { useInvoices } from "@/features/procurement/invoices/hooks/useInvoices";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { PurchaseInvoice } from "@/shared/types/procurement";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  MATCHED: "bg-green-100 text-green-800",
  MISMATCHED: "bg-red-100 text-red-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const MATCH_COLORS: Record<string, string> = {
  MATCHED: "bg-green-100 text-green-800",
  QTY_MISMATCH: "bg-orange-100 text-orange-800",
  RATE_MISMATCH: "bg-orange-100 text-orange-800",
  BOTH_MISMATCH: "bg-red-100 text-red-800",
  UNMATCHED: "bg-gray-100 text-gray-600",
};

export function InvoiceListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useInvoices(page, 20, search || undefined, statusFilter || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const invoices: PurchaseInvoice[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("invoice.title")}</h1>
        <PermissionGate permission="invoice.create">
          <Button render={<Link to="/invoices/new" />} nativeButton={false}>
            <Plus className="me-2 h-4 w-4" /> {t("invoice.createInvoice")}
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
          <option value="">{t("invoice.allStatuses")}</option>
          {["DRAFT", "SUBMITTED", "MATCHED", "MISMATCHED", "APPROVED", "PAID", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{t(`invoice.status.${s}`)}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("invoice.invoiceNumber")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("invoice.supplierRef")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("po.totalAmount")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("invoice.matching")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("po.date")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/invoices/${inv.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <FileCheck className="h-4 w-4 shrink-0" />
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.supplierInvoiceRef || "—"}</td>
                    <td className="px-4 py-3 text-end font-mono">{inv.totalAmount.toLocaleString()} {inv.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] || ""}`}>
                        {t(`invoice.status.${inv.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${MATCH_COLORS[inv.matchStatus] || ""}`}>
                        {t(`invoice.matchStatus.${inv.matchStatus}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
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
