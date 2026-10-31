import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCreateInvoice } from "@/features/procurement/invoices/hooks/useInvoices";
import { usePurchaseOrders, usePurchaseOrder } from "@/features/procurement/purchase-orders/hooks/usePurchaseOrders";
import { useGoodsReceipts } from "@/features/procurement/goods-receipts/hooks/useGoodsReceipts";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { PoItem, GoodsReceipt } from "@/shared/types/procurement";

interface InvoiceLineItem {
  po_item_id: string;
  gr_item_id: string;
  description: string;
  invoiced_qty: number;
  unit_price: number;
}

export function InvoiceCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();
  const { data: posData } = usePurchaseOrders(1, 100, undefined, undefined);

  const [poId, setPoId] = useState("");
  const [grId, setGrId] = useState("");
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([]);

  const allPos = posData?.items || [];
  const { data: selectedPo } = usePurchaseOrder(poId);
  const { data: grsData } = useGoodsReceipts(1, 100, undefined, "ACCEPTED");
  const relatedGrs: GoodsReceipt[] = (grsData?.items || []).filter((g: GoodsReceipt) => g.poId === poId);

  useEffect(() => {
    if (selectedPo && selectedPo.items) {
      setItems(
        selectedPo.items.map((item: PoItem) => ({
          po_item_id: item.id,
          gr_item_id: "",
          description: item.description,
          invoiced_qty: item.quantity,
          unit_price: item.unitPrice,
        }))
      );
    }
  }, [selectedPo]);

  function updateItem(idx: number, key: keyof InvoiceLineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  }

  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.invoiced_qty, 0);
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createInvoice.mutateAsync({
      po_id: poId,
      gr_id: grId || undefined,
      supplier_invoice_ref: supplierInvoiceRef || undefined,
      due_date: dueDate || undefined,
      payment_terms: paymentTerms || undefined,
      tax_amount: taxAmount,
      notes: notes || undefined,
      items: items.filter((i) => i.invoiced_qty > 0),
    });
    navigate("/invoices");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/invoices")}>
        <ArrowLeft className="me-2 h-4 w-4" /> {t("common.back")}
      </Button>

      <h1 className="text-2xl font-bold">{t("invoice.createInvoice")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("invoice.details")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("invoice.purchaseOrder")} *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={poId}
                  onChange={(e) => { setPoId(e.target.value); setGrId(""); }}
                  required
                >
                  <option value="">{t("gr.selectPo")}</option>
                  {allPos.map((po: { id: string; poNumber: string; supplier?: { name: string } }) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplier?.name || ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("invoice.goodsReceipt")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={grId}
                  onChange={(e) => setGrId(e.target.value)}
                >
                  <option value="">{t("invoice.selectGr")}</option>
                  {relatedGrs.map((gr) => (
                    <option key={gr.id} value={gr.id}>{gr.grNumber}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("invoice.supplierRef")}</Label>
                <Input value={supplierInvoiceRef} onChange={(e) => setSupplierInvoiceRef(e.target.value)} placeholder="SUP-INV-001" />
              </div>
              <div className="space-y-2">
                <Label>{t("invoice.dueDate")}</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("po.paymentTerms")}</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 30" />
              </div>
              <div className="space-y-2">
                <Label>{t("invoice.tax")}</Label>
                <Input type="number" min={0} step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value))} />
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
                <CardTitle>{t("invoice.lineItems")}</CardTitle>
                <div className="text-end">
                  <div className="text-sm text-muted-foreground">{t("invoice.subtotal")}: {subtotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{t("invoice.tax")}: {taxAmount.toLocaleString()}</div>
                  <div className="text-lg font-bold">{t("pr.total")}: {total.toLocaleString()} {selectedPo?.currency || "USD"}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.po_item_id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-4">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{t("pr.itemDescription")}</Label>
                    <p className="flex h-10 items-center rounded-md bg-muted/50 px-3 text-sm">{item.description}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("invoice.invoicedQty")} *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.invoiced_qty}
                      onChange={(e) => updateItem(idx, "invoiced_qty", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("pr.unitPrice")} *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={createInvoice.isPending || items.length === 0}>
          {createInvoice.isPending ? t("common.saving") : t("invoice.createDraft")}
        </Button>
      </form>
    </motion.div>
  );
}
