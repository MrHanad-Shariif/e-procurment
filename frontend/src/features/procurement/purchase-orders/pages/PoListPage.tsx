import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, ShoppingCart } from "lucide-react";
import { usePurchaseOrders } from "@/features/procurement/purchase-orders/hooks/usePurchaseOrders";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { PurchaseOrder } from "@/shared/types/procurement";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  SENT: "bg-purple-100 text-purple-800",
  ACKNOWLEDGED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function PoListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = usePurchaseOrders(page, 20, search || undefined, statusFilter || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const pos: PurchaseOrder[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("po.title")}</h1>
        <PermissionGate permission="purchase_order.create">
          <Button render={<Link to="/purchase-orders/new" />} nativeButton={false}>
              <Plus className="me-2 h-4 w-4" /> {t("po.createPo")}
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
          <option value="">{t("po.allStatuses")}</option>
          {["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "ACKNOWLEDGED", "COMPLETED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{t(`po.status.${s}`)}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("po.poNumber")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("po.supplier")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("po.totalAmount")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("po.date")}</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/purchase-orders/${po.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <ShoppingCart className="h-4 w-4 shrink-0" />
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{po.supplier?.name || "—"}</td>
                    <td className="px-4 py-3 text-end font-mono">{po.totalAmount.toLocaleString()} {po.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status] || ""}`}>
                        {t(`po.status.${po.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && (
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
