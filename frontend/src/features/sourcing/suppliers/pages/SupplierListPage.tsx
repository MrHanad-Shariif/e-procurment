import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, Building2 } from "lucide-react";
import { useSuppliers } from "@/features/sourcing/suppliers/hooks/useSuppliers";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { Supplier } from "@/shared/types/procurement";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  BLACKLISTED: "bg-red-100 text-red-800",
};

export function SupplierListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSuppliers(page, 20, search || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const suppliers: Supplier[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("suppliers.title")}</h1>
        <PermissionGate permission="supplier.create">
          <Button render={<Link to="/suppliers/new" />} nativeButton={false}>
              <Plus className="me-2 h-4 w-4" />
              {t("suppliers.createSupplier")}
            </Button>
        </PermissionGate>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ps-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("suppliers.name")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("suppliers.contact")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("suppliers.category")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/suppliers/${s.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground">{s.email}</div>
                      {s.phone && <div className="text-xs text-muted-foreground">{s.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.category || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] || ""}`}>
                        {t(`suppliers.status.${s.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t("common.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            {t("common.next")}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
