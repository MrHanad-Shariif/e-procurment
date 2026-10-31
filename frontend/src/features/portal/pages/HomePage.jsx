import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Zap, TrendingUp, Globe, ArrowRight,
  FileText, Clock, Users, Award, CheckCircle2,
  BarChart2, ChevronRight, Building2, BadgeCheck,
} from 'lucide-react';
import Logo from '@/shared/brand/Logo';
import { Button } from '@/shared/ui/tenderrank/button';
import { cn } from '@/shared/ui/tenderrank/utils';

/* ── Animated counter ── */
const Counter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const num = parseInt(target);
    if (isNaN(num)) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * num));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
};

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const FEATURES = [
  { icon: Shield, title: 'Transparent Process', desc: 'Every tender and award is published on the public register, ensuring full accountability.' },
  { icon: Zap, title: 'AI-Powered Scoring', desc: 'Our NLP engine reads submissions and ranks suppliers by compliance, fairness, and merit.' },
  { icon: TrendingUp, title: 'Real-Time Rankings', desc: 'Procurement officers see live leaderboards the moment evaluations complete.' },
  { icon: Globe, title: 'Open to All', desc: 'Any registered Somali business — small or large — can submit a competitive bid.' },
];

const STEPS = [
  { n: '01', title: 'Browse Open Tenders', desc: 'Find active contracts on the public register, filtered by sector and deadline.' },
  { n: '02', title: 'Register as a Supplier', desc: 'Create your company profile with registration numbers, certifications, and contacts.' },
  { n: '03', title: 'Upload Your Proposal', desc: 'Submit your PDF or Word document before the tender deadline.' },
  { n: '04', title: 'Receive Your Score', desc: 'Our AI evaluates compliance, then procurement officers confirm the final ranking.' },
];

const REGISTER_PREVIEW = [
  { ref: 'NPC-2026-INF-041', sector: 'Infrastructure', status: 'open' },
  { ref: 'NPC-2026-MED-017', sector: 'Healthcare', status: 'open' },
  { ref: 'NPC-2026-EDU-009', sector: 'Education', status: 'review' },
  { ref: 'NPC-2026-ICT-033', sector: 'Technology', status: 'awarded' },
];
const REGISTER_STATUS_STYLE = {
  open: { dot: 'bg-success', label: 'Open', text: 'text-success' },
  review: { dot: 'bg-warning', label: 'In Review', text: 'text-warning' },
  awarded: { dot: 'bg-primary', label: 'Awarded', text: 'text-primary' },
};

const MOBILE_STATS = [
  { value: 124, suffix: '+', label: 'Active Tenders', icon: FileText },
  { value: 830, suffix: '+', label: 'Registered Suppliers', icon: Users },
  { value: 310, suffix: '+', label: 'Awards', icon: Award },
  { value: 48, suffix: 'M', label: 'USD Contracted', icon: BarChart2 },
];

const MISSION_POINTS = [
  { icon: Building2, label: 'Federal Ministry Oversight' },
  { icon: Zap, label: 'AI-Assisted Evaluation' },
  { icon: FileText, label: 'Public Register Access' },
  { icon: CheckCircle2, label: '72-hour Award Decision' },
];

const RECENT_TENDERS = [
  { sector: 'Infrastructure', title: 'Mogadishu Road Rehabilitation Phase III', deadline: 'Jul 15, 2026', value: '$2.4M', ref: 'NPC-2026-INF-041' },
  { sector: 'Healthcare', title: 'Medical Equipment Supply — Regional Hospitals', deadline: 'Jul 22, 2026', value: '$890K', ref: 'NPC-2026-MED-017' },
  { sector: 'Education', title: 'School Construction & Renovation — Banadir', deadline: 'Aug 3, 2026', value: '$1.1M', ref: 'NPC-2026-EDU-009' },
];

