import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { apiService } from '@/features/tendering/services/api';
import {
  ShieldCheck, FileText, Clock, CheckCircle2, XCircle,
  Users, ArrowRight, Layers, Zap,
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
  >{children}</motion.div>
);

let animFrame;
const AnimatedNum = ({ value = 0, duration = 800 }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ease * value));
      if (p < 1) animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration]);
  return <>{display}</>;
};

const PIPELINE_STAGES = [
  { key: 'draft', label: 'Draft', icon: FileText, tone: 'var(--muted-foreground)' },
  { key: 'pending', label: 'Pending', icon: Clock, tone: 'var(--warning)' },
  { key: 'approved', label: 'Approved', icon: CheckCircle2, tone: 'var(--success)' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, tone: 'var(--destructive)' },
];

const PipelineTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{payload[0].payload.label}</p>
      <p className="text-muted-foreground">{payload[0].value} tenders</p>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { name: 'Admin' };

  useEffect(() => {
    Promise.all([apiService.getSuperAdminStats(), apiService.getApprovalQueue()])
      .then(([sRes, qRes]) => {
        setStats(sRes.data);
        setQueue(qRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="space-y-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="rounded-xl h-28 bg-card border border-border" />)}
      </div>
    </div>
  );

  const STAT_CARDS = [
    { label: 'Total Tenders', value: stats?.total_tenders ?? 0, icon: FileText, tone: 'text-primary bg-primary/10' },
    { label: 'Pending Approval', value: stats?.pending_tenders ?? 0, icon: Clock, tone: 'text-warning bg-warning/10' },
    { label: 'Total Admins', value: stats?.total_admins ?? 0, icon: ShieldCheck, tone: 'text-sky-600 bg-sky-50' },
    { label: 'Total Suppliers', value: stats?.total_suppliers ?? 0, icon: Users, tone: 'text-success bg-success/10' },
  ];

  const pipeline = stats?.pipeline || {};
  const pipelineData = PIPELINE_STAGES.map(s => ({ label: s.label, value: pipeline[s.key] ?? 0, tone: s.tone }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeUp>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1 text-primary">
              Super Admin
            </p>
            <h1 className="text-2xl font-extrabold text-foreground">
              Platform Overview
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back, {user.name?.split(' ')[0]}. Here's the full system snapshot.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild>
              <Link to="/super-admin/queue" className="no-underline">
                <CheckCircle2 size={13} /> Approval Queue
                {queue.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{queue.length}</span>
                )}
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/super-admin/users" className="no-underline">
                <Users size={13} /> Manage Users
              </Link>
            </Button>
          </div>
        </div>
      </FadeUp>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, tone }, i) => (
          <FadeUp key={label} delay={i * 0.07}>
            <div className="rounded-xl p-5 h-full bg-card border border-border shadow-sm">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', tone)}>
                <Icon size={16} />
              </div>
              <p className="text-3xl font-extrabold text-foreground">
                <AnimatedNum value={value} />
              </p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
            </div>
          </FadeUp>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Tender Pipeline */}
        <FadeUp delay={0.18}>
          <div className="rounded-xl overflow-hidden lg:col-span-1 bg-card border border-border shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/30">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary">
                <Layers size={11} className="text-primary-foreground" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Tender Pipeline</h2>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={70}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip cursor={{ fill: 'var(--accent)' }} content={<PipelineTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {pipelineData.map((entry, i) => <Cell key={i} fill={entry.tone} />)}
                    <LabelList dataKey="value" position="right" style={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeUp>

        {/* Approval Queue preview */}
        <FadeUp delay={0.22}>
          <div className="rounded-xl overflow-hidden lg:col-span-2 bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-warning/10">
                  <Clock size={11} className="text-warning" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Pending Approval</h2>
                {queue.length > 0 && <Badge variant="warning">{queue.length}</Badge>}
              </div>
              <Link to="/super-admin/queue" className="text-xs font-semibold flex items-center gap-1 text-primary hover:text-primary/80 no-underline transition-colors">
                Manage all <ArrowRight size={11} />
              </Link>
            </div>

            {queue.length === 0 ? (
              <div className="py-14 text-center">
                <CheckCircle2 size={28} className="mx-auto mb-3 text-success/60" />
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No tenders pending approval.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {queue.slice(0, 5).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                        <FileText size={13} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.company_name || 'Unknown Company'} · {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link to="/super-admin/queue"
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/25 no-underline transition-colors hover:bg-warning hover:text-warning-foreground">
                      Review
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Quick actions footer */}
      <FadeUp delay={0.32}>
        <div className="rounded-xl p-5 bg-card border border-primary/15 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary">
              <Zap size={12} className="text-primary-foreground" fill="currentColor" />
            </div>
            <p className="text-sm font-bold text-foreground">Quick Actions</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Approval Queue', to: '/super-admin/queue', Icon: CheckCircle2 },
              { label: 'All Tenders', to: '/super-admin/tenders', Icon: FileText },
              { label: 'User Management', to: '/super-admin/users', Icon: Users },
              { label: 'Add New Admin', to: '/super-admin/users', Icon: ShieldCheck },
            ].map(({ label, to, Icon }) => (
              <Link key={label} to={to}
                className="flex items-center gap-2 p-3 rounded-lg text-xs font-semibold no-underline bg-muted/50 text-muted-foreground border border-border transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20">
                <Icon size={13} /> {label}
              </Link>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
};

export default SuperAdminDashboard;
