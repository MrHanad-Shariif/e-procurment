import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '@/features/tendering/services/api';
import {
  FileText, Users, CheckCircle2, Clock, Plus, Trophy,
  TrendingUp, ChevronRight, Zap, BarChart3,
  ArrowUpRight, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/shared/ui/tenderrank/table';
import ScoreGauge from '@/features/tendering/components/ScoreGauge';
import { cn } from '@/shared/ui/tenderrank/utils';

/* ── Animated counter ── */
const AnimatedNum = ({ value, suffix = '', prefix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    const target = Number(value);
    const duration = 1100;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
};

/* ── Skeleton ── */
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl p-5 space-y-3 bg-card border border-border h-[100px]">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl p-6 space-y-3 bg-card border border-border h-[280px]">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl bg-card border border-border h-[200px]" />
      </div>
    </div>
  </div>
);

const STATUS_BADGE_VARIANT = { under_review: 'warning', approved: 'success', rejected: 'destructive' };
const STATUS_LABEL = { under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' };

const StatusBadge = ({ status }) => (
  <Badge variant={STATUS_BADGE_VARIANT[status] || 'warning'}>
    {STATUS_LABEL[status] || 'Under Review'}
  </Badge>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier', name: 'User' };
  const role = user.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tendersRes, proposalsRes] = await Promise.all([
          apiService.getTenders(),
          apiService.getProposals(),
        ]);
        setTenders(tendersRes.data || []);
        setProposals(proposalsRes.data || []);

        if (isAdmin || isSuperAdmin) {
          try {
            const statsRes = await apiService.getAdminStats();
            setAdminStats(statsRes.data);
          } catch { /* stats optional */ }
        }

        if (isAdmin) {
          try {
            const profileRes = await apiService.getProfile();
            const p = profileRes.data;
            const required = ['company_name', 'company_type', 'country', 'address', 'phone', 'contact_person'];
            setProfileComplete(required.every(f => p[f]?.trim()));
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdmin, isSuperAdmin]);

  if (loading) return <DashboardSkeleton />;

  const totalTenders = tenders.length;
  const activeTenders = tenders.filter(t => {
    if (!t.deadline) return true;
    return new Date(t.deadline) > new Date();
  }).length;
  const uniqueSuppliers = [...new Set(proposals.map(p => p.supplier_id || p.supplier_name))].length;
  const totalProposals = proposals.length;
  const pendingProposals = proposals.filter(p => p.status === 'under_review').length;
  const approvedProposals = proposals.filter(p => p.status === 'approved').length;
  const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;

  const scores = proposals.filter(p => p.score != null && p.tender_screening_status === 'completed').map(p => Number(p.score));
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const topScore = scores.length ? Math.max(...scores) : 0;

  const STATS = [
    {
      label: 'Total Tenders',
      value: totalTenders,
      icon: FileText,
      tone: 'text-primary bg-primary/10',
      sub: `${activeTenders} active`,
    },
    {
      label: 'Total Proposals',
      value: totalProposals,
      icon: BarChart3,
      tone: 'text-sky-600 bg-sky-50',
      sub: `${pendingProposals} pending`,
    },
    {
      label: 'Unique Suppliers',
      value: uniqueSuppliers,
      icon: Users,
      tone: 'text-success bg-success/10',
      sub: isAdmin ? 'registered bidders' : 'on platform',
    },
    {
      label: 'Avg Score',
      value: avgScore.toFixed(1),
      icon: TrendingUp,
      tone: topScore >= 80 ? 'text-success bg-success/10' : 'text-warning bg-warning/10',
      sub: `Top: ${topScore.toFixed(0)}%`,
      noCounter: true,
    },
  ];

  const recentTenders = [...tenders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const recentProposals = [...proposals].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 6);

  return (
    <div className="space-y-6">

      {/* Profile incomplete banner */}
      {isAdmin && !profileComplete && (
        <Link
          to="/admin/profile"
          className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-warning/10 border border-warning/30 transition-colors hover:bg-warning/15 no-underline"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warning/15">
              <AlertTriangle size={15} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Complete your organisation profile</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                You need to fill in your organisation details before you can create tenders.
              </p>
            </div>
          </div>
          <Badge variant="warning" className="shrink-0 px-3 py-1.5 bg-warning text-warning-foreground border-transparent">
            Complete Profile
          </Badge>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-xl p-5 bg-card border border-border shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', s.tone)}>
                  <Icon size={16} />
                </div>
                <ArrowUpRight size={13} className="text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-extrabold text-foreground leading-none">
                {s.noCounter ? s.value : <AnimatedNum value={s.value} />}
              </p>
              <p className="text-xs font-semibold text-muted-foreground mt-1">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left — tenders + proposals */}
        <div className="lg:col-span-2 space-y-5">

          {/* Active Tenders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl overflow-hidden bg-card border border-border shadow-sm"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-primary" />
                <h2 className="text-sm font-bold text-foreground">Active Tenders</h2>
                <Badge>{activeTenders}</Badge>
              </div>
              {isAdmin && (
                <Button size="sm" asChild>
                  <Link to="/create-tender" className="no-underline">
                    <Plus size={12} /> New Tender
                  </Link>
                </Button>
              )}
            </div>

            {recentTenders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <FileText size={28} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">No tenders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTenders.map((t, i) => {
                  const isClosed = t.deadline && new Date() > new Date(t.deadline);
                  const approvalStatus = t.approval_status || 'approved';
                  const approvalVariant = approvalStatus === 'approved' ? 'success'
                    : approvalStatus === 'pending' ? 'warning'
                    : approvalStatus === 'rejected' ? 'destructive' : 'secondary';
                  const approvalLabel = approvalStatus === 'approved' ? 'Published'
                    : approvalStatus === 'pending' ? 'Pending'
                    : approvalStatus === 'rejected' ? 'Rejected' : 'Draft';
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-accent/50"
                      onClick={() => navigate(isSuperAdmin ? `/super-admin/tenders/${t.id}` : `/tenders/${t.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isClosed ? 'bg-muted' : 'bg-primary/10')}>
                          <FileText size={13} className={isClosed ? 'text-muted-foreground' : 'text-primary'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock size={9} />
                            {t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isClosed ? 'secondary' : 'success'}>{isClosed ? 'Closed' : 'Open'}</Badge>
                        {(isAdmin || isSuperAdmin) && <Badge variant={approvalVariant}>{approvalLabel}</Badge>}
                        <ChevronRight size={13} className="text-muted-foreground/50" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {tenders.length > 5 && (
              <div className="px-5 py-3 border-t border-border">
                <Link to="/tenders" className="text-xs font-semibold text-primary hover:text-primary/80 no-underline">
                  View all {tenders.length} tenders →
                </Link>
              </div>
            )}
          </motion.div>

          {/* Recent Proposals */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-xl overflow-hidden bg-card border border-border shadow-sm"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} className="text-sky-600" />
                <h2 className="text-sm font-bold text-foreground">Recent Proposals</h2>
                <Badge className="bg-sky-50 text-sky-600 border-transparent">{totalProposals}</Badge>
              </div>
              {isAdmin && (
                <Link to="/rankings" className="inline-flex items-center gap-1 text-xs font-semibold text-primary no-underline">
                  <Trophy size={12} /> Leaderboard
                </Link>
              )}
            </div>

            {recentProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <BarChart3 size={24} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">No proposals yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Score</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProposals.map((p) => {
                    const score = (p.score != null && p.tender_screening_status === 'completed') ? p.score : null;
                    const scoreClass = score == null ? 'text-muted-foreground' : score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
                    return (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/proposals/${p.id}`)}>
                        <TableCell className="font-semibold text-foreground">
                          {p.supplier_name || `Supplier #${p.supplier_id}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">#{p.tender_id}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        {isAdmin && (
                          <TableCell className={cn('text-right font-bold', scoreClass)}>
                            {score != null ? `${score.toFixed(0)}%` : '—'}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Score gauge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-xl p-5 bg-card border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary">
                <Zap size={12} className="text-primary-foreground" fill="currentColor" />
              </div>
              <h3 className="text-sm font-bold text-foreground">AI Compliance Score</h3>
            </div>
            <div className="flex justify-center">
              <ScoreGauge score={avgScore} label="Avg Score" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Approved', val: approvedProposals, tone: 'text-success bg-success/10' },
                { label: 'Pending', val: pendingProposals, tone: 'text-warning bg-warning/10' },
                { label: 'Rejected', val: rejectedProposals, tone: 'text-destructive bg-destructive/10' },
              ].map(s => (
                <div key={s.label} className={cn('rounded-lg p-2.5 text-center', s.tone)}>
                  <p className="text-base font-extrabold">{s.val}</p>
                  <p className="text-[9px] font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="rounded-xl p-5 bg-card border border-border shadow-sm"
          >
            <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                isAdmin && { label: 'Create Tender', desc: 'Add new procurement', to: '/create-tender', icon: Plus, tone: 'text-primary bg-primary/10' },
                { label: 'View Tenders', desc: 'Browse all tenders', to: '/tenders', icon: FileText, tone: 'text-sky-600 bg-sky-50' },
                isAdmin && { label: 'Rankings', desc: 'AI leaderboard', to: '/rankings', icon: Trophy, tone: 'text-warning bg-warning/10' },
              ].filter(Boolean).map(action => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border transition-colors hover:bg-accent hover:border-transparent no-underline"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', action.tone)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground/50" />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Proposal breakdown */}
          {proposals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-xl p-5 bg-card border border-primary/20 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Proposal Overview</h3>
              </div>
              {[
                { label: 'Total Received', val: totalProposals, pct: 100, chart: 'var(--chart-1)' },
                { label: 'Approved', val: approvedProposals, pct: totalProposals ? (approvedProposals / totalProposals) * 100 : 0, chart: 'var(--chart-2)' },
                { label: 'Under Review', val: pendingProposals, pct: totalProposals ? (pendingProposals / totalProposals) * 100 : 0, chart: 'var(--chart-3)' },
                { label: 'Rejected', val: rejectedProposals, pct: totalProposals ? (rejectedProposals / totalProposals) * 100 : 0, chart: 'var(--chart-4)' },
              ].map((row, i) => (
                <div key={row.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground">{row.label}</span>
                    <span className="text-[11px] font-bold text-foreground">{row.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: row.chart }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
