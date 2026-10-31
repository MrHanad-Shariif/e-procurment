import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/features/tendering/services/api';
import {
  FileText, Plus, Search, Clock, Trophy, ChevronRight,
  AlertCircle, Send, CheckCircle2, XCircle, X, Layers,
  LayoutGrid,
} from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';

const TendersSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-xl p-5 flex items-center gap-4 bg-card border border-border">
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-40" /></div>
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    ))}
  </div>
);

const APPROVAL_VARIANT = { approved: 'success', pending: 'warning', rejected: 'destructive', draft: 'secondary' };
const APPROVAL_LABEL = { approved: 'Published', pending: 'Pending Review', rejected: 'Rejected', draft: 'Draft' };
const ApprovalBadge = ({ status }) => (
  <Badge variant={APPROVAL_VARIANT[status] || 'secondary'}>{APPROVAL_LABEL[status] || 'Draft'}</Badge>
);

/* Tailwind-scale tone per sector */
const SECTOR_TONES = {
  'Food Security & Agriculture': 'bg-emerald-50 text-emerald-600',
  'ICT & Technology': 'bg-primary/10 text-primary',
  'Education & Training': 'bg-blue-50 text-blue-600',
  'Engineering & Infrastructure': 'bg-amber-50 text-amber-600',
  'Energy & Power': 'bg-orange-50 text-orange-600',
  'Office Supplies & Printing': 'bg-slate-50 text-slate-600',
  'Consultancy & Research': 'bg-indigo-50 text-indigo-600',
  'Logistics & Flight Rental': 'bg-sky-50 text-sky-600',
  'Healthcare & Insurance': 'bg-rose-50 text-rose-600',
  'General Procurement': 'bg-muted text-muted-foreground',
};

const STATUS_DOT = { approved: 'bg-success', pending: 'bg-warning', rejected: 'bg-destructive', draft: 'bg-muted-foreground' };

const FILTERS = ['All', 'Published', 'Pending', 'Draft', 'Rejected'];
const FILTER_MAP = { All: null, Published: 'approved', Pending: 'pending', Draft: 'draft', Rejected: 'rejected' };

