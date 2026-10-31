import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '@/features/tendering/services/api';
import {
  FileText, Clock, ArrowLeft, CheckCircle2, AlertCircle,
  Building2, Calendar, DollarSign, ExternalLink, Zap,
} from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { cn } from '@/shared/ui/tenderrank/utils';

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.48, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const SECTOR_TONES = {
  'Food Security & Agriculture': { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
  'ICT & Technology': { text: 'text-primary', bg: 'bg-primary/10' },
  'Education & Training': { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15' },
  'Engineering & Infrastructure': { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15' },
  'Energy & Power': { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15' },
  'Office Supplies & Printing': { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/15' },
  'Consultancy & Research': { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/15' },
  'Logistics & Flight Rental': { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/15' },
  'Healthcare & Insurance': { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/15' },
  'General Procurement': { text: 'text-muted-foreground', bg: 'bg-muted' },
};
const DEFAULT_TONE = SECTOR_TONES['General Procurement'];

const PublicTenderDetail = () => {
  const { tenderId: id } = useParams();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    apiService.getPublicTender(id)
      .then(res => setTender(res.data?.tender || res.data))
      .catch(() => setError('Could not load this tender.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading tender…</p>
        </div>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10">
            <AlertCircle size={22} className="text-primary" />
          </div>
          <p className="font-semibold mb-2 text-foreground">{error || 'Tender not found'}</p>
          <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 no-underline transition-colors">
            <ArrowLeft size={14} /> Back to tenders
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = !tender.deadline || new Date(tender.deadline) > Date.now();
  const deadline = tender.deadline ? new Date(tender.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86400000) : null;
  const requirements = Array.isArray(tender.requirements)
    ? tender.requirements
    : typeof tender.requirements === 'string'
      ? tender.requirements.split('\n').filter(Boolean)
      : [];

  const sectorKey = tender.sector || tender.category || 'General';
  const tone = SECTOR_TONES[sectorKey] || DEFAULT_TONE;

  return (
    <div className="bg-background min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[60px] -right-[60px] w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, var(--primary), transparent 65%)', filter: 'blur(60px)' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 text-muted-foreground hover:text-primary no-underline transition-colors">
              <ArrowLeft size={13} /> All Tenders
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {tender.sector && (
                <span className={cn('text-xs font-bold px-3 py-1 rounded-lg', tone.bg, tone.text)}>{tender.sector}</span>
              )}
              <Badge variant={isOpen ? 'success' : 'secondary'}>{isOpen ? '● Open' : 'Closed'}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 max-w-3xl text-foreground tracking-tight">
              {tender.title}
            </h1>
            {tender.reference_number && (
              <p className="text-xs text-muted-foreground/70">Ref: {tender.reference_number}</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">

            {tender.description && (
              <FadeUp>
                <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
                  <div className="px-6 py-4 flex items-center gap-2 border-b border-border bg-muted/30">
                    <FileText size={14} className="text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground">About this Tender</h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{tender.description}</p>
                  </div>
                </div>
              </FadeUp>
            )}

            {requirements.length > 0 && (
              <FadeUp delay={0.05}>
                <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
                  <div className="px-6 py-4 flex items-center gap-2 border-b border-border bg-muted/30">
                    <CheckCircle2 size={14} className="text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground">Requirements</h2>
                    <Badge className="ml-auto">{requirements.length}</Badge>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    {requirements.map((req, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-primary/10">
                          <CheckCircle2 size={11} className="text-primary" />
                        </div>
                        <p className="text-sm leading-snug text-foreground/80">
                          {typeof req === 'string' ? req : req.display_label || req.requirement_name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            )}

            {tender.instructions && (
              <FadeUp delay={0.1}>
                <div className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
                  <div className="px-6 py-4 flex items-center gap-2 border-b border-amber-200 dark:border-amber-500/30">
                    <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
                    <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400">Submission Instructions</h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">{tender.instructions}</p>
                  </div>
                </div>
              </FadeUp>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Summary card */}
            <FadeUp>
              <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
                <div className="px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-4 text-primary/70">
                    Tender Summary
                  </p>
                  <div className="space-y-4">
                    {[
                      { icon: Building2, label: 'Issuer', val: tender.issuer || 'National Procurement Commission' },
                      { icon: FileText, label: 'Reference', val: tender.reference_number || '—' },
                      { icon: DollarSign, label: 'Budget', val: tender.budget || 'Undisclosed' },
                      { icon: Calendar, label: 'Published', val: tender.created_at ? new Date(tender.created_at).toLocaleDateString() : '—' },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                          <Icon size={13} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                          <p className="text-xs font-semibold mt-0.5 text-foreground">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>

            {deadline && (
              <FadeUp delay={0.06}>
                <div className="rounded-xl px-6 py-5 bg-card border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={13} className="text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submission Deadline</p>
                  </div>
                  <p className="text-lg font-extrabold text-foreground mb-1">
                    {deadline.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {daysLeft !== null && (
                    <Badge variant={daysLeft <= 0 ? 'destructive' : daysLeft <= 7 ? 'warning' : 'default'}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : daysLeft === 0 ? 'Due today' : 'Deadline passed'}
                    </Badge>
                  )}
                </div>
              </FadeUp>
            )}

            {/* CTA */}
            <FadeUp delay={0.1}>
              <div className="rounded-xl px-6 py-5 space-y-3 bg-card border border-border">
                {isOpen ? (
                  <>
                    <Button size="lg" className="w-full" asChild>
                      <Link to={token ? '/supplier/tenders' : '/login'} className="no-underline">
                        {token ? 'Submit Proposal' : 'Login to Submit'} <ExternalLink size={14} />
                      </Link>
                    </Button>
                    {!token && (
                      <p className="text-xs text-center text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:text-primary/80 no-underline">Register free</Link>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 justify-center py-2">
                    <AlertCircle size={14} className="text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">This tender is no longer accepting submissions.</p>
                  </div>
                )}
              </div>
            </FadeUp>

            {/* Powered by AI */}
            <FadeUp delay={0.14}>
              <div className="rounded-xl px-5 py-4 flex items-center gap-3 bg-primary/10 border border-primary/20">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary">
                  <Zap size={14} className="text-primary-foreground" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">AI-Evaluated Scoring</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Proposals are scored automatically for compliance and merit.</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTenderDetail;
