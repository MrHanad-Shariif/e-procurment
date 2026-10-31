import React, { useState, useEffect } from 'react';
import { CriteriaEditor } from '@/features/tendering/components/TenderControls';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService, downloadDocument } from '@/features/tendering/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Trophy, Clock, CheckCircle2, Users, ArrowLeft, ChevronRight,
  Download, XCircle, AlertCircle, Pencil, Trash2, Save, X, Send, AlertTriangle,
  ShieldCheck, Building2, Star, Hash, Calendar, Layers, BarChart2,
  Mail, Phone, Briefcase, RefreshCw, Loader2, Undo2,
} from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Textarea } from '@/shared/ui/tenderrank/textarea';
import { Label } from '@/shared/ui/tenderrank/label';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import RequirementsTable from '@/features/tendering/components/RequirementsTable';
import { cn } from '@/shared/ui/tenderrank/utils';

const SECTORS = [
  'Food Security & Agriculture',
  'ICT & Technology',
  'Education & Training',
  'Engineering & Infrastructure',
  'Energy & Power',
  'Office Supplies & Printing',
  'Consultancy & Research',
  'Logistics & Flight Rental',
  'Healthcare & Insurance',
  'General Procurement',
];

/* Tailwind-scale tone per sector */
const SECTOR_TONES = {
  'Food Security & Agriculture': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ICT & Technology': 'bg-primary/10 text-primary border-primary/20',
  'Education & Training': 'bg-blue-50 text-blue-700 border-blue-200',
  'Engineering & Infrastructure': 'bg-amber-50 text-amber-700 border-amber-200',
  'Energy & Power': 'bg-orange-50 text-orange-700 border-orange-200',
  'Office Supplies & Printing': 'bg-slate-50 text-slate-700 border-slate-200',
  'Consultancy & Research': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Logistics & Flight Rental': 'bg-sky-50 text-sky-700 border-sky-200',
  'Healthcare & Insurance': 'bg-rose-50 text-rose-700 border-rose-200',
  'General Procurement': 'bg-muted text-muted-foreground border-border',
};
const DEFAULT_SECTOR_TONE = SECTOR_TONES['General Procurement'];

const APPROVAL_VARIANT = { approved: 'success', pending: 'warning', rejected: 'destructive', draft: 'secondary' };
const APPROVAL_LABEL = { approved: '● Published', pending: '● Pending Review', rejected: '● Rejected', draft: '● Draft' };

const TenderDetailSkeleton = () => (
  <div className="space-y-5 max-w-5xl">
    <Skeleton className="h-3 w-28" />
    <div className="rounded-xl p-8 space-y-4 bg-muted/30 border border-border">
      <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-4 w-96" />
      <div className="flex gap-4 pt-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-28" /></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 rounded-xl p-6 space-y-3 bg-card border border-border">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
      <div className="rounded-xl p-6 space-y-3 bg-card border border-border">
        <Skeleton className="h-5 w-32 mb-2" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    </div>
  </div>
);

