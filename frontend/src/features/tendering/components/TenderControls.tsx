import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/identity/hooks/useAuth';
import api from '@/shared/lib/api';

interface Criterion { requirement_name: string; points: number; is_mandatory: boolean }
interface TenderData { id: string; approval_status: string; requirements: Criterion[] }

export function CriteriaEditor({ tender, onUpdated }: { tender: TenderData; onUpdated: (value: TenderData) => void }) {
  const { hasPermission } = useAuth();
  const [criteria, setCriteria] = useState<Criterion[]>(tender.requirements);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!hasPermission('tender.edit') || !['draft', 'rejected'].includes(tender.approval_status)) return null;
  async function save() {
    setSaving(true); setError('');
    try {
      const response = await api.patch(`/v1/tendering/tenders/${tender.id}`, { requirements: criteria });
      onUpdated(response.data.data);
    } catch { setError('Could not save requirements. Review the entries and try again.'); }
    finally { setSaving(false); }
  }
  return <section className="space-y-4 rounded-xl border bg-card p-6">
    <div><h2 className="font-semibold">Evaluation requirements</h2><p className="mt-1 text-xs text-muted-foreground">Review the criteria and weights before submitting this tender for approval.</p></div>
    {criteria.map((criterion, index) => <div key={index} className="flex flex-wrap gap-3">
      <input aria-label={`Criterion ${index + 1}`} className="min-w-48 flex-1 rounded-md border bg-background px-3 py-2 text-sm" value={criterion.requirement_name} onChange={e => setCriteria(criteria.map((item, i) => i === index ? { ...item, requirement_name: e.target.value } : item))} />
      <input aria-label={`Points ${index + 1}`} type="number" min="0" className="w-24 rounded-md border bg-background px-3 py-2 text-sm" value={criterion.points} onChange={e => setCriteria(criteria.map((item, i) => i === index ? { ...item, points: Number(e.target.value) } : item))} />
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={criterion.is_mandatory} onChange={e => setCriteria(criteria.map((item, i) => i === index ? { ...item, is_mandatory: e.target.checked } : item))} />Mandatory</label>
      <button className="text-xs text-destructive" onClick={() => setCriteria(criteria.filter((_, i) => i !== index))}>Remove</button>
    </div>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-3"><button className="rounded-md border px-3 py-2 text-xs" onClick={() => setCriteria([...criteria, { requirement_name: '', points: 10, is_mandatory: false }])}>Add criterion</button>
      <button className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50" disabled={saving || criteria.some(item => !item.requirement_name.trim())} onClick={() => void save()}>Save requirements</button></div>
  </section>;
}

export function AwardOrder({ proposalId }: { proposalId: string }) {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  if (!hasPermission('tender.award')) return null;
  async function create() {
    setError('');
    try {
      const response = await api.post(`/v1/tendering/proposals/${proposalId}/award`, { reason, items: [{ description, quantity: Number(quantity), unit_price: Number(price), unit: 'PCS' }] });
      navigate(`/purchase-orders/${response.data.data.purchaseOrderId}`);
    } catch (failure: unknown) {
      const error = failure as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Could not create the purchase order.');
    }
  }
  return <section className="space-y-3 rounded-xl border bg-card p-6">
    <h2 className="font-semibold">Award and create purchase order</h2>
    <p className="text-xs text-muted-foreground">Creates a linked order draft. Normal purchase-order approval is still required.</p>
    <input aria-label="Order description" placeholder="Order description" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border bg-background p-2 text-sm" />
    <div className="flex gap-3"><input aria-label="Order quantity" type="number" min="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-32 rounded-md border bg-background p-2 text-sm" /><input aria-label="Unit price in USD" type="number" min="0.01" placeholder="Unit price (USD)" value={price} onChange={e => setPrice(e.target.value)} className="w-48 rounded-md border bg-background p-2 text-sm" /></div>
    <textarea aria-label="Award reason" placeholder="Award decision and justification" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border bg-background p-2 text-sm" />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button disabled={!description || Number(quantity) <= 0 || Number(price) <= 0 || !reason} onClick={() => void create()} className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50">Create linked order</button>
  </section>;
}

export function ManualReview({ proposalId }: { proposalId: string }) {
  const { hasPermission } = useAuth();
  const [criteria, setCriteria] = useState<Array<Criterion & { id: string; pointsAwarded: number; evidence: string; met: boolean }>>([]);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!hasPermission('tender.evaluate')) return;
    void api.get(`/v1/tendering/proposals/${proposalId}`).then(response => api.get(`/v1/tendering/tenders/${response.data.data.tender_id}`))
      .then(response => setCriteria(response.data.data.requirements.map((item: Criterion & { id: string }) => ({ ...item, pointsAwarded: 0, evidence: '', met: false }))))
      .catch(() => setMessage('Could not load evaluation criteria.'));
  }, [proposalId, hasPermission]);
  if (!hasPermission('tender.evaluate')) return null;
  async function save() {
    setSaving(true); setMessage('');
    try {
      await api.post(`/v1/tendering/proposals/${proposalId}/review`, { reason, results: criteria.map(item => ({ criterionId: item.id, points: item.pointsAwarded, met: item.met, evidence: item.evidence })) });
      window.location.reload();
    } catch { setMessage('Could not save the review. Check the evidence and points.'); }
    finally { setSaving(false); }
  }
  return <section className="space-y-4 rounded-xl border bg-card p-6">
    <h2 className="font-semibold">Evaluator review</h2>
    <p className="text-xs text-muted-foreground">Record verified evidence and points for each criterion. The system calculates the total.</p>
    {criteria.map((criterion, index) => <div key={criterion.id} className="space-y-2 border-b pb-4">
      <p className="text-sm font-medium">{criterion.requirement_name} {criterion.is_mandatory && <span className="text-destructive">(mandatory)</span>}</p>
      <textarea aria-label={`Evidence ${index + 1}`} value={criterion.evidence} placeholder="Document, page, and supporting evidence" className="w-full rounded-md border bg-background p-2 text-sm" onChange={e => setCriteria(criteria.map((item, i) => i === index ? { ...item, evidence: e.target.value } : item))} />
      <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs">Points<input aria-label={`Awarded points ${index + 1}`} type="number" min="0" max={criterion.points} value={criterion.pointsAwarded} className="w-20 rounded-md border bg-background p-2" onChange={e => setCriteria(criteria.map((item, i) => i === index ? { ...item, pointsAwarded: Number(e.target.value) } : item))} /> / {criterion.points}</label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={criterion.met} onChange={e => setCriteria(criteria.map((item, i) => i === index ? { ...item, met: e.target.checked } : item))} />Requirement met</label></div>
    </div>)}
    <textarea aria-label="Review justification" placeholder="Review justification" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border bg-background p-2 text-sm" />
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <button disabled={saving || !criteria.length || !reason || criteria.some(item => !item.evidence)} onClick={() => void save()} className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50">Save evaluation</button>
  </section>;
}
