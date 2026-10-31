import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreatePo } from "@/features/procurement/purchase-orders/hooks/usePurchaseOrders";
import { useSuppliers } from "@/features/sourcing/suppliers/hooks/useSuppliers";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

const emptyItem = (): LineItem => ({ description: "", quantity: 1, unit: "PCS", unit_price: 0 });

export function PoCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPo = useCreatePo();
  const { data: suppliersData } = useSuppliers(1, 100);

  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  const suppliers = suppliersData?.items || [];

  function updateItem(idx: number, key: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPo.mutateAsync({
      supplier_id: supplierId,
      delivery_date: deliveryDate || undefined,
      delivery_address: deliveryAddress || undefined,
      payment_terms: paymentTerms || undefined,
      notes: notes || undefined,
      currency,
      items: items.filter((i) => i.description),
    });
    navigate("/purchase-orders");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/purchase-orders")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("po.createPo")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("po.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label>{t("po.deliveryDate")}</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("po.deliveryAddress")}</Label>
                <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("po.paymentTerms")}</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 30" />
              </div>
              <div className="space-y-2">
                <Label>{t("pr.currency")}</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("suppliers.notes")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("po.lineItems")}</CardTitle>
              <span className="text-lg font-bold">{t("pr.total")}: {total.toLocaleString()} {currency}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid gap-3 rounded-md border p-3 sm:grid-cols-5">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">{t("pr.itemDescription")} *</Label>
                  <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("pr.qty")}</Label>
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("pr.unitPrice")}</Label>
                  <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
              <Plus className="me-2 h-4 w-4" /> {t("po.addItem")}
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={createPo.isPending}>
          {createPo.isPending ? t("common.saving") : t("po.createDraft")}
        </Button>
      </form>
    </motion.div>
  );
}
