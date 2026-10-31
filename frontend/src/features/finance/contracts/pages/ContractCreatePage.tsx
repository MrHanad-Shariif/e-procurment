import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCreateContract } from "@/features/finance/contracts/hooks/useContracts";
import { useSuppliers } from "@/features/sourcing/suppliers/hooks/useSuppliers";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

export function ContractCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createContract = useCreateContract();
  const { data: suppliersData } = useSuppliers(1, 100);
  const suppliers = suppliersData?.items || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [terms, setTerms] = useState("");
  const [renewalTerms, setRenewalTerms] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createContract.mutateAsync({
      title,
      description: description || undefined,
      supplier_id: supplierId,
      start_date: startDate,
      end_date: endDate,
      total_value: totalValue,
      currency,
      terms_and_conditions: terms || undefined,
      renewal_terms: renewalTerms || undefined,
    });
    navigate("/contracts");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/contracts")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("contract.createContract")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("contract.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contract.titleLabel")} *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("po.supplier")} *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="">{t("po.selectSupplier")}</option>
                  {suppliers.map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("pr.currency")}</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label>{t("contract.startDate")} *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("contract.endDate")} *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contract.totalValue")} *</Label>
                <Input type="number" min={0} step="0.01" value={totalValue} onChange={(e) => setTotalValue(Number(e.target.value))} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("pr.description")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contract.termsAndConditions")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contract.renewalTerms")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={renewalTerms} onChange={(e) => setRenewalTerms(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={createContract.isPending || !title || !supplierId || totalValue <= 0}>
          {createContract.isPending ? t("common.saving") : t("contract.createContract")}
        </Button>
      </form>
    </motion.div>
  );
}