const HomePage = () => {
  const token = localStorage.getItem('access_token');

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="border-b border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-10 items-center">

            {/* Left — text */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>

              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-px w-8 bg-primary" />
                <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-[0.08em]">
                  NATIONAL PROCUREMENT COMMISSION
                </span>
              </div>

              <h1 className="font-serif text-foreground mb-6" style={{ fontSize: 'clamp(38px, 4.6vw, 60px)', lineHeight: 1.08, letterSpacing: '-0.01em', textWrap: 'balance' }}>
                Every tender, on the public record.
              </h1>

              <p className="text-[17px] leading-relaxed text-muted-foreground mb-8 max-w-[440px]">
                TenderRank publishes every active tender, evaluates proposals with AI, and
                awards contracts transparently — open to every Somali business, no exceptions.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Button size="lg" asChild>
                  <Link to="/browse" className="no-underline">
                    Browse the Register <ArrowRight size={15} />
                  </Link>
                </Button>
                {!token && (
                  <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary no-underline inline-flex items-center gap-1 transition-colors">
                    Sign in as a supplier <ChevronRight size={13} />
                  </Link>
                )}
              </div>

              {/* Stat strip */}
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-border">
                {[
                  { n: '124+', label: 'Open tenders' },
                  { n: '830+', label: 'Suppliers' },
                  { n: '72h', label: 'Avg. award' },
                ].map(({ n, label }) => (
                  <div key={label}>
                    <p className="font-mono text-2xl font-semibold text-foreground tabular-nums">{n}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — public register preview, not a stock photo */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative">

              <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
                  <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-wide">PUBLIC REGISTER — LIVE</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Updating
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {REGISTER_PREVIEW.map((row, i) => {
                    const st = REGISTER_STATUS_STYLE[row.status];
                    return (
                      <motion.div
                        key={row.ref}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                        className="flex items-center justify-between px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-medium text-foreground">{row.ref}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{row.sector}</p>
                        </div>
                        <span className={cn('flex items-center gap-1.5 text-xs font-medium shrink-0', st.text)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} /> {st.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Seal — the one deliberate accent moment */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-6 -left-6 flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-amber-500/60 bg-card shadow-lg"
              >
                <BadgeCheck size={20} className="text-amber-600 dark:text-amber-400" />
                <span className="font-mono text-[8px] font-semibold text-amber-700 dark:text-amber-400 tracking-wide mt-1 text-center leading-tight">
                  AI<br />VERIFIED
                </span>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── MOBILE STATS ── */}
      <div className="lg:hidden py-10 px-4 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3">
          {MOBILE_STATS.map(({ value, suffix, label, icon: Icon }, i) => (
            <FadeUp key={label} delay={i * 0.08}>
              <div className="rounded-xl p-5 bg-card border border-border">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-primary/10">
                  <Icon size={16} className="text-primary" />
                </div>
                <p className="font-mono text-2xl font-semibold text-foreground tabular-nums">
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="max-w-xl mb-14">
            <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-[0.08em] block mb-4">
              WHY TENDERRANK
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground" style={{ letterSpacing: '-0.01em', textWrap: 'balance' }}>
              Built for transparency &amp; speed
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.08}>
                <div className="rounded-xl p-6 h-full bg-background border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/30">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-primary/10">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO APPLY ── */}
      <section className="py-24 px-4 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="max-w-xl mb-14">
            <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-[0.08em] block mb-4">
              THE PROCESS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground" style={{ letterSpacing: '-0.01em', textWrap: 'balance' }}>
              Four steps, start to score
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ n, title, desc }, i) => (
              <FadeUp key={n} delay={i * 0.1}>
                <div className="relative rounded-xl p-6 h-full bg-card border border-border shadow-sm">
                  <p className="font-mono text-xs font-medium text-primary/70 mb-4">N° {n}</p>
                  <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 -right-[18px] z-10">
                      <ChevronRight size={16} className="text-border" />
                    </div>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.4} className="mt-10">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90" asChild>
              <Link to={token ? '/dashboard' : '/login'} className="no-underline">
                {token ? 'Go to Supplier Portal' : 'Start Bidding Today'} <ArrowRight size={15} />
              </Link>
            </Button>
          </FadeUp>
        </div>
      </section>

      {/* ── ABOUT / STATS ── */}
      <section className="py-24 px-4 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <FadeUp>
              <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-[0.08em] block mb-4">
                OUR MANDATE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl mb-5 text-foreground" style={{ letterSpacing: '-0.01em', textWrap: 'balance' }}>
                Empowering Somalia's private sector through fair competition
              </h2>
              <p className="text-base leading-relaxed mb-8 text-muted-foreground">
                The NPC was established to modernise public procurement across all federal ministries.
                By replacing manual evaluation with AI-assisted scoring, we eliminate bias, reduce
                processing time, and award contracts to the most qualified suppliers.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MISSION_POINTS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg px-4 py-3 bg-background border border-border">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FileText, n: '124+', label: 'Open Tenders', sub: 'Across all ministries' },
                  { icon: Users, n: '830+', label: 'Suppliers', sub: 'Registered & verified' },
                  { icon: Award, n: '310+', label: 'Awards', sub: 'Since 2022' },
                  { icon: BarChart2, n: '4.8', label: 'Supplier Rating', sub: 'Avg satisfaction' },
                ].map(({ icon: Icon, n, label, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl p-5 flex flex-col gap-3 bg-background border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-2xl font-semibold text-foreground tabular-nums">{n}</p>
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── RECENT TENDERS ── */}
      <section className="py-24 px-4 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="flex items-end justify-between mb-10">
            <div>
              <span className="font-mono text-[11px] font-medium text-muted-foreground tracking-[0.08em] block mb-3">
                LATEST ENTRIES
              </span>
              <h2 className="font-serif text-3xl text-foreground" style={{ letterSpacing: '-0.01em' }}>Open right now</h2>
            </div>
            <Link to="/browse" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 no-underline transition-colors">
              View all <ArrowRight size={13} />
            </Link>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RECENT_TENDERS.map(({ sector, title, deadline, value, ref: refCode }, i) => (
              <FadeUp key={refCode} delay={i * 0.1}>
                <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary/10 text-primary">{sector}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/70">{refCode}</span>
                  </div>
                  <div className="px-5 py-4">
                    <h3 className="font-semibold text-sm mb-3 leading-snug text-foreground">{title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock size={11} /> {deadline}</span>
                      <span className="font-mono font-semibold text-foreground">{value}</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <Link
                      to="/browse"
                      className="flex items-center justify-center gap-1.5 w-full rounded-lg py-2.5 text-xs font-semibold text-foreground bg-muted border border-border transition-colors hover:bg-foreground hover:text-background hover:border-foreground no-underline"
                    >
                      View Tender <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-4 bg-muted/40 border-b border-border">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-muted-foreground tracking-[0.08em] mb-6">
              <BadgeCheck size={13} className="text-amber-500" /> CERTIFIED FAIR EVALUATION
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl mb-5 text-foreground" style={{ letterSpacing: '-0.01em', textWrap: 'balance' }}>
              Ready to grow your business with government contracts?
            </h2>
            <p className="text-base mb-8 text-muted-foreground">
              Register once. Submit to any open tender. Compete fairly on merit.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" asChild>
                <Link to={token ? '/dashboard' : '/login'} className="no-underline">
                  {token ? 'Open Dashboard' : 'Create Free Account'} <ArrowRight size={15} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact" className="no-underline">
                  Contact Us <ChevronRight size={15} />
                </Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">

            <div>
              <Logo className="mb-4" />
              <p className="text-xs leading-relaxed text-muted-foreground max-w-[220px]">
                Federal Government of Somalia · Transparent, efficient, and fair public procurement.
              </p>
            </div>

            <div>
              <p className="font-mono text-[11px] font-medium tracking-wider mb-4 text-muted-foreground/70">QUICK LINKS</p>
              {[['/', 'Home'], ['/browse', 'Browse Tenders'], ['/contact', 'Contact Us']].map(([to, label]) => (
                <Link key={to} to={to} className="block text-sm mb-3 font-medium text-muted-foreground hover:text-primary transition-colors no-underline">
                  {label}
                </Link>
              ))}
            </div>

            <div>
              <p className="font-mono text-[11px] font-medium tracking-wider mb-4 text-muted-foreground/70">SUPPLIER PORTAL</p>
              {[['/login', 'Sign In'], ['/login', 'Create Account'], ['/browse', 'Open Tenders']].map(([to, label]) => (
                <Link key={label} to={to} className="block text-sm mb-3 font-medium text-muted-foreground hover:text-primary transition-colors no-underline">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground/60">© 2026 National Procurement Commission — Federal Government of Somalia</p>
            <p className="font-mono text-xs text-muted-foreground/60">All procurement data is public record.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