const TendersList = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [submitMsg, setSubmitMsg] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [approveLoading, setApproveLoading] = useState({});
  const [rejectLoading, setRejectLoading] = useState({});
  const [rejectOpen, setRejectOpen] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier' };
  const role = user.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    apiService.getTenders()
      .then(res => setTenders(res.data || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load tenders.'))
      .finally(() => setLoading(false));
  }, []);

  const tenderPath = (id) => {
    if (isSuperAdmin) return `/super-admin/tenders/${id}`;
    if (isAdmin) return `/tenders/${id}`;
    return `/supplier/tenders/${id}`;
  };

  const handleApprove = async (tenderId) => {
    setApproveLoading(l => ({ ...l, [tenderId]: true }));
    try {
      await apiService.approveTender(tenderId);
      setTenders(ts => ts.map(t => t.id === tenderId ? { ...t, approval_status: 'approved' } : t));
    } catch { /* retry via detail page */ }
    finally { setApproveLoading(l => ({ ...l, [tenderId]: false })); }
  };

  const handleReject = async (tenderId) => {
    const reason = rejectReason[tenderId] || '';
    if (!reason.trim()) return;
    setRejectLoading(l => ({ ...l, [tenderId]: true }));
    try {
      await apiService.rejectTender(tenderId, reason);
      setTenders(ts => ts.map(t => t.id === tenderId ? { ...t, approval_status: 'rejected', rejection_reason: reason } : t));
      setRejectOpen(o => ({ ...o, [tenderId]: false }));
    } catch { /* silently fail */ }
    finally { setRejectLoading(l => ({ ...l, [tenderId]: false })); }
  };

  const handleSubmitForApproval = async (tenderId) => {
    setSubmitLoading(l => ({ ...l, [tenderId]: true }));
    try {
      await apiService.submitTenderForApproval(tenderId);
      setTenders(ts => ts.map(t => t.id === tenderId ? { ...t, approval_status: 'pending' } : t));
      setSubmitMsg(m => ({ ...m, [tenderId]: 'Submitted!' }));
    } catch {
      setSubmitMsg(m => ({ ...m, [tenderId]: 'Failed.' }));
    } finally {
      setSubmitLoading(l => ({ ...l, [tenderId]: false }));
    }
  };

  const counts = {
    total: tenders.length,
    approved: tenders.filter(t => t.approval_status === 'approved').length,
    pending: tenders.filter(t => t.approval_status === 'pending').length,
    draft: tenders.filter(t => t.approval_status === 'draft').length,
    rejected: tenders.filter(t => t.approval_status === 'rejected').length,
  };

  const filterStatus = FILTER_MAP[activeFilter];
  const filtered = tenders.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filterStatus || t.approval_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><Skeleton className="h-7 w-48" /><Skeleton className="h-10 w-36 rounded-xl" /></div>
      <div className="flex gap-3"><Skeleton className="h-20 flex-1 rounded-xl" /><Skeleton className="h-20 flex-1 rounded-xl" /><Skeleton className="h-20 flex-1 rounded-xl" /><Skeleton className="h-20 flex-1 rounded-xl" /></div>
      <TendersSkeleton />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">
            {isSuperAdmin ? 'All Tenders' : isAdmin ? 'My Tenders' : 'Available Tenders'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {tenders.length} tender{tenders.length !== 1 ? 's' : ''}
            {activeFilter !== 'All' ? ` · ${activeFilter}` : ''}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link to="/create-tender" className="no-underline">
              <Plus size={15} /> New Tender
            </Link>
          </Button>
        )}
      </motion.div>

      {/* ── Super Admin stat chips ── */}
      {isSuperAdmin && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.total, tone: 'bg-primary/10 text-primary', icon: LayoutGrid },
            { label: 'Published', value: counts.approved, tone: 'bg-success/10 text-success', icon: CheckCircle2 },
            { label: 'Pending', value: counts.pending, tone: 'bg-warning/10 text-warning', icon: Clock },
            { label: 'Rejected', value: counts.rejected, tone: 'bg-destructive/10 text-destructive', icon: XCircle },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className="rounded-xl p-4 flex items-center gap-3 bg-card border border-border shadow-sm">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', tone)}>
                <Icon size={15} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
                <p className="text-[11px] font-semibold mt-0.5 text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Search + filter row ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Search tenders…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-1 p-1 rounded-xl shrink-0 bg-muted border border-border">
            {FILTERS.map(f => {
              const active = activeFilter === f;
              return (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                    active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {f}
                  {FILTER_MAP[f] && counts[FILTER_MAP[f]] > 0 && (
                    <span className={cn(
                      'ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black inline-block leading-none',
                      active ? 'bg-white/20 text-primary-foreground' : 'bg-border text-muted-foreground'
                    )}>
                      {counts[FILTER_MAP[f]]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
            <FileText size={22} className="text-primary" />
          </div>
          <p className="font-semibold text-foreground">No tenders found</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Try a different search term.' : activeFilter !== 'All' ? `No ${activeFilter.toLowerCase()} tenders.` : isAdmin ? 'Create your first tender to get started.' : 'No tenders available right now.'}
          </p>
          {isAdmin && !search && (
            <Button asChild className="mt-2">
              <Link to="/create-tender" className="no-underline"><Plus size={14} /> Create Tender</Link>
            </Button>
          )}
        </motion.div>
      ) : (

        <div className="space-y-2.5">
          {filtered.map((t, i) => {
            const isClosed = t.deadline && new Date() > new Date(t.deadline);
            const approvalStatus = t.approval_status || 'approved';
            const canSubmit = isAdmin && (approvalStatus === 'draft' || approvalStatus === 'rejected');
            const sectorTone = SECTOR_TONES[t.sector] || 'bg-primary/10 text-primary';
            const dotTone = STATUS_DOT[approvalStatus] || 'bg-muted-foreground';

            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">

                <div className="flex items-center gap-4 px-5 py-4">

                  <div className="relative shrink-0">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', isClosed ? 'bg-muted' : 'bg-primary/10')}>
                      <FileText size={17} className={isClosed ? 'text-muted-foreground' : 'text-primary'} />
                    </div>
                    <span className={cn('absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card', dotTone)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{t.title}</p>
                      {t.sector && (
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0', sectorTone)}>
                          <Layers size={9} /> {t.sector}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock size={10} />
                        {t.deadline
                          ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'No deadline'}
                      </span>
                      {t.requirements?.length > 0 && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {t.requirements.length} requirements
                        </span>
                      )}
                      <Badge variant={isClosed ? 'secondary' : 'success'}>{isClosed ? 'Closed' : '● Open'}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">

                    {(isAdmin || isSuperAdmin) && <ApprovalBadge status={approvalStatus} />}

                    {isSuperAdmin && approvalStatus === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(t.id)}
                          disabled={approveLoading[t.id] || rejectLoading[t.id]}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          {approveLoading[t.id]
                            ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            : <CheckCircle2 size={11} />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant={rejectOpen[t.id] ? 'destructive' : 'outline'}
                          onClick={() => setRejectOpen(o => ({ ...o, [t.id]: !o[t.id] }))}
                          disabled={approveLoading[t.id] || rejectLoading[t.id]}
                          className={rejectOpen[t.id] ? '' : 'text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive'}
                        >
                          <XCircle size={11} /> {rejectOpen[t.id] ? 'Cancel' : 'Reject'}
                        </Button>
                      </>
                    )}

                    {canSubmit && !submitMsg[t.id] && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitForApproval(t.id)}
                        disabled={submitLoading[t.id]}
                        className="bg-warning text-warning-foreground hover:bg-warning/90"
                      >
                        <Send size={10} /> {submitLoading[t.id] ? 'Submitting…' : 'Submit for Review'}
                      </Button>
                    )}
                    {submitMsg[t.id] && (
                      <span className="text-[10px] font-semibold text-warning">{submitMsg[t.id]}</span>
                    )}

                    <Link to={tenderPath(t.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 no-underline transition-colors hover:bg-primary hover:text-primary-foreground">
                      View <ChevronRight size={12} />
                    </Link>

                    {isAdmin && (
                      <Link to={`/rankings/${t.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-warning/10 text-warning border border-warning/20 no-underline transition-colors hover:bg-warning hover:text-warning-foreground">
                        <Trophy size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isSuperAdmin && rejectOpen[t.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border">
                      <div className="px-5 py-3 flex items-center gap-3 bg-muted/30">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-destructive/10">
                          <XCircle size={11} className="text-destructive" />
                        </div>
                        <Input
                          type="text" placeholder="Rejection reason…"
                          value={rejectReason[t.id] || ''}
                          onChange={e => setRejectReason(r => ({ ...r, [t.id]: e.target.value }))}
                          className="flex-1 h-9"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(t.id)}
                          disabled={rejectLoading[t.id] || !rejectReason[t.id]?.trim()}
                        >
                          {rejectLoading[t.id]
                            ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            : 'Confirm Reject'}
                        </Button>
                        <button onClick={() => setRejectOpen(o => ({ ...o, [t.id]: false }))}
                          className="p-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground">
                          <X size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TendersList;
