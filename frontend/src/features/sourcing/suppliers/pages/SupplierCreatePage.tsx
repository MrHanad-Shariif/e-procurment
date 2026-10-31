import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCreateSupplier } from "@/features/sourcing/suppliers/hooks/useSuppliers";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

export function SupplierCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    contact_name: "",
    category: "",
    address: "",
    city: "",
    country: "",
    tax_id: "",
    website: "",
    notes: "",
  });

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    );
    await createSupplier.mutateAsync(payload);
    navigate("/suppliers");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/suppliers")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("suppliers.createSupplier")}</h1>

      <Card>
        <CardHeader><CardTitle>{t("suppliers.details")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("suppliers.name")} *</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.email")} *</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.contactPerson")}</Label>
                <Input value={form.contact_name} onChange={(e) => handleChange("contact_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.phone")}</Label>
                <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.category")}</Label>
                <Input value={form.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="IT, Office Supplies, etc." />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.taxId")}</Label>
                <Input value={form.tax_id} onChange={(e) => handleChange("tax_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.website")}</Label>
                <Input value={form.website} onChange={(e) => handleChange("website", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.address")}</Label>
                <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.city")}</Label>
                <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("suppliers.country")}</Label>
                <Input value={form.country} onChange={(e) => handleChange("country", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("suppliers.notes")}</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? t("common.saving") : t("common.create")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
