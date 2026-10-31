import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreatePr } from "@/features/procurement/purchase-requisitions/hooks/usePurchaseRequisitions";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  budget_code: string;
  specifications: string;
}

const emptyItem = (): LineItem => ({
  description: "", quantity: 1, unit: "PCS", estimated_price: 0, budget_code: "", specifications: "",
});

export function PrCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPr = useCreatePr();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [requiredDate, setRequiredDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  function updateItem(idx: number, key: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((sum, i) => sum + i.estimated_price * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPr.mutateAsync({
      title,
      description: description || undefined,
      priority,
      required_date: requiredDate || undefined,
      currency,
      items: items.filter((i) => i.description),
    });
    navigate("/purchase-requisitions");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/purchase-requisitions")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("pr.createPr")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("pr.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("pr.titleLabel")} *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("pr.description")}</Label>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pr.priority")}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p}>{t(`pr.priority.${p}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("pr.requiredDate")}</Label>
                <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("pr.currency")}</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("pr.lineItems")}</CardTitle>
              <span className="text-lg font-bold">{t("pr.total")}: {total.toLocaleString()} {currency}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid gap-3 rounded-md border p-3 sm:grid-cols-6">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">{t("pr.itemDescription")} *</Label>
                  <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("pr.qty")}</Label>
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("pr.unit")}</Label>
                  <Input value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("pr.unitPrice")}</Label>
                  <Input type="number" min={0} step="0.01" value={item.estimated_price} onChange={(e) => updateItem(idx, "estimated_price", Number(e.target.value))} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
              <Plus className="me-2 h-4 w-4" /> {t("pr.addItem")}
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={createPr.isPending}>
          {createPr.isPending ? t("common.saving") : t("pr.createDraft")}
        </Button>
      </form>
    </motion.div>
  );
}