const TenderDetails = () => {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [myProposal, setMyProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', deadline: '', sector: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [unpublishLoading, setUnpublishLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approvalMsg, setApprovalMsg] = useState('');

  const [reqOpen, setReqOpen] = useState(true);
  const [rescoreLoading, setRescoreLoading] = useState(false);
  const [rescoreMsg, setRescoreMsg] = useState('');

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier' };
  const role = user.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isClosed = tender?.deadline && new Date() > new Date(tender.deadline);
  const approvalStatus = tender?.approval_status || 'approved';
  const canSubmitForApproval = isAdmin && (approvalStatus === 'draft' || approvalStatus === 'rejected');
  const screeningStatus = tender?.screening_status || 'not_started';
  const isScreened = screeningStatus === 'completed';
  const MIN_PROPOSALS = 3;

  const handleApprove = async () => {
    setApproveLoading(true); setApprovalMsg('');
    try {
      await apiService.approveTender(tenderId);
      setTender(t => ({ ...t, approval_status: 'approved' }));
      setApprovalMsg('approved');
    } catch (err) {
      setApprovalMsg('error:' + (err?.response?.data?.message || 'Failed to approve.'));
    } finally { setApproveLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejectLoading(true); setApprovalMsg('');
    try {
      await apiService.rejectTender(tenderId, rejectReason);
      setTender(t => ({ ...t, approval_status: 'rejected', rejection_reason: rejectReason }));
      setApprovalMsg('rejected');
      setShowRejectForm(false);
    } catch (err) {
      setApprovalMsg('error:' + (err?.response?.data?.message || 'Failed to reject.'));
    } finally { setRejectLoading(false); }
  };

  const handleUnpublish = async () => {
    setUnpublishLoading(true); setApprovalMsg('');
    try {
      await apiService.unpublishTender(tenderId);
      setTender(t => ({ ...t, approval_status: 'pending' }));
      setApprovalMsg('unpublished');
    } catch (err) {
      setApprovalMsg('error:' + (err?.response?.data?.message || 'Failed to unpublish.'));
    } finally { setUnpublishLoading(false); }
  };

  const handleRescore = async () => {
    setRescoreLoading(true); setRescoreMsg('');
    try {
      const res = await apiService.rescoreProposals(tenderId);
      setRescoreMsg(res.data.message || 'Re-scoring started.');
    } catch (err) {
      setRescoreMsg(err?.response?.data?.message || 'Failed to start re-scoring.');
    } finally { setRescoreLoading(false); }
  };

  const handleSubmitForApproval = async () => {
    setSubmitLoading(true); setSubmitMsg('');
    try {
      await apiService.submitTenderForApproval(tenderId);
      setTender(t => ({ ...t, approval_status: 'pending' }));
      setSubmitMsg('Submitted! The Super Admin will review it shortly.');
    } catch (err) {
      setSubmitMsg(err?.response?.data?.message || 'Failed to submit.');
    } finally { setSubmitLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenderRes = await apiService.getTender(tenderId);
        setTender(tenderRes.data);
        if (isAdmin || isSuperAdmin) {
          const rankRes = await apiService.getRankings(tenderId);
          setRankings(rankRes.data.rankings || []);
        }
        if (!isAdmin && !isSuperAdmin) {
          const pRes = await apiService.getProposals();
          const found = pRes.data.find(p => p.tender_id === String(tenderId));
          setHasSubmitted(!!found);
          setMyProposal(found || null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tender details.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [tenderId]);

  const startEdit = () => {
    setEditForm({
      title: tender.title,
      description: tender.description || '',
      deadline: tender.deadline ? tender.deadline.slice(0, 10) : '',
      sector: tender.sector || '',
    });
    setEditError('');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) { setEditError('Title is required.'); return; }
    setEditLoading(true); setEditError('');
    try {
      const res = await apiService.updateTender(tenderId, {
        title: editForm.title.trim(),
        description: editForm.description,
        deadline: editForm.deadline || null,
        sector: editForm.sector || null,
      });
      setTender(res.data);
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.');
    } finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiService.deleteTender(tenderId);
      navigate('/tenders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tender.');
      setConfirmDelete(false);
      setDeleteLoading(false);
    }
  };

  if (loading) return <TenderDetailSkeleton />;

  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-xl text-sm font-medium bg-destructive/10 border border-destructive/20 text-destructive">
      <AlertCircle size={16} className="shrink-0" /> {error}
    </div>
  );

  const sectorTone = SECTOR_TONES[tender?.sector] || DEFAULT_SECTOR_TONE;
  const requirements = tender?.requirements || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-5xl"
    >
      {/* ── Back nav ── */}
      <Link
        to={isSuperAdmin ? '/super-admin/tenders' : isAdmin ? '/tenders' : '/supplier/tenders'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary no-underline transition-colors">
        <ArrowLeft size={12} /> Back to Tenders
      </Link>

      {/* ── Hero card ── */}
      <div className="rounded-xl overflow-hidden bg-card border border-primary/15 shadow-md">

        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--primary), #38bdf8)' }} />

        <div className="px-7 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {tender?.sector && (
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border', sectorTone)}>
                  <Layers size={10} /> {tender.sector}
                </span>
              )}
              <Badge variant={isClosed ? 'destructive' : 'success'} className="px-3 py-1 rounded-full">
                {isClosed ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                {isClosed ? 'Closed' : 'Active'}
              </Badge>
              {(isAdmin || isSuperAdmin) && (
                <Badge variant={APPROVAL_VARIANT[approvalStatus] || 'secondary'} className="px-3 py-1 rounded-full">
                  {APPROVAL_LABEL[approvalStatus] || '● Draft'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && !editing && (
                <>
                  <Button variant="secondary" size="sm" onClick={startEdit}>
                    <Pencil size={11} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive border-destructive/25 bg-destructive/10 hover:bg-destructive hover:text-white"
                  >
                    <Trash2 size={11} /> Delete
                  </Button>
                </>
              )}
              {tender?.pdf_path && (
                <a href={`/api/v1/tendering/documents/${tender.pdf_path}`}
                  onClick={event => { event.preventDefault(); void downloadDocument(tender.pdf_path); }}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 no-underline transition-colors hover:bg-primary hover:text-primary-foreground">
                  <Download size={11} /> Download PDF
                </a>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-foreground leading-snug tracking-tight">
                {tender?.title}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 max-w-[560px]">
                {tender?.description || 'No description provided.'}
              </p>
            </div>

            <div className="shrink-0">
              {!isAdmin && !isSuperAdmin && (
                hasSubmitted ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-warning/10 text-warning border border-warning/25">
                      <AlertCircle size={14} /> Already Submitted
                    </div>
                    {myProposal && (
                      <Button size="sm" asChild>
                        <Link to={`/supplier/proposal/${myProposal.id}`} className="no-underline">
                          <FileText size={12} /> View / Edit Proposal
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : isClosed ? (
                  <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-muted text-muted-foreground border border-border">
                    <XCircle size={14} /> Submissions Closed
                  </div>
                ) : (
                  <Button size="lg" asChild>
                    <Link to={`/submit/${tenderId}`} className="no-underline">
                      <FileText size={14} /> Submit Proposal
                    </Link>
                  </Button>
                )
              )}
              {(isAdmin || isSuperAdmin) && rankings.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-center px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-xl font-black text-primary leading-none">{rankings.length}</p>
                    <p className="text-[9px] font-bold text-primary/70 mt-1 uppercase tracking-wider">Proposals</p>
                  </div>
                  {isScreened ? (
                    <div className="text-center px-4 py-2.5 rounded-xl bg-success/10 border border-success/25">
                      <p className="text-xl font-black text-success leading-none">
                        {Math.max(...rankings.map(r => r.score ?? 0)).toFixed(0)}%
                      </p>
                      <p className="text-[9px] font-bold text-success/70 mt-1 uppercase tracking-wider">Top Score</p>
                    </div>
                  ) : (
                    <div className="text-center px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/25">
                      <p className="text-xl font-black text-warning leading-none">—</p>
                      <p className="text-[9px] font-bold text-warning/70 mt-1 uppercase tracking-wider">Not Screened</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 flex-wrap mt-5 pt-4 border-t border-border">
            {tender?.deadline && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar size={12} className="text-primary" />
                Deadline: <span className="font-semibold text-foreground">
                  {new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock size={12} className="text-primary" />
              Created: <span className="font-semibold text-foreground">
                {new Date(tender?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Hash size={12} className="text-primary" />
              <span className="font-semibold text-foreground">{requirements.length}</span> requirements
            </span>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {confirmDelete && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-destructive shrink-0" />
            <p className="text-sm font-semibold text-destructive">
              Delete <span className="font-extrabold">"{tender?.title}"</span>? All proposals will also be removed. This cannot be undone.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
            </Button>
          </div>
        </motion.div>
      )}

      {approvalStatus === 'rejected' && tender?.rejection_reason && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle size={15} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Tender Rejected</p>
            <p className="text-sm text-destructive/80 mt-0.5">{tender.rejection_reason}</p>
            {canSubmitForApproval && <p className="text-xs text-destructive/60 mt-1">Fix the issues above, then resubmit for approval.</p>}
          </div>
        </div>
      )}

      {canSubmitForApproval && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-warning/10 border border-warning/25">
          <div>
            <p className="text-sm font-bold text-warning">
              {approvalStatus === 'draft' ? 'This tender is a draft.' : 'This tender was rejected and needs revision.'}
            </p>
            <p className="text-xs text-warning/70 mt-0.5">Submit it for Super Admin review to publish it publicly.</p>
          </div>
          {submitMsg ? (
            <p className="text-xs font-semibold text-warning shrink-0">{submitMsg}</p>
          ) : (
            <Button
              onClick={handleSubmitForApproval}
              disabled={submitLoading}
              className="shrink-0 bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Send size={13} /> {submitLoading ? 'Submitting…' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      )}

      {approvalStatus === 'pending' && isAdmin && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/25">
          <Clock size={15} className="text-warning shrink-0" />
          <p className="text-sm font-semibold text-warning">Awaiting Super Admin approval before this tender is published.</p>
        </div>
      )}

      {/* ── Edit form ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl overflow-hidden border border-primary/20 shadow-md">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b border-border">
              <div className="flex items-center gap-2">
                <Pencil size={14} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Edit Tender</span>
              </div>
              <button onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-5 bg-card">
              {editError && (
                <p className="text-xs font-semibold px-3 py-2 rounded-lg bg-destructive/10 text-destructive">{editError}</p>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sector</Label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(s => {
                    const active = editForm.sector === s;
                    return (
                      <button key={s} type="button"
                        onClick={() => setEditForm(fm => ({ ...fm, sector: s }))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                          active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                        )}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Title</Label>
                <Input type="text" value={editForm.title} onChange={e => setEditForm(fm => ({ ...fm, title: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</Label>
                <Textarea rows={3} value={editForm.description} onChange={e => setEditForm(fm => ({ ...fm, description: e.target.value }))} className="resize-none" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Deadline (optional)</Label>
                <Input type="date" value={editForm.deadline} onChange={e => setEditForm(fm => ({ ...fm, deadline: e.target.value }))} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button onClick={saveEdit} disabled={editLoading}>
                  <Save size={13} /> {editLoading ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  <X size={13} /> Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <CriteriaEditor tender={tender} onUpdated={setTender} />
        {/* Requirements panel — Admin/SuperAdmin only */}
        {(isAdmin || isSuperAdmin) && <div className="lg:col-span-2 rounded-xl overflow-hidden bg-card border border-border shadow-sm">
          <div className={cn('px-6 py-4 flex items-center justify-between gap-2', reqOpen && 'border-b border-border')}>
            <button
              onClick={() => setReqOpen(o => !o)}
              className="flex items-center gap-2 flex-1 text-left transition-opacity hover:opacity-80">
              <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10">
                  <CheckCircle2 size={13} className="text-primary" />
                </div>
                Extracted Requirements
                <Badge className="ml-1">{requirements.length}</Badge>
              </h2>
              <ChevronRight size={15} className={cn('text-muted-foreground shrink-0 transition-transform duration-200', reqOpen && 'rotate-90')} />
            </button>
            {isAdmin && isScreened && (
              <div className="flex items-center gap-2 shrink-0">
                {rescoreMsg && (
                  <span className={cn('text-[10px] font-semibold', rescoreMsg.includes('Failed') ? 'text-destructive' : 'text-success')}>
                    {rescoreMsg}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRescore}
                  disabled={rescoreLoading}
                  className="text-[10px] text-success border-success/25 bg-success/10 hover:bg-success hover:text-white h-auto py-1.5"
                >
                  {rescoreLoading
                    ? <><span className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-current" /> Scoring…</>
                    : <><RefreshCw size={10} /> Re-score Proposals</>}
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {reqOpen && (
              <motion.div
                key="req-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden">

                {requirements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileText size={28} className="text-muted-foreground/30" />
                    {tender?.pdf_path ? (
                      <>
                        <p className="text-sm text-muted-foreground font-medium">Review the document and add evaluation requirements above.</p>
                        <p className="text-xs text-muted-foreground/60">The AI is processing the uploaded document. Refresh in a moment.</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground font-medium">No requirements yet — upload a PDF when creating the tender</p>
                    )}
                  </div>
                ) : (
                  <div className="p-5">
                    <RequirementsTable requirements={requirements} />
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>}

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Submitted Suppliers — Admin only */}
          {isAdmin && (
            <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-sky-50">
                    <Users size={12} className="text-sky-600" />
                  </div>
                  Submissions
                  <Badge className="bg-sky-50 text-sky-600 border-transparent">{rankings.length}</Badge>
                </h2>
                <Link to={`/rankings/${tenderId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 no-underline transition-colors">
                  <Trophy size={11} /> Leaderboard <ChevronRight size={11} />
                </Link>
              </div>

              {rankings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Users size={22} className="text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-medium text-center">No proposals yet</p>
                </div>
              ) : !isScreened ? (
                <div className="divide-y divide-border">
                  <div className="px-5 py-3 bg-warning/5">
                    <p className="text-[11px] font-semibold text-warning">
                      {rankings.length < MIN_PROPOSALS
                        ? `Needs ${MIN_PROPOSALS - rankings.length} more supplier${MIN_PROPOSALS - rankings.length === 1 ? '' : 's'} before screening can start.`
                        : screeningStatus === 'in_progress'
                          ? 'Screening in progress…'
                          : 'Ready to screen — scores are hidden until screening starts.'}
                    </p>
                  </div>
                  {rankings.slice(0, 5).map((row) => (
                    <div key={row.proposal_id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50">
                      <span className="text-sm font-semibold text-foreground flex-1 truncate">{row.supplier_name}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-200">
                        Submitted
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {rankings.slice(0, 5).map((row) => {
                    const score = row.score;
                    const scoreTone = score >= 80 ? 'text-success bg-success/10' : score >= 50 ? 'text-warning bg-warning/10' : 'text-destructive bg-destructive/10';
                    return (
                      <div key={row.proposal_id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50">
                        <span className={cn('text-xs font-black w-5 text-center shrink-0', row.rank <= 3 ? 'text-primary' : 'text-muted-foreground/50')}>
                          {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
                        </span>
                        <span className="text-sm font-semibold text-foreground flex-1 truncate">{row.supplier_name}</span>
                        <span className={cn('font-bold text-xs px-2.5 py-1 rounded-lg shrink-0', scoreTone)}>
                          {row.score.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                  {rankings.length > 5 && (
                    <div className="px-5 py-3">
                      <Link to={`/rankings/${tenderId}`}
                        className="text-xs font-semibold text-muted-foreground hover:text-primary no-underline transition-colors">
                        +{rankings.length - 5} more → Full Leaderboard
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick info card */}
          <div className="rounded-xl p-5 space-y-3 bg-card border border-border shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</p>
            <div className="space-y-2.5">
              {tender?.sector && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Sector</span>
                  <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg', sectorTone.split(' ').slice(0, 2).join(' '))}>
                    {tender.sector}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Status</span>
                <span className={cn('text-xs font-bold', isClosed ? 'text-destructive' : 'text-success')}>
                  {isClosed ? 'Closed' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Requirements</span>
                <span className="text-xs font-bold text-foreground">{requirements.length} documents</span>
              </div>
              {tender?.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Deadline</span>
                  <span className="text-xs font-bold text-foreground">
                    {new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Created</span>
                <span className="text-xs font-bold text-foreground">
                  {new Date(tender?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Procurement Officer card — super admin only */}
          {isSuperAdmin && tender?.created_by && (
            <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-sky-50">
                    <Briefcase size={12} className="text-sky-600" />
                  </div>
                  Procurement Officer
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shrink-0 bg-sky-600">
                    {tender.created_by.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{tender.created_by.name}</p>
                    <Badge className="bg-sky-50 text-sky-600 border-transparent">Admin</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                      <Mail size={11} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tender.created_by.email}</p>
                  </div>
                  {tender.created_by.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                        <Phone size={11} className="text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">{tender.created_by.phone}</p>
                    </div>
                  )}
                  {tender.created_by.company_name && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                        <Building2 size={11} className="text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tender.created_by.company_name}</p>
                    </div>
                  )}
                  {tender.created_by.registration_number && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                        <Hash size={11} className="text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Reg: {tender.created_by.registration_number}</p>
                    </div>
                  )}
                </div>

                {!tender.created_by.phone && !tender.created_by.company_name && !tender.created_by.registration_number && (
                  <p className="text-[11px] text-muted-foreground italic">No company profile added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Super Admin control panel */}
          {isSuperAdmin && (
            <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10">
                    <ShieldCheck size={13} className="text-primary" />
                  </div>
                  Tender Control
                </h2>
                <Badge variant={APPROVAL_VARIANT[approvalStatus] || 'secondary'}>
                  {APPROVAL_LABEL[approvalStatus] || '● Draft'}
                </Badge>
              </div>
              <div className="px-5 py-4 space-y-3">
                {approvalMsg === 'approved' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/25">
                    <CheckCircle2 size={13} className="text-success shrink-0" />
                    <p className="text-xs font-semibold text-success">Approved and published.</p>
                  </div>
                )}
                {approvalMsg === 'rejected' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <XCircle size={13} className="text-destructive shrink-0" />
                    <p className="text-xs font-semibold text-destructive">Tender rejected.</p>
                  </div>
                )}
                {approvalMsg === 'unpublished' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/25">
                    <Undo2 size={13} className="text-warning shrink-0" />
                    <p className="text-xs font-semibold text-warning">Tender sent back to approval queue.</p>
                  </div>
                )}
                {approvalMsg.startsWith('error:') && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle size={13} className="text-destructive shrink-0" />
                    <p className="text-xs font-semibold text-destructive">{approvalMsg.replace('error:', '')}</p>
                  </div>
                )}
                {!approvalMsg && (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {approvalStatus === 'pending' ? 'Awaiting your review. Approve to publish or reject with a reason.'
                        : approvalStatus === 'approved' ? 'Live and visible to suppliers. Unpublish to send it back to the queue for review.'
                        : approvalStatus === 'rejected' ? 'Rejected. Approve if issues have been resolved.'
                        : 'Draft — waiting for admin to submit for review.'}
                    </p>
                    <div className="flex flex-col gap-2">
                      {(approvalStatus === 'pending' || approvalStatus === 'rejected') && (
                        <Button
                          onClick={handleApprove}
                          disabled={approveLoading || rejectLoading || unpublishLoading}
                          className="w-full bg-success text-success-foreground hover:bg-success/90"
                        >
                          {approveLoading ? <><Loader2 size={13} className="animate-spin" /> Approving…</> : <><CheckCircle2 size={13} /> Approve &amp; Publish</>}
                        </Button>
                      )}
                      {approvalStatus === 'pending' && (
                        <Button
                          variant={showRejectForm ? 'destructive' : 'outline'}
                          onClick={() => setShowRejectForm(v => !v)}
                          disabled={approveLoading || rejectLoading}
                          className={cn('w-full', !showRejectForm && 'text-destructive border-destructive/25 hover:bg-destructive/10 hover:text-destructive')}
                        >
                          <XCircle size={13} />
                          {showRejectForm ? 'Cancel' : 'Reject'}
                        </Button>
                      )}
                      {approvalStatus === 'approved' && (
                        <Button
                          variant="outline"
                          onClick={handleUnpublish}
                          disabled={unpublishLoading}
                          className="w-full text-warning border-warning/25 hover:bg-warning/10 hover:text-warning"
                        >
                          {unpublishLoading ? <><Loader2 size={13} className="animate-spin" /> Unpublishing…</> : <><Undo2 size={13} /> Unpublish</>}
                        </Button>
                      )}
                    </div>
                    <AnimatePresence>
                      {showRejectForm && approvalStatus === 'pending' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="space-y-2 pt-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                              Rejection Reason *
                            </Label>
                            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                              placeholder="Explain why so the admin can revise…" className="resize-none text-xs" />
                            <Button
                              variant="destructive"
                              onClick={handleReject}
                              disabled={rejectLoading || !rejectReason.trim()}
                              className="w-full"
                            >
                              {rejectLoading ? <><Loader2 size={13} className="animate-spin" /> Rejecting…</> : <><XCircle size={13} /> Confirm Rejection</>}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TenderDetails;
