import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreateRfq } from "@/features/sourcing/rfq/hooks/useRfq";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

interface RfqItem {
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
}

const emptyItem = (): RfqItem => ({ description: "", quantity: 1, unit: "PCS", specifications: "" });

export function RfqCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createRfq = useCreateRfq();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [terms, setTerms] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<RfqItem[]>([emptyItem()]);

  function updateItem(idx: number, key: keyof RfqItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createRfq.mutateAsync({
      title,
      description: description || undefined,
      deadline: deadline || undefined,
      terms_and_conditions: terms || undefined,
      currency,
      items: items.filter((i) => i.description),
    });
    navigate("/rfq");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/rfq")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("rfq.createRfq")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("rfq.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("rfq.titleLabel")} *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("rfq.description")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("rfq.deadline")}</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("pr.currency")}</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("rfq.terms")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("rfq.items")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid gap-3 rounded-md border p-3 sm:grid-cols-5">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">{t("rfq.itemDescription")} *</Label>
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
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
              <Plus className="me-2 h-4 w-4" /> {t("rfq.addItem")}
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={createRfq.isPending}>
          {createRfq.isPending ? t("common.saving") : t("rfq.createDraft")}
        </Button>
      </form>
    </motion.div>
  );
}
