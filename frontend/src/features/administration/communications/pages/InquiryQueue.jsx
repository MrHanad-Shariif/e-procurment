import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Mail, Globe, Clock, CheckCircle2, XCircle,
  FileSearch, ShieldCheck, ShieldX, ShieldAlert, ShieldQuestion,
  ChevronDown, ChevronUp, Copy, Check, RefreshCw,
  Server, Lock, AtSign, AlertTriangle, ExternalLink, Minus,
} from 'lucide-react';
import { apiService } from '@/features/tendering/services/api';
import { Button } from '@/shared/ui/tenderrank/button';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';
import { toast } from 'sonner';

// ─── Verify badge ─────────────────────────────────────────────────────────────

// Tri-state on purpose: null means the verifier could not run that check, which
// is not the same as the check failing. Grey = "unknown", red = "failed".
const VerifyBadge = ({ ok, pending, label, title }) => {
  if (pending) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />{label}
    </span>
  );
  const unknown = ok === null || ok === undefined;
  return (
    <span
      title={title || (unknown ? `${label}: not checked` : `${label}: ${ok ? 'passed' : 'failed'}`)}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
        unknown ? 'bg-muted text-muted-foreground'
          : ok ? 'bg-success/15 text-success'
            : 'bg-destructive/15 text-destructive'
      )}
    >
      {unknown ? <Minus size={9} /> : ok ? <Check size={9} /> : <XCircle size={9} />}
      {label}
    </span>
  );
};

// ─── Verdict ──────────────────────────────────────────────────────────────────

const VERDICT = {
  likely_genuine: {
    label: 'Likely Genuine', Icon: ShieldCheck,
    text: 'text-success', bg: 'bg-success/10', border: 'border-success/25', bar: 'bg-success',
    blurb: 'Checks link this applicant to a live domain they appear to own.',
  },
  needs_review: {
    label: 'Needs Review', Icon: ShieldAlert,
    text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/25', bar: 'bg-warning',
    blurb: 'Some evidence is missing or weak — confirm independently before approving.',
  },
  suspicious: {
    label: 'Suspicious', Icon: ShieldX,
    text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/25', bar: 'bg-destructive',
    blurb: 'Could not tie this company to a live domain of its own.',
  },
  unknown: {
    label: 'Not Verified', Icon: ShieldQuestion,
    text: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border', bar: 'bg-muted-foreground/40',
    blurb: 'No verification result recorded for this application.',
  },
};

const verdictOf = (inq) => VERDICT[inq?.verdict] || VERDICT.unknown;

