import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCreateGr } from "@/features/procurement/goods-receipts/hooks/useGoodsReceipts";
import { usePurchaseOrders, usePurchaseOrder } from "@/features/procurement/purchase-orders/hooks/usePurchaseOrders";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { PoItem } from "@/shared/types/procurement";

interface GrLineItem {
  po_item_id: string;
  description: string;
  ordered_qty: number;
  received_qty: number;
  unit: string;
  unit_price: number;
  quality_notes: string;
}

export function GrCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createGr = useCreateGr();
  const { data: posData } = usePurchaseOrders(1, 100, undefined, undefined);

  const [poId, setPoId] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [deliveryNoteRef, setDeliveryNoteRef] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GrLineItem[]>([]);

  const receivablePos = (posData?.items || []).filter(
    (po: { status: string }) => ["APPROVED", "SENT", "ACKNOWLEDGED"].includes(po.status)
  );

  const { data: selectedPo } = usePurchaseOrder(poId);

  useEffect(() => {
    if (selectedPo && selectedPo.items) {
      setItems(
        selectedPo.items.map((item: PoItem) => ({
          po_item_id: item.id,
          description: item.description,
          ordered_qty: item.quantity,
          received_qty: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          quality_notes: "",
        }))
      );
    }
  }, [selectedPo]);

  function updateItem(idx: number, key: keyof GrLineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  }

  const total = items.reduce((sum, i) => sum + i.unit_price * i.received_qty, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createGr.mutateAsync({
      po_id: poId,
      warehouse: warehouse || undefined,
      delivery_note_ref: deliveryNoteRef || undefined,
      received_date: receivedDate,
      notes: notes || undefined,
      items: items.filter((i) => i.received_qty > 0),
    });
    navigate("/goods-receipts");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/goods-receipts")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("gr.createGr")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("gr.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("gr.purchaseOrder")} *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={poId}
                  onChange={(e) => setPoId(e.target.value)}
                  required
                >
                  <option value="">{t("gr.selectPo")}</option>
                  {receivablePos.map((po: { id: string; poNumber: string; supplier?: { name: string } }) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplier?.name || ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("gr.receivedDate")} *</Label>
                <Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("gr.warehouse")}</Label>
                <Input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} placeholder={t("gr.warehousePlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("gr.deliveryNoteRef")}</Label>
                <Input value={deliveryNoteRef} onChange={(e) => setDeliveryNoteRef(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("suppliers.notes")}</Label>
                <textarea className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("gr.lineItems")}</CardTitle>
                <span className="text-lg font-bold">{t("pr.total")}: {total.toLocaleString()} {selectedPo?.currency || "USD"}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.po_item_id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-5">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{t("pr.itemDescription")}</Label>
                    <p className="flex h-10 items-center rounded-md bg-muted/50 px-3 text-sm">{item.description}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("gr.orderedQty")}</Label>
                    <p className="flex h-10 items-center rounded-md bg-muted/50 px-3 text-sm font-mono">{item.ordered_qty}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("gr.receivedQty")} *</Label>
                    <Input
                      type="number"
                      min={0}
                      max={item.ordered_qty}
                      step="0.01"
                      value={item.received_qty}
                      onChange={(e) => updateItem(idx, "received_qty", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("pr.unitPrice")}</Label>
                    <p className="flex h-10 items-center rounded-md bg-muted/50 px-3 text-sm font-mono">{item.unit_price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={createGr.isPending || items.length === 0}>
          {createGr.isPending ? t("common.saving") : t("gr.createDraft")}
        </Button>
      </form>
    </motion.div>
  );
}
