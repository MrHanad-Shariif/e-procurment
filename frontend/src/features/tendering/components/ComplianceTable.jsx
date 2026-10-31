import React, { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/ui/tenderrank/utils';

function getStatus(req) {
  const c = req.confidence ?? 0;
  if (c >= 0.50) return 'met';
  if (c >= 0.35) return 'partial';
  return 'missing';
}

const STATUS = {
  met:     { label: 'Found',   icon: CheckCircle2, bar: 'bg-success',     text: 'text-success',     border: 'border-success/20',     bg: 'bg-success/5'     },
  partial: { label: 'Partial', icon: MinusCircle,  bar: 'bg-warning',     text: 'text-warning',     border: 'border-warning/20',     bg: 'bg-warning/5'     },
  missing: { label: 'Missing', icon: XCircle,      bar: 'bg-destructive', text: 'text-destructive', border: 'border-destructive/20', bg: 'bg-destructive/5' },
};

function MatchBar({ value = 0 }) {
  const pct = Math.round((value || 0) * 100);
  const status = pct >= 50 ? 'met' : pct >= 35 ? 'partial' : 'missing';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', STATUS[status].bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-[10px] font-bold tabular-nums w-7 text-right shrink-0', STATUS[status].text)}>
        {pct}%
      </span>
    </div>
  );
}

function RequirementCard({ req, index, isMandatory }) {
  const [open, setOpen] = useState(false);
  const status = getStatus(req);
  const cfg = STATUS[status];
  const Icon = cfg.icon;
  const label = req.display_label || req.requirement_name?.replace(/_/g, ' ') || '—';
  const found = req.matched_text?.trim();
  const pct = Math.round((req.confidence ?? 0) * 100);

  // Always derive points from confidence — stored values may be from a stale scoring run
  const possible = req.points_possible ?? 0;
  const earned = status === 'met' ? possible : status === 'partial' ? Math.floor(possible / 2) : 0;

  return (
    <div className={cn('rounded-xl overflow-hidden border shadow-sm', cfg.border)}>
      {/* Header row */}
      <div className={cn('flex items-center gap-3 px-4 py-3', cfg.bg)}>
        <Icon size={15} className={cn('shrink-0', cfg.text)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isMandatory && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-destructive/15 text-destructive shrink-0">
                Required
              </span>
            )}
            {!isMandatory && possible > 0 && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                {earned}/{possible} pts
              </span>
            )}
            <span className={cn('text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0',
              status === 'met' ? 'bg-success/15 text-success' : status === 'partial' ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive'
            )}>
              {cfg.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="p-1 rounded-lg text-muted-foreground transition-colors hover:bg-muted shrink-0"
        >
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Two-column comparison */}
      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border bg-card">
        {/* Left — requirement */}
        <div className="px-4 py-3.5 space-y-1.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">What was required</p>
          <p className="text-sm text-foreground leading-relaxed font-medium">
            {label}
          </p>
        </div>

        {/* Right — what was found */}
        <div className="px-4 py-3.5 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">What was found</p>
          {found ? (
            <>
              <p className={cn(
                'text-sm leading-relaxed italic',
                status === 'missing' ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {open || found.length <= 120
                  ? `"${found}"`
                  : `"${found.slice(0, 120)}…"`}
              </p>
              {found.length > 120 && (
                <button
                  onClick={() => setOpen(v => !v)}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  {open ? 'Show less' : 'Show more'}
                </button>
              )}
            </>
          ) : status === 'missing' ? (
            <p className="text-sm text-destructive/70 italic font-medium">Not found in your document.</p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Detected in document. Re-score to view the matched excerpt.</p>
          )}
          <MatchBar value={req.confidence} />
        </div>
      </div>
    </div>
  );
}

const ComplianceTable = ({ requirements = [], redFlags = [] }) => {
  if (requirements.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center bg-card border border-border">
        <FileSearch size={28} className="mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm font-semibold text-muted-foreground">Checking document…</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Results will appear shortly.</p>
      </div>
    );
  }

  const mandatory = requirements.filter(r => r.is_mandatory);
  const scored = requirements.filter(r => !r.is_mandatory);
  // Derive everything from confidence — stored detected/points_earned may be stale
  const mandatoryPassed = mandatory.filter(r => getStatus(r) === 'met').length;
  const totalPossible = scored.reduce((s, r) => s + (r.points_possible ?? 0), 0);
  const totalEarned = scored.reduce((s, r) => {
    const st = getStatus(r);
    const p = r.points_possible ?? 0;
    return s + (st === 'met' ? p : st === 'partial' ? Math.floor(p / 2) : 0);
  }, 0);

  return (
    <div className="space-y-6">

      {/* Mandatory */}
      {mandatory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-destructive" />
              <span className="text-xs font-black uppercase tracking-widest text-destructive">Mandatory Requirements</span>
            </div>
            <span className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-lg',
              mandatoryPassed === mandatory.length ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {mandatoryPassed}/{mandatory.length} passed
            </span>
          </div>
          <div className="space-y-3">
            {mandatory.map((req, i) => (
              <RequirementCard key={req.id || req.requirement_name} req={req} index={i} isMandatory />
            ))}
          </div>
        </div>
      )}

      {/* Scored */}
      {scored.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Scored Requirements</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
              {totalEarned}/{totalPossible} pts total
            </span>
          </div>
          <div className="space-y-3">
            {scored.map((req, i) => (
              <RequirementCard key={req.id || req.requirement_name} req={req} index={i} isMandatory={false} />
            ))}
          </div>
        </div>
      )}

      {/* Red flags */}
      {redFlags?.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-destructive/25 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border-b border-destructive/25">
            <AlertTriangle size={13} className="text-destructive" />
            <span className="text-xs font-black uppercase tracking-widest text-destructive">Red Flags</span>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-card text-destructive">{redFlags.length}</span>
          </div>
          <div className="divide-y divide-destructive/10">
            {redFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 bg-card">
                <XCircle size={13} className="shrink-0 mt-0.5 text-destructive" />
                <span className="text-sm text-foreground">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceTable;