const VerdictBanner = ({ inquiry }) => {
  const v = verdictOf(inquiry);
  const score = typeof inquiry.confidence === 'number' ? inquiry.confidence : null;
  return (
    <div className={cn('mx-5 mb-3 rounded-xl border px-3.5 py-3', v.bg, v.border)}>
      <div className="flex items-center gap-2.5">
        <v.Icon size={16} className={cn('shrink-0', v.text)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn('text-xs font-bold', v.text)}>{v.label}</span>
            {score !== null && (
              <span className="text-[10px] font-mono text-muted-foreground">
                confidence {score}/100
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{v.blurb}</p>
        </div>
      </div>
      {score !== null && (
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-background/70 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('h-full rounded-full', v.bar)}
          />
        </div>
      )}
    </div>
  );
};

// ─── Detail helpers ───────────────────────────────────────────────────────────

const DetailBlock = ({ icon: Icon, title, children }) => (
  <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
      <Icon size={10} />{title}
    </p>
    <div className="mt-1.5 space-y-1 text-xs text-foreground">{children}</div>
  </div>
);

const Row = ({ k, v }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground shrink-0">{k}</span>
    <span className="font-medium break-all text-right ml-auto">{v}</span>
  </div>
);

const MATCH_SOURCE_COPY = {
  website: 'Company name found on the live website — strongest evidence.',
  document: 'Company name matches the uploaded document only.',
  domain: 'Company name matches the domain string only — weak evidence.',
  none: 'Company name was not found in the document, domain, or website.',
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS = {
  pending:  { label: 'Pending Review', bg: 'bg-warning/15', text: 'text-warning' },
  approved: { label: 'Approved',       bg: 'bg-success/15', text: 'text-success' },
  rejected: { label: 'Rejected',       bg: 'bg-destructive/15', text: 'text-destructive' },
};

// ─── Credentials dialog ───────────────────────────────────────────────────────

const CredentialsDialog = ({ creds, emailSent, onClose }) => {
  const [copied, setCopied] = useState('');
  const copy = (field, val) => {
    navigator.clipboard.writeText(val);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
            <ShieldCheck size={18} className="text-success" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Account Created</h2>
            <p className="text-xs text-muted-foreground">
              {emailSent
                ? 'Credentials have been emailed to the applicant.'
                : 'Email could not be sent — share credentials manually.'}
            </p>
          </div>
        </div>

        {/* Email status banner */}
        <div className={cn(
          'rounded-lg px-3 py-2 flex items-center gap-2',
          emailSent
            ? 'bg-success/10 border border-success/20'
            : 'bg-warning/10 border border-warning/20'
        )}>
          {emailSent
            ? <CheckCircle2 size={13} className="text-success shrink-0" />
            : <Mail size={13} className="text-warning shrink-0" />}
          <p className={cn('text-xs font-medium', emailSent ? 'text-success' : 'text-warning')}>
            {emailSent
              ? `Approval email with credentials sent to ${creds.email}`
              : 'Email delivery failed — copy and send the credentials below manually'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border overflow-hidden">
          {[
            { label: 'Email', key: 'email', value: creds.email },
            { label: 'Temporary Password', key: 'password', value: creds.temporary_password },
          ].map(({ label, key, value }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="text-sm font-mono font-medium text-foreground truncate">{value}</p>
              </div>
              <button
                onClick={() => copy(key, value)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                {copied === key ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
          <p className="text-xs text-warning font-medium">
            The applicant must change their password on first login.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">Done</Button>
      </motion.div>
    </div>
  );
};

// ─── Reject dialog ────────────────────────────────────────────────────────────

const RejectDialog = ({ inquiry, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
            <ShieldX size={18} className="text-destructive" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Reject Application</h2>
            <p className="text-xs text-muted-foreground">{inquiry.company_name}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Could not verify company domain, duplicate application…"
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Rejecting…' : 'Reject'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Approve guard ────────────────────────────────────────────────────────────

// The scoring exists to stop a fraudulent application riding through on a
// healthy third-party domain. Make the admin acknowledge that before approving.
const ApproveGuardDialog = ({ inquiry, onConfirm, onClose }) => {
  const [loading, setLoading] = useState(false);
  const v = verdictOf(inquiry);
  const detail = inquiry.verification_detail || {};
  const reasons = (detail.score_reasons || []).filter(r => !r.includes('(+'));

  const confirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', v.bg)}>
            <AlertTriangle size={18} className={v.text} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-foreground">Approve despite verification?</h2>
            <p className="text-xs text-muted-foreground truncate">{inquiry.company_name}</p>
          </div>
        </div>

        <div className={cn('rounded-xl border px-3.5 py-3', v.bg, v.border)}>
          <p className={cn('text-xs font-bold', v.text)}>
            {v.label}
            {typeof inquiry.confidence === 'number' && ` · ${inquiry.confidence}/100`}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{v.blurb}</p>
          {reasons.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {reasons.map((r, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                  <span className="text-destructive">·</span>{r}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Approving creates a procurement officer account and emails login credentials.
          Only continue if you have confirmed this company through another channel.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={confirm} disabled={loading} className="flex-1">
            {loading ? 'Approving…' : 'Approve anyway'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Inquiry card ─────────────────────────────────────────────────────────────

const InquiryCard = ({ inquiry, onApprove, onReject, onReverify }) => {
  const [open, setOpen] = useState(false);
  const [reverifying, setReverifying] = useState(false);
  const verifying = inquiry.dns_ok === null
    && inquiry.verification_detail == null
    && inquiry.status === 'pending';
  const s = STATUS[inquiry.status] || STATUS.pending;

  const detail = inquiry.verification_detail || {};
  const dns = detail.dns || {};
  const http = detail.http || {};
  const tls = detail.tls || {};
  const nameMatch = detail.name_match || {};
  const positives = (detail.score_reasons || []).filter(r => r.includes('(+'));
  const negatives = (detail.score_reasons || []).filter(r => !r.includes('(+'));

  const runReverify = async () => {
    setReverifying(true);
    await onReverify(inquiry);
    setReverifying(false);
  };

  return (
    <div className={cn(
      'rounded-2xl border bg-card shadow-sm overflow-hidden',
      inquiry.status === 'approved' ? 'border-success/25' :
      inquiry.status === 'rejected' ? 'border-destructive/20' : 'border-border'
    )}>
      {/* Header */}
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{inquiry.company_name}</h3>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.bg, s.text)}>
              {s.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail size={10} />{inquiry.email}
            </span>
            {inquiry.website && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe size={10} />{inquiry.website}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contact: {inquiry.contact_name} · {new Date(inquiry.created_at).toLocaleDateString()}
          </p>
        </div>

        <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Verdict + confidence */}
      {!verifying && <VerdictBanner inquiry={inquiry} />}

      {/* Verification badges */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        <VerifyBadge ok={inquiry.dns_ok} pending={verifying} label="DNS"
          title={dns.ips?.length ? `Resolves to ${dns.ips.join(', ')}` : undefined} />
        <VerifyBadge ok={dns.mx_ok} pending={verifying} label="Mail"
          title={dns.mx?.length ? `MX: ${dns.mx.join(', ')}` : 'No MX records'} />
        <VerifyBadge ok={inquiry.http_ok} pending={verifying} label="Live"
          title={http.status ? `HTTP ${http.status}` : undefined} />
        <VerifyBadge ok={tls.ok} pending={verifying} label="TLS"
          title={tls.issuer ? `Issued by ${tls.issuer}` : tls.error} />
        <VerifyBadge ok={inquiry.content_ok} pending={verifying} label="Name Match"
          title={MATCH_SOURCE_COPY[nameMatch.match_source]} />
        {http.parked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive">
            <AlertTriangle size={9} />Parked
          </span>
        )}
        {verifying && <span className="text-[10px] text-muted-foreground italic">Verifying…</span>}
      </div>

      {/* Extracted info row */}
      {!verifying && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Name in Form</p>
            <p className="text-xs font-semibold text-foreground">{inquiry.company_name}</p>
          </div>
          <div className={cn(
            'rounded-lg border px-3 py-2 space-y-0.5',
            inquiry.content_ok ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
          )}>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Name in Document</p>
            <p className={cn('text-xs font-semibold', inquiry.content_ok ? 'text-success' : 'text-destructive')}>
              {inquiry.extracted_company || '—'}
            </p>
          </div>
          {inquiry.extracted_domain && (
            <div className="col-span-2 rounded-lg bg-muted/50 border border-border px-3 py-2 flex items-center gap-2">
              <Globe size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground">Domain detected:</span>
              <span className="text-[10px] font-mono font-semibold text-foreground">{inquiry.extracted_domain}</span>
            </div>
          )}
        </div>
      )}

      {/* Expandable detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-5 py-4 space-y-3 bg-muted/30">
              {/* Why this score */}
              {(positives.length > 0 || negatives.length > 0) && (
                <DetailBlock icon={ShieldCheck} title="How this score was reached">
                  {positives.map((r, i) => (
                    <p key={`p${i}`} className="flex gap-1.5 text-success">
                      <Check size={11} className="mt-0.5 shrink-0" />
                      <span className="text-foreground">{r}</span>
                    </p>
                  ))}
                  {negatives.map((r, i) => (
                    <p key={`n${i}`} className="flex gap-1.5 text-destructive">
                      <XCircle size={11} className="mt-0.5 shrink-0" />
                      <span className="text-foreground">{r}</span>
                    </p>
                  ))}
                </DetailBlock>
              )}

              {/* Identity */}
              <DetailBlock icon={Building2} title="Identity match">
                <Row k="Name on form" v={inquiry.company_name} />
                <Row k="Name in document" v={inquiry.extracted_company || '—'} />
                {nameMatch.page_title && <Row k="Website title" v={nameMatch.page_title} />}
                {nameMatch.match_source && (
                  <p className={cn(
                    'mt-1 text-[11px] leading-snug',
                    nameMatch.match_source === 'none' ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {MATCH_SOURCE_COPY[nameMatch.match_source]}
                  </p>
                )}
              </DetailBlock>

              {/* Domain evidence */}
              {(inquiry.extracted_domain || detail.candidates?.length > 0) && (
                <DetailBlock icon={Globe} title="Domain evidence">
                  <Row k="Selected" v={inquiry.extracted_domain || '—'} />
                  {detail.emails?.length > 0 && (
                    <Row k="Emails in document" v={detail.emails.join(', ')} />
                  )}
                  {detail.email_domain_matches && (
                    <p className="flex gap-1.5 text-[11px] text-success">
                      <AtSign size={10} className="mt-0.5 shrink-0" />
                      Contact email is on the same domain as the website.
                    </p>
                  )}
                  {detail.candidates?.length > 1 && (
                    <Row k="Also considered"
                      v={detail.candidates.slice(1).map(c => c.domain).join(', ')} />
                  )}
                  {detail.harvest?.blocked?.length > 0 && (
                    <Row k="Ignored" v={detail.harvest.blocked.join(', ')} />
                  )}
                  {detail.form_domain_conflict && (
                    <p className="flex gap-1.5 text-[11px] text-warning">
                      <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                      The website typed on the form ({detail.form_domain}) differs from the one in the document.
                    </p>
                  )}
                </DetailBlock>
              )}

              {/* Live site */}
              {http.checked !== false && (http.status || http.attempts?.length > 0) && (
                <DetailBlock icon={Server} title="Live site">
                  <Row k="Status" v={http.status ? `HTTP ${http.status}` : 'No response'} />
                  {http.final_url && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">Final URL</span>
                      <a href={http.final_url} target="_blank" rel="noreferrer noopener"
                        className="ml-auto text-right font-medium break-all text-primary hover:underline inline-flex items-center gap-1">
                        {http.final_url}<ExternalLink size={9} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {http.elapsed_ms != null && <Row k="Response time" v={`${http.elapsed_ms} ms`} />}
                  {http.server && <Row k="Server" v={http.server} />}
                  {http.parked && (
                    <p className="flex gap-1.5 text-[11px] text-destructive">
                      <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                      Looks like a placeholder page — {http.parked_reason}.
                    </p>
                  )}
                </DetailBlock>
              )}

              {http.checked === false && (
                <div className="rounded-lg bg-muted border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Liveness was not checked — {http.reason}. This is a server configuration
                    issue, not a problem with the applicant.
                  </p>
                </div>
              )}

              {/* TLS */}
              {(tls.ok || tls.error) && (
                <DetailBlock icon={Lock} title="TLS certificate">
                  {tls.ok ? (
                    <>
                      <Row k="Issuer" v={tls.issuer || '—'} />
                      {tls.days_left != null && (
                        <Row k="Expires in" v={`${tls.days_left} days`} />
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">No valid certificate: {tls.error}</p>
                  )}
                </DetailBlock>
              )}

              {detail.error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-xs text-destructive">{detail.error}</p>
                </div>
              )}

              {inquiry.rejection_reason && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rejection reason</p>
                  <p className="text-sm text-foreground mt-0.5">{inquiry.rejection_reason}</p>
                </div>
              )}
              {inquiry.reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  Reviewed: {new Date(inquiry.reviewed_at).toLocaleString()}
                </p>
              )}

              {inquiry.profile_path && (
                <Button variant="outline" size="sm" onClick={runReverify} disabled={reverifying}>
                  <RefreshCw size={12} className={cn(reverifying && 'animate-spin')} />
                  {reverifying ? 'Re-checking…' : 'Re-run verification'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {inquiry.status === 'pending' && (
        <div className="flex gap-3 px-5 py-4 border-t border-border bg-card">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => onReject(inquiry)}
          >
            <XCircle size={13} /> Reject
          </Button>
          <Button
            size="sm"
            variant={inquiry.verdict === 'likely_genuine' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onApprove(inquiry)}
          >
            <CheckCircle2 size={13} /> Approve & Create Account
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTERS = ['all', 'pending', 'approved', 'rejected'];
const VERDICT_FILTERS = ['all', 'suspicious', 'needs_review', 'likely_genuine', 'unknown'];

const InquiryQueue = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getInquiries();
      setInquiries(res.data);
    } catch {
      toast.error('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doApprove = async (inq) => {
    try {
      const res = await apiService.approveInquiry(inq.id);
      setCredentials({ ...res.data.credentials, emailSent: res.data.email_sent });
      setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: 'approved', reviewed_at: new Date().toISOString() } : i));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve inquiry.');
    } finally {
      setApproveTarget(null);
    }
  };

  // Anything the verifier did not clear goes through an explicit confirmation.
  const handleApprove = (inq) => {
    if (inq.verdict === 'likely_genuine') doApprove(inq);
    else setApproveTarget(inq);
  };

  const handleReverify = async (inq) => {
    try {
      const res = await apiService.reverifyInquiry(inq.id);
      const updated = res.data.inquiry;
      setInquiries(prev => prev.map(i => i.id === inq.id ? updated : i));
      toast.success(`Re-checked — ${(VERDICT[updated.verdict] || VERDICT.unknown).label.toLowerCase()}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to re-run verification.');
    }
  };

  const handleRejectConfirm = async (reason) => {
    const inq = rejectTarget;
    try {
      await apiService.rejectInquiry(inq.id, reason);
      toast.success('Inquiry rejected.');
      setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() } : i));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject inquiry.');
    } finally {
      setRejectTarget(null);
    }
  };

  const byStatus = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);
  const visible = verdictFilter === 'all'
    ? byStatus
    : byStatus.filter(i => (i.verdict || 'unknown') === verdictFilter);

  const counts = { all: inquiries.length, pending: 0, approved: 0, rejected: 0 };
  inquiries.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  const verdictCounts = { all: byStatus.length, likely_genuine: 0, needs_review: 0, suspicious: 0, unknown: 0 };
  byStatus.forEach(i => { verdictCounts[i.verdict || 'unknown']++; });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Procurement Inquiries</h1>
          <p className="text-sm text-muted-foreground">Review company applications and grant portal access.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={cn(loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={cn(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black',
              filter === f ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
            )}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Verdict filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">
          Verification
        </span>
        {VERDICT_FILTERS.map(f => {
          const v = f === 'all' ? null : VERDICT[f];
          const active = verdictFilter === f;
          return (
            <button
              key={f}
              onClick={() => setVerdictFilter(f)}
              disabled={f !== 'all' && verdictCounts[f] === 0}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1.5',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {v && <v.Icon size={11} className={active ? undefined : v.text} />}
              {v ? v.label : 'All'}
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[9px] font-black',
                active ? 'bg-background/20' : 'bg-background text-foreground'
              )}>
                {verdictCounts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileSearch size={28} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">
            {verdictFilter === 'all'
              ? `No ${filter === 'all' ? '' : filter} inquiries yet`
              : `No ${filter === 'all' ? '' : filter} inquiries marked “${(VERDICT[verdictFilter] || VERDICT.unknown).label}”`}
          </p>
          {verdictFilter !== 'all' && (
            <button
              onClick={() => setVerdictFilter('all')}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              Clear verification filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map(inq => (
              <motion.div
                key={inq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <InquiryCard
                  inquiry={inq}
                  onApprove={handleApprove}
                  onReject={setRejectTarget}
                  onReverify={handleReverify}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialogs */}
      {credentials && (
        <CredentialsDialog
          creds={credentials}
          emailSent={credentials.emailSent}
          onClose={() => setCredentials(null)}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          inquiry={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {approveTarget && (
        <ApproveGuardDialog
          inquiry={approveTarget}
          onConfirm={() => doApprove(approveTarget)}
          onClose={() => setApproveTarget(null)}
        />
      )}
    </div>
  );
};

export default InquiryQueue;
