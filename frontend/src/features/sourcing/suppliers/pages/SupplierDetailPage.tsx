import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useSupplier, useUpdateSupplierStatus } from "@/features/sourcing/suppliers/hooks/useSuppliers";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { Supplier } from "@/shared/types/procurement";

export function SupplierDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: supplier, isLoading } = useSupplier(id || "") as { data: Supplier | undefined; isLoading: boolean };
  const updateStatus = useUpdateSupplierStatus(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!supplier) return <div className="p-6">{t("suppliers.notFound")}</div>;

  const statusActions: Record<string, string[]> = {
    PENDING: ["APPROVED", "BLACKLISTED"],
    APPROVED: ["SUSPENDED", "BLACKLISTED"],
    SUSPENDED: ["APPROVED", "BLACKLISTED"],
    BLACKLISTED: ["PENDING"],
  };
  const availableActions = statusActions[supplier.status] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/suppliers")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">{supplier.email}</p>
        </div>
        <PermissionGate permission="supplier.approve">
          <div className="flex gap-2">
            {availableActions.map((s) => (
              <Button
                key={s}
                variant={s === "BLACKLISTED" ? "destructive" : s === "APPROVED" ? "default" : "outline"}
                size="sm"
                onClick={() => updateStatus.mutate(s)}
                disabled={updateStatus.isPending}
              >
                {t(`suppliers.action.${s}`)}
              </Button>
            ))}
          </div>
        </PermissionGate>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("suppliers.details")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["suppliers.contactPerson", supplier.contactName],
              ["suppliers.phone", supplier.phone],
              ["suppliers.category", supplier.category],
              ["suppliers.taxId", supplier.taxId],
              ["suppliers.website", supplier.website],
            ].map(([label, value]) => (
              <div key={label as string}>
                <span className="text-sm text-muted-foreground">{t(label as string)}</span>
                <p>{(value as string) || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("suppliers.location")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("suppliers.address")}</span>
              <p>{supplier.address || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("suppliers.city")}</span>
              <p>{supplier.city || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("suppliers.country")}</span>
              <p>{supplier.country || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {supplier.notes && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>{t("suppliers.notes")}</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{supplier.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
