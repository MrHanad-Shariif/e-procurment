import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '@/features/tendering/services/api';
import { FileText, Clock, Search, ArrowRight, AlertCircle, Briefcase } from 'lucide-react';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Input } from '@/shared/ui/tenderrank/input';
import { cn } from '@/shared/ui/tenderrank/utils';

const SECTORS = [
  'All',
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

/* Tailwind-scale tone per sector — text/bg/border/dot all derived from one class group */
const SECTOR_TONES = {
  'Food Security & Agriculture': { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15', border: 'border-emerald-200 dark:border-emerald-500/30', solid: 'bg-emerald-600 dark:bg-emerald-500' },
  'ICT & Technology': { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', solid: 'bg-primary', solidText: 'text-primary-foreground' },
  'Education & Training': { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15', border: 'border-blue-200 dark:border-blue-500/30', solid: 'bg-blue-600 dark:bg-blue-500' },
  'Engineering & Infrastructure': { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15', border: 'border-amber-200 dark:border-amber-500/30', solid: 'bg-amber-600 dark:bg-amber-500' },
  'Energy & Power': { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15', border: 'border-orange-200 dark:border-orange-500/30', solid: 'bg-orange-600 dark:bg-orange-500' },
  'Office Supplies & Printing': { text: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-500/15', border: 'border-slate-200 dark:border-slate-500/30', solid: 'bg-slate-500' },
  'Consultancy & Research': { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/15', border: 'border-indigo-200 dark:border-indigo-500/30', solid: 'bg-indigo-600 dark:bg-indigo-500' },
  'Logistics & Flight Rental': { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/15', border: 'border-sky-200 dark:border-sky-500/30', solid: 'bg-sky-600 dark:bg-sky-500' },
  'Healthcare & Insurance': { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/15', border: 'border-rose-200 dark:border-rose-500/30', solid: 'bg-rose-600 dark:bg-rose-500' },
  'General Procurement': { text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', solid: 'bg-muted-foreground', solidText: 'text-background' },
};
const DEFAULT_TONE = SECTOR_TONES['General Procurement'];
const ALL_TONE = { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', solid: 'bg-primary', solidText: 'text-primary-foreground' };

const daysLeft = (deadline) => {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - Date.now()) / 86400000);
};

const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden bg-card border border-border">
    <Skeleton className="h-1.5 w-full rounded-none" />
    <div className="px-5 py-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between mt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <div className="px-5 pb-5">
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  </div>
);

const PublicTenders = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');

  useEffect(() => {
    apiService.getPublicTenders()
      .then(res => {
        const list = res.data;
        setTenders(Array.isArray(list) ? list : list?.tenders || []);
      })
      .catch(() => setError('Unable to load tenders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenders.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    const matchSector = sector === 'All' || t.sector === sector || t.category === sector;
    return matchSearch && matchSector;
  });

  return (
    <div className="bg-background min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-primary/5 to-emerald-50 dark:from-blue-500/10 dark:via-primary/10 dark:to-emerald-500/10">
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/10" />
        <div className="pointer-events-none absolute -bottom-12 left-[20%] w-52 h-52 rounded-full bg-blue-200/30 dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute top-[10%] -left-16 w-44 h-44 rounded-full bg-emerald-200/30 dark:bg-emerald-500/10" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 bg-blue-100 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">
              <Briefcase size={11} /> Public Register
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-foreground tracking-tight leading-tight">
              Open Tenders<br />
              <span className="text-primary">&amp; Opportunities</span>
            </h1>
            <p className="text-base sm:text-lg max-w-md text-muted-foreground mb-8 leading-relaxed">
              All active procurement opportunities published by the National Procurement Commission — transparent, fair, and open to all.
            </p>

            <div className="max-w-lg relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <Input
                type="text"
                placeholder="Search by title, description, or sector…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl shadow-md"
              />
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              {[
                { n: `${tenders.length || '—'}`, label: 'Active tenders', tone: 'text-blue-600 dark:text-blue-400' },
                { n: '7', label: 'Sectors covered', tone: 'text-primary' },
                { n: '72h', label: 'Avg. evaluation', tone: 'text-emerald-600 dark:text-emerald-400' },
              ].map(({ n, label, tone }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
                  <span className={cn('text-base font-extrabold', tone)}>{n}</span>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Sector filters ── */}
      <div className="sticky top-16 z-30 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {SECTORS.map(s => {
            const active = sector === s;
            const tone = s === 'All' ? ALL_TONE : (SECTOR_TONES[s] || DEFAULT_TONE);
            return (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={cn(
                  'shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border',
                  active ? cn(tone.solid, tone.solidText || 'text-white', 'border-transparent shadow-sm') : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                )}
              >{s}</button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl px-5 py-4 max-w-md mx-auto mt-10 bg-card border border-destructive/20 shadow-sm">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10">
              <AlertCircle size={16} className="text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10">
              <FileText size={24} className="text-primary" />
            </div>
            <p className="font-bold text-foreground">No tenders found</p>
            <p className="text-sm mt-1 text-muted-foreground">
              {search || sector !== 'All' ? 'Try adjusting your search or sector filter.' : 'No tenders are currently published.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filtered.length}</span> tender{filtered.length !== 1 ? 's' : ''}
                {sector !== 'All' && <> in <span className={cn('font-bold', (SECTOR_TONES[sector] || DEFAULT_TONE).text)}>{sector}</span></>}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t, i) => {
                const days = daysLeft(t.deadline);
                const isUrgent = days !== null && days <= 7;
                const isOpen = !t.deadline || new Date(t.deadline) > Date.now();
                const sectorKey = t.sector || t.category || 'General';
                const tone = SECTOR_TONES[sectorKey] || DEFAULT_TONE;

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
                    className="rounded-xl overflow-hidden bg-card border border-border shadow-sm flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className={cn('h-1 shrink-0', tone.solid)} />

                    <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border', tone.bg, tone.text, tone.border)}>
                        {sectorKey}
                      </span>
                      <Badge variant={isOpen ? 'success' : 'secondary'}>{isOpen ? '● Open' : 'Closed'}</Badge>
                    </div>

                    <div className="px-5 py-3 flex-1">
                      <h3 className="font-bold text-sm leading-snug mb-2 text-foreground">{t.title}</h3>
                      {t.description && (
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{t.description}</p>
                      )}
                    </div>

                    <div className="px-5 py-3 flex items-center justify-between border-t border-border">
                      <span className={cn('flex items-center gap-1.5 text-xs font-medium', isUrgent ? 'text-destructive' : 'text-muted-foreground')}>
                        <Clock size={11} />
                        {days === null ? 'No deadline'
                          : isUrgent ? `${days}d left — urgent`
                          : t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                          : '—'}
                      </span>
                      {t.budget && <span className={cn('text-xs font-extrabold', tone.text)}>{t.budget}</span>}
                    </div>

                    <div className="px-5 pb-5">
                      <Link
                        to={`/browse/${t.id}`}
                        className={cn(
                          'flex items-center justify-center gap-1.5 w-full rounded-lg py-2.5 text-xs font-bold border no-underline transition-all hover:brightness-95',
                          tone.bg, tone.text, tone.border
                        )}
                      >
                        View Details <ArrowRight size={12} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicTenders;
