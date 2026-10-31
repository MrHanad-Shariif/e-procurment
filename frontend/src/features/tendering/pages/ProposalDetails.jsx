import React, { useState, useEffect, useRef } from 'react';
import { AwardOrder, ManualReview } from '@/features/tendering/components/TenderControls';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService, downloadDocument } from '@/features/tendering/services/api';
import ComplianceTable from '@/features/tendering/components/ComplianceTable';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  Zap, Download, Building2, ShieldCheck, TrendingUp, Flag,
  ThumbsUp, ThumbsDown, AlertTriangle, User, Loader2,
  Phone, Globe, Hash, MapPin, Mail, BadgeCheck, BadgeAlert,
  Trash2, RefreshCw, Upload, X,
} from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/tenderrank/dialog';
import ScoreGauge from '@/features/tendering/components/ScoreGauge';
import { cn } from '@/shared/ui/tenderrank/utils';

const STATUS_CONFIG = {
  under_review: { label: 'Under Review', icon: AlertCircle, variant: 'warning' },
  approved: { label: 'Approved', icon: CheckCircle2, variant: 'success' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' },
};

/* ── AI recommendation ── */
const getRecommendation = (score, mandatoryFailed, redFlagCount) => {
  if (mandatoryFailed > 0)
    return { verdict: 'REJECT', tone: 'destructive', icon: ThumbsDown,
      text: `${mandatoryFailed} mandatory requirement${mandatoryFailed > 1 ? 's' : ''} not met. This proposal does not satisfy the minimum compliance threshold and should be disqualified.` };
  if (score >= 80 && redFlagCount === 0)
    return { verdict: 'RECOMMEND AWARD', tone: 'success', icon: ThumbsUp,
      text: `Score of ${Math.round(score)}% with no red flags. This proposal meets all requirements and is a strong candidate for award.` };
  if (score >= 50)
    return { verdict: 'REVIEW REQUIRED', tone: 'warning', icon: AlertTriangle,
      text: `Score of ${Math.round(score)}% with ${redFlagCount} red flag${redFlagCount !== 1 ? 's' : ''}. Meets most criteria but warrants manual review before a decision is made.` };
  return { verdict: 'REJECT', tone: 'destructive', icon: ThumbsDown,
    text: `Score of ${Math.round(score)}% is below the minimum threshold. Significant documentation gaps and ${redFlagCount} red flag${redFlagCount !== 1 ? 's' : ''} detected.` };
};

const TONE_CLASSES = {
  success: { bg: 'bg-success/10', border: 'border-success/25', text: 'text-success', solid: 'bg-success' },
  warning: { bg: 'bg-warning/10', border: 'border-warning/25', text: 'text-warning', solid: 'bg-warning' },
  destructive: { bg: 'bg-destructive/10', border: 'border-destructive/25', text: 'text-destructive', solid: 'bg-destructive' },
};

/* ── Supplier profile card (admin view only) ── */
const SupplierCard = ({ profile }) => {
  const fields = [
    { key: 'company_name', label: 'Company', icon: Building2 },
    { key: 'registration_number', label: 'Reg. No.', icon: Hash },
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'website', label: 'Website', icon: Globe },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'address', label: 'Address', icon: MapPin },
  ];
  const profileFields = ['company_name', 'registration_number', 'phone', 'website', 'address'];
  const filled = profileFields.filter(k => profile[k]?.trim?.()).length;
  const pct = Math.round(filled / profileFields.length * 100);
  const pctTone = pct === 100 ? 'text-success bg-success' : pct >= 60 ? 'text-warning bg-warning' : 'text-primary bg-primary';
  const [pctText, pctBar] = pctTone.split(' ');
  const initials = (profile.name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hasProfile = filled > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="rounded-xl overflow-hidden border border-primary/15 shadow-sm"
    >
      <div className="flex items-center gap-4 px-5 py-4 bg-muted/40 border-b border-border">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-base bg-primary text-primary-foreground tracking-wide">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-sm truncate">{profile.name}</p>
          <p className="text-[11px] mt-0.5 truncate text-muted-foreground">{profile.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasProfile
            ? <Badge className="bg-success/15 text-emerald-400 border-success/20"><BadgeCheck size={10} /> Profile Complete</Badge>
            : <Badge className="bg-warning/15 text-amber-400 border-warning/20"><BadgeAlert size={10} /> No Company Profile</Badge>}
          <Badge className="bg-primary/10 text-primary border-primary/25">Supplier</Badge>
        </div>
      </div>

      <div className="px-5 py-4 bg-card">
        {!hasProfile ? (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-warning/10 border border-warning/25">
            <BadgeAlert size={15} className="text-warning shrink-0" />
            <p className="text-sm text-amber-800">
              This supplier has not filled in their company profile yet. Only their username and email are available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.filter(f => f.key !== 'address' && profile[f.key]).map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                    <Icon size={12} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                      {key === 'website'
                        ? <a href={profile[key]} target="_blank" rel="noreferrer" className="hover:underline text-primary">{profile[key]}</a>
                        : profile[key]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {profile.address && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary/10">
                  <MapPin size={12} className="text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Address</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 whitespace-pre-line">{profile.address}</p>
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile Completeness</p>
                <span className={cn('text-xs font-extrabold', pctText)}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  className={cn('h-full rounded-full', pctBar)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ProposalDetails = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [tender, setTender] = useState(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceError, setReplaceError] = useState('');
  const pollRef = useRef(null);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier' };
  const isAdmin = user.role === 'admin';

  const loadProposal = async (id) => {
    const res = await apiService.getProposal(id);
    return res.data;
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const p = await loadProposal(proposalId);
        if (cancelled) return;
        setProposal(p);

        const [tRes, rRes, spRes] = await Promise.all([
          apiService.getTender(p.tender_id).catch(() => ({ data: null })),
          apiService.getRankings(p.tender_id).catch(() => ({ data: { rankings: [] } })),
          apiService.getSupplierProfile(p.supplier_id).catch(() => null),
        ]);
        if (cancelled) return;
        if (tRes?.data) setTender(tRes.data);
        const match = (rRes.data.rankings || []).find(r => r.proposal_id === p.id);
        if (match) setSupplierName(match.supplier_name);
        if (spRes?.data) setSupplierProfile(spRes.data);

        if (p.requirements?.length === 0) {
          let pollCount = 0;
          pollRef.current = setInterval(async () => {
            pollCount++;
            try {
              const [fresh, tFresh] = await Promise.all([
                loadProposal(proposalId),
                apiService.getTender(p.tender_id).catch(() => null),
              ]);
              if (cancelled) return;
              if (tFresh?.data) setTender(tFresh.data);
              setProposal(fresh);
              if (fresh.requirements?.length > 0 || pollCount >= 360) {
                clearInterval(pollRef.current);
              }
            } catch {
              clearInterval(pollRef.current);
            }
          }, 5000);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load proposal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [proposalId]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const res = await apiService.updateProposalStatus(proposal.id, newStatus);
      setProposal(res.data);
    } catch {
      setError('Failed to update status.');
    } finally { setStatusLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiService.deleteProposal(proposal.id);
      navigate('/supplier');
    } catch {
      setError('Failed to withdraw proposal.');
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  const handleReplace = async (e) => {
    e.preventDefault();
    if (!replaceFile) { setReplaceError('Please select a replacement document.'); return; }
    setReplaceError(''); setReplaceLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', replaceFile);
      const res = await apiService.replaceProposal(proposal.id, fd);
      setProposal(res.data);
      setReplaceOpen(false);
      setReplaceFile(null);
    } catch (err) {
      setReplaceError(err.response?.data?.message || 'Failed to replace document.');
    } finally {
      setReplaceLoading(false);
    }
  };

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1"><Skeleton className="h-6 w-56" /><Skeleton className="h-3 w-36" /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </motion.div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-xl text-sm font-medium bg-destructive/10 border border-destructive/20 text-destructive">
      <AlertCircle size={16} className="shrink-0" /> {error}
    </div>
  );

  const isExtracting = (proposal?.requirements?.length ?? 0) === 0;  // no requirements yet
  const isProcessing = isExtracting; // alias used by spinner below
  const isScored = (proposal?.score ?? 0) > 0;                       // scoring has run
  const score = proposal?.score || 0;
  const scoreTone = score >= 80 ? TONE_CLASSES.success : score >= 50 ? TONE_CLASSES.warning : TONE_CLASSES.destructive;
  const status = proposal?.status || 'under_review';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.under_review;
  const reqs = proposal?.requirements || [];
  const mandatory = reqs.filter(r => r.is_mandatory);
  const scoredReqs = reqs.filter(r => !r.is_mandatory);
  const mandatoryPassed = mandatory.filter(r => r.detected).length;
  const mandatoryFailed = mandatory.length - mandatoryPassed;
  const totalEarned = scoredReqs.reduce((s, r) => s + (r.points_earned ?? 0), 0);
  const totalPossible = scoredReqs.reduce((s, r) => s + (r.points_possible ?? 0), 0);
  const redFlagCount = (proposal?.red_flags || []).length;
  const rec = isScored ? getRecommendation(score, mandatoryFailed, redFlagCount) : null;
  const pdfUrl = proposal?.pdf_path
    ? `/api/v1/tendering/documents/${proposal.pdf_path}`
    : null;

  const METRICS = [
    { label: 'Compliance Score', value: isExtracting ? '—' : isScored ? `${Math.round(score)}%` : 'Pending', tone: isExtracting ? null : isScored ? scoreTone : null, icon: TrendingUp },
    { label: 'Mandatory', value: isExtracting ? '—' : `${mandatoryPassed}/${mandatory.length}`, tone: isExtracting ? null : (mandatoryFailed > 0 ? TONE_CLASSES.destructive : TONE_CLASSES.success), icon: ShieldCheck },
    { label: 'Points Scored', value: isExtracting ? '—' : isScored ? `${totalEarned}/${totalPossible}` : 'Pending', tone: isExtracting ? null : isScored ? { text: 'text-primary', bg: 'bg-primary/10' } : null, icon: Zap },
    { label: 'Red Flags', value: isExtracting ? '—' : redFlagCount, tone: isExtracting ? null : (redFlagCount > 0 ? TONE_CLASSES.destructive : TONE_CLASSES.success), icon: Flag },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-4xl space-y-5">

        {/* Header */}
        <div>
          <Link to={isAdmin ? '/dashboard' : '/supplier'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 text-muted-foreground hover:text-primary no-underline transition-colors">
            <ArrowLeft size={12} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary">
              <FileText size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">
                {isAdmin ? 'Proposal Audit Report' : 'My Proposal'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Proposal #{proposal?.id}
                {tender?.title && <> · <span className="font-semibold text-foreground/70">{tender.title}</span></>}
              </p>
            </div>
          </div>
        </div>

        <AwardOrder proposalId={proposalId} />
        <ManualReview proposalId={proposalId} />
        {/* Action bar */}
        <div className="rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap bg-card border border-border shadow-sm">

          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Status</p>
            <Badge variant={statusCfg.variant} className="px-3 py-1.5">
              <statusCfg.icon size={12} /> {statusCfg.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = status === key;
              const tone = TONE_CLASSES[cfg.variant];
              return (
                <button key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={statusLoading || isActive}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-60',
                    isActive ? cn(tone.bg, tone.text, tone.border, 'cursor-default') : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  )}>
                  {statusLoading && status !== key
                    ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                    : <Icon size={12} />}
                  {cfg.label}
                </button>
              );
            })}

            {pdfUrl && (
              <a href={pdfUrl} onClick={event => { event.preventDefault(); void downloadDocument(proposal.pdf_path); }} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 no-underline transition-colors hover:bg-primary hover:text-primary-foreground">
                <Download size={11} /> Document
              </a>
            )}

            {!isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setReplaceOpen(o => !o); setReplaceError(''); setReplaceFile(null); }}
                  className="text-sky-600 border-sky-200 bg-sky-50 hover:bg-sky-600 hover:text-white"
                >
                  <RefreshCw size={11} /> Replace Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                  className="text-destructive border-destructive/25 bg-destructive/10 hover:bg-destructive hover:text-white"
                >
                  <Trash2 size={11} /> Unsubmit
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Replace document panel */}
        <AnimatePresence>
          {!isAdmin && replaceOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }} className="overflow-hidden">
              <form onSubmit={handleReplace} className="rounded-xl p-5 space-y-4 bg-card border border-sky-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-50">
                      <RefreshCw size={13} className="text-sky-600" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Replace Proposal Document</p>
                  </div>
                  <button type="button" onClick={() => setReplaceOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploading a new document will replace your current submission and reset the compliance score.
                  Your proposal status will return to <strong>Under Review</strong>.
                </p>

                <label className={cn(
                  'flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-colors border-2 border-dashed',
                  replaceFile ? 'border-sky-300 bg-sky-50' : 'border-sky-200 bg-muted/30'
                )}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setReplaceFile(f); }}>
                  <input type="file" accept=".pdf,.docx,.doc" className="hidden"
                    onChange={e => setReplaceFile(e.target.files[0] || null)} />
                  <Upload size={22} className={replaceFile ? 'text-sky-600' : 'text-muted-foreground'} />
                  {replaceFile
                    ? <p className="text-sm font-bold text-sky-600">{replaceFile.name}</p>
                    : <p className="text-sm font-semibold text-muted-foreground">Click or drag a PDF / Word file here</p>}
                </label>

                {replaceError && (
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle size={12} /> {replaceError}
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setReplaceOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={replaceLoading || !replaceFile} className="bg-sky-600 hover:bg-sky-700">
                    {replaceLoading
                      ? <><Loader2 size={11} className="animate-spin" /> Uploading…</>
                      : <><Upload size={11} /> Submit Replacement</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirm dialog */}
        <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10">
                  <Trash2 size={16} className="text-destructive" />
                </div>
                <DialogTitle>Unsubmit Proposal?</DialogTitle>
              </div>
            </DialogHeader>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will permanently remove your proposal submission. You can resubmit a new proposal for this tender if the deadline hasn't passed.
            </p>
            <DialogFooter className="mt-5 gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(false)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Unsubmitting…</>
                  : 'Yes, Unsubmit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Supplier profile card — admin only */}
        {isAdmin && supplierProfile && (
          <SupplierCard profile={supplierProfile} />
        )}

        {/* AI Processing / Awaiting Screening banner */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4 px-5 py-4 rounded-xl overflow-hidden bg-primary/10 border border-primary/20"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary">
                {tender?.screening_status === 'in_progress'
                  ? <Loader2 size={16} className="text-primary-foreground animate-spin" />
                  : <Clock size={16} className="text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  {tender?.screening_status === 'in_progress' ? 'AI Scoring In Progress' : 'Awaiting Screening'}
                </p>
                <p className="text-xs text-primary mt-0.5">
                  {tender?.screening_status === 'in_progress'
                    ? 'The document is being analysed for compliance. Results will appear automatically — no need to refresh.'
                    : 'Your proposal has been received. Scoring begins once enough suppliers have submitted and the procurement officer starts screening.'}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, delay, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS.map(({ label, value, tone, icon: Icon }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl p-4 bg-card border border-border shadow-sm">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', tone?.bg || 'bg-muted')}>
                <Icon size={14} className={tone?.text || 'text-muted-foreground'} />
              </div>
              <p className={cn('text-xl font-extrabold', tone?.text || 'text-muted-foreground')}>
                {isProcessing && value === '—'
                  ? <Skeleton className="inline-block w-8 h-5" />
                  : value}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Info: submission details + score gauge */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 space-y-4 bg-card border border-border shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Submission Details</p>
            <div className="space-y-3">
              {tender?.title && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary/10">
                    <FileText size={12} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Tender</p>
                    <p className="text-sm font-bold text-foreground">{tender.title}</p>
                  </div>
                </div>
              )}
              {supplierName && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-success/10">
                    <User size={12} className="text-success" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Supplier</p>
                    <p className="text-sm font-bold text-foreground">{supplierName}</p>
                  </div>
                </div>
              )}
              {tender?.company_name && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-warning/10">
                    <Building2 size={12} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Organisation</p>
                    <p className="text-sm font-bold text-foreground">{tender.company_name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-muted">
                  <Clock size={12} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Submitted</p>
                  <p className="text-sm font-bold text-foreground">
                    {proposal?.submitted_at
                      ? new Date(proposal.submitted_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
              {pdfUrl && (
                <a href={pdfUrl} onClick={event => { event.preventDefault(); void downloadDocument(proposal.pdf_path); }} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg mt-1 bg-primary/10 text-primary border border-primary/20 no-underline transition-colors hover:bg-primary hover:text-primary-foreground">
                  <Download size={13} /> Download Proposal Document
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl p-5 flex flex-col items-center justify-center bg-card border border-border shadow-sm">
            {isExtracting ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-primary/10">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">Evaluation in Progress</p>
                <p className="text-xs text-muted-foreground">Your document is currently being reviewed.</p>
              </div>
            ) : !isScored ? (
              <div className="text-center space-y-3 py-6 w-full">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-warning/10">
                  <Clock size={28} className="text-warning" />
                </div>
                <p className="text-sm font-bold text-foreground">Awaiting Screening</p>
                <p className="text-xs text-muted-foreground">
                  The compliance check below is ready. Your score will appear once the procurement officer starts screening.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full mt-2 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className={cn('text-lg font-extrabold', mandatoryFailed > 0 ? 'text-destructive' : 'text-success')}>
                      {mandatoryPassed}/{mandatory.length}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Mandatory</p>
                  </div>
                  <div className="text-center">
                    <p className={cn('text-lg font-extrabold', mandatoryFailed > 0 ? 'text-destructive' : 'text-success')}>
                      {mandatoryFailed > 0 ? `${mandatoryFailed} Missing` : 'All Present'}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Status</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ScoreGauge score={score} label="Compliance Score" />
                <div className="grid grid-cols-3 gap-3 w-full mt-4 pt-4 border-t border-border">
                  {[
                    { label: 'Mandatory', val: `${mandatoryPassed}/${mandatory.length}`, tone: mandatoryFailed > 0 ? 'text-destructive' : 'text-success' },
                    { label: 'Points', val: `${totalEarned}/${totalPossible}`, tone: 'text-primary' },
                    { label: 'Flags', val: redFlagCount, tone: redFlagCount > 0 ? 'text-destructive' : 'text-success' },
                  ].map(({ label, val, tone }) => (
                    <div key={label} className="text-center">
                      <p className={cn('text-lg font-extrabold', tone)}>{val}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        {isAdmin && !isProcessing && rec && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className={cn('rounded-xl overflow-hidden border shadow-sm', TONE_CLASSES[rec.tone].border)}
          >
            <div className={cn('flex items-center gap-3 px-5 py-3.5 border-b', TONE_CLASSES[rec.tone].bg, TONE_CLASSES[rec.tone].border)}>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', TONE_CLASSES[rec.tone].solid)}>
                <rec.icon size={13} className="text-white" />
              </div>
              <p className={cn('text-xs font-extrabold uppercase tracking-widest flex-1', TONE_CLASSES[rec.tone].text)}>
                AI Recommendation
              </p>
              <span className={cn('px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide text-white', TONE_CLASSES[rec.tone].solid)}>
                {rec.verdict}
              </span>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <div className="w-5 h-5 rounded-md flex items-center justify-center bg-primary">
                  <Zap size={10} className="text-primary-foreground" fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">Powered by AI</span>
              </div>
            </div>
            <div className="px-5 py-4 bg-card">
              <p className="text-sm text-muted-foreground leading-relaxed">{rec.text}</p>
            </div>
          </motion.div>
        )}

        {/* Compliance breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary">
              <Zap size={12} className="text-primary-foreground" fill="currentColor" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Document Compliance Breakdown</h2>
            {!isProcessing && (
              <span className="text-xs font-semibold text-muted-foreground">
                · {reqs.length} requirement{reqs.length !== 1 ? 's' : ''} assessed
              </span>
            )}
          </div>
          <ComplianceTable requirements={reqs} redFlags={proposal?.red_flags || []} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProposalDetails;
