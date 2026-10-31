import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '@/features/tendering/services/api';
import {
  FileText, Send, Clock, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Building2, Calendar,
  TrendingUp, Award, BarChart2,
} from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';

const FadeUp = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.42, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const STATUS_VARIANT = { under_review: 'warning', approved: 'success', rejected: 'destructive', submitted: 'default' };
const STATUS_ICON = { under_review: Clock, approved: CheckCircle2, rejected: XCircle, submitted: Send };
const STATUS_LABEL = { under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', submitted: 'Submitted' };

const SupplierDashboard = () => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { name: 'Supplier', email: '' };

  const [tenders, setTenders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getTenders(),
      apiService.getProposals(),
      apiService.getProfile(),
    ]).then(([tRes, pRes, profRes]) => {
      setTenders(tRes.data || []);
      setProposals(pRes.data || []);
      const p = profRes.data;
      const required = ['company_name', 'registration_number', 'company_type', 'country', 'city', 'address', 'phone', 'contact_person'];
      setProfileComplete(required.every(f => p[f]?.trim()));
    })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submittedTenderIds = new Set(proposals.map(p => p.tender_id));
  const openTenders = tenders.filter(t => !submittedTenderIds.has(t.id));
  const recentProposals = [...proposals]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5);

  const scores = proposals.map(p => p.score ?? 0).filter(s => s > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const bestScore = scores.length ? Math.round(Math.max(...scores)) : 0;

  const STATS = [
    { label: 'Open Tenders', value: openTenders.length, icon: FileText, tone: 'text-primary bg-primary/10' },
    { label: 'My Proposals', value: proposals.length, icon: Send, tone: 'text-sky-600 bg-sky-50' },
    { label: 'Avg Score', value: scores.length ? `${avgScore}%` : '—', icon: TrendingUp, tone: 'text-violet-600 bg-violet-50' },
    { label: 'Best Score', value: scores.length ? `${bestScore}%` : '—', icon: Award, tone: 'text-success bg-success/10' },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="rounded-xl h-28 bg-card border border-border" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Profile incomplete banner */}
      {!profileComplete && (
        <Link
          to="/profile"
          className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-warning/10 border border-warning/25 transition-colors hover:bg-warning/15 no-underline">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warning/15">
              <AlertTriangle size={15} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Complete your company profile</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                Your profile must be complete before you can submit proposals.
              </p>
            </div>
          </div>
          <Badge variant="warning" className="shrink-0 px-3 py-1.5 bg-warning text-warning-foreground border-transparent">
            Complete Profile
          </Badge>
        </Link>
      )}

      {/* Header */}
      <FadeUp>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1 text-primary">
            Supplier Portal
          </p>
          <h1 className="text-2xl font-extrabold text-foreground">
            Welcome, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse open tenders and track your submitted proposals.
          </p>
        </div>
      </FadeUp>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, tone }, i) => (
          <FadeUp key={label} delay={i * 0.07}>
            <div className="rounded-xl p-5 bg-card border border-border shadow-sm">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', tone)}>
                <Icon size={16} />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
            </div>
          </FadeUp>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Open Tenders */}
        <FadeUp delay={0.18}>
          <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-primary" />
                <h2 className="text-sm font-bold text-foreground">Open Tenders</h2>
                {openTenders.length > 0 && <Badge>{openTenders.length}</Badge>}
              </div>
              <Link to="/supplier/tenders" className="text-xs font-semibold flex items-center gap-1 text-primary hover:text-primary/80 no-underline transition-colors">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {openTenders.length === 0 ? (
              <div className="py-16 text-center">
                <FileText size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No open tenders available right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {openTenders.slice(0, 4).map((t, i) => {
                  const isClosed = t.deadline && new Date() > new Date(t.deadline);
                  const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - Date.now()) / 86400000) : null;
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                        {t.deadline && (
                          <span className={cn('flex items-center gap-1 text-[10px] mt-0.5 font-medium', daysLeft !== null && daysLeft <= 7 ? 'text-destructive' : 'text-muted-foreground')}>
                            <Calendar size={9} />
                            {daysLeft !== null && daysLeft > 0 ? `${daysLeft}d left` : 'Deadline passed'}
                          </span>
                        )}
                      </div>
                      {!isClosed ? (
                        <Button size="sm" asChild className="shrink-0">
                          <Link to={`/submit/${t.id}`} className="no-underline">Submit</Link>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Closed</Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Submission Tracker */}
        <FadeUp delay={0.24}>
          <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-violet-600" />
                <h2 className="text-sm font-bold text-foreground">Submission Tracker</h2>
                {proposals.length > 0 && <Badge className="bg-violet-50 text-violet-600 border-transparent">{proposals.length}</Badge>}
              </div>
            </div>

            {recentProposals.length === 0 ? (
              <div className="py-16 text-center">
                <Send size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No proposals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Browse open tenders and submit your first proposal.</p>
                <Button size="sm" asChild className="mt-4">
                  <Link to="/supplier/tenders" className="no-underline">Browse Tenders <ArrowRight size={11} /></Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentProposals.map((p, i) => {
                  const variant = STATUS_VARIANT[p.status] || 'default';
                  const Icon = STATUS_ICON[p.status] || Send;
                  const label = STATUS_LABEL[p.status] || 'Submitted';
                  const score = p.score ?? 0;
                  const scoreColor = score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive';
                  const scoreText = score >= 70 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                    >
                      <Link
                        to={`/supplier/proposal/${p.id}`}
                        className="flex flex-col px-5 py-3.5 gap-2 no-underline transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {p.tender_title || `Tender #${p.tender_id}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {score > 0 && (
                              <span className={cn('text-xs font-bold', scoreText)}>{score.toFixed(0)}%</span>
                            )}
                            <Badge variant={variant}>
                              <Icon size={10} /> {label}
                            </Badge>
                          </div>
                        </div>
                        {score > 0 && (
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={cn('h-full rounded-full', scoreColor)}
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                            />
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Profile nudge */}
      {!user.company_name && (
        <FadeUp delay={0.32}>
          <div className="rounded-xl px-5 py-4 flex items-center justify-between gap-4 bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary">
                <Building2 size={15} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Complete your company profile</p>
                <p className="text-xs text-primary/80 mt-0.5">A complete profile increases your chances of winning tenders.</p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0">
              <Link to="/profile" className="no-underline">Set Up Profile</Link>
            </Button>
          </div>
        </FadeUp>
      )}
    </div>
  );
};

export default SupplierDashboard;
