import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/features/tendering/services/api';
import {
  Mail, Building2, Clock, CheckCheck, Inbox,
  ChevronDown, ChevronUp, AlertCircle, KeyRound,
  RefreshCw, Send, Copy, Check, UserPlus, ShieldCheck, Loader2,
} from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';

const SUBJECT_TONES = {
  'Supplier Registration': 'text-primary bg-primary/10 border-primary/20',
  'Tender Enquiry': 'text-blue-600 bg-blue-50 border-blue-200',
  'Proposal Submission': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Evaluation & Results': 'text-amber-600 bg-amber-50 border-amber-200',
  'Technical Support': 'text-red-600 bg-red-50 border-red-200',
  'Other': 'text-muted-foreground bg-muted border-border',
};
const DEFAULT_TONE = SUBJECT_TONES['Other'];

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const all = upper + lower + digits + special;
  let pwd = upper[Math.floor(Math.random() * upper.length)]
    + lower[Math.floor(Math.random() * lower.length)]
    + digits[Math.floor(Math.random() * digits.length)]
    + special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 10; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

const buildMailto = (msg, password) => {
  const loginUrl = `${window.location.origin}/login`;
  const subject = `TenderRank — Your Portal Access Credentials`;
  const body = `Dear ${msg.name},

Thank you for reaching out to the National Procurement Commission (NPC).

We have reviewed your request and are pleased to grant you access to the TenderRank Portal as a Procurement Officer.

Your login credentials are below:

  Portal:            ${loginUrl}
  Email:             ${msg.email}
  Temporary Password: ${password}

IMPORTANT: For security reasons you will be asked to set a new password the first time you log in. Please do this immediately.

Once logged in you will be able to:
  • Create and publish tenders
  • Review supplier proposals
  • Access AI-powered evaluation results

If you have any questions do not hesitate to reply to this email.

Best regards,
NPC Administration
National Procurement Commission
Federal Government of Somalia`;

  return `mailto:${msg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/* ── Credentials panel ─────────────────────────────────────── */
const CredentialsPanel = ({ msg }) => {
  const [password, setPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  // 'idle' | 'creating' | 'created' | 'exists' | 'error'
  const [accountState, setAccountState] = useState('idle');
  const [accountError, setAccountError] = useState('');

  const canSendEmail = accountState === 'created' || accountState === 'exists';

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (accountState === 'created') return;
    setPassword(generatePassword());
    setAccountState('idle');
    setAccountError('');
  };

  const handleCreateAccount = async () => {
    if (!password.trim()) return;
    setAccountState('creating');
    setAccountError('');
    try {
      await apiService.createUser({
        name: msg.name,
        email: msg.email,
        password: password.trim(),
        role: 'admin',
      });
      setAccountState('created');
    } catch (err) {
      const msg2 = err.response?.data?.message || '';
      if (msg2.toLowerCase().includes('already')) {
        setAccountState('exists');
        setAccountError('An account with this email already exists.');
      } else {
        setAccountState('error');
        setAccountError(msg2 || 'Failed to create account. Try again.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className="mt-3 rounded-xl p-[18px] border border-primary/25 bg-gradient-to-br from-primary/10 to-blue-50"
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary mb-3">
        Grant Portal Access
      </p>

      <div className="flex items-center gap-2 mb-3.5 text-xs text-muted-foreground">
        <Mail size={12} className="text-primary shrink-0" />
        <span>To: <strong className="text-foreground">{msg.name}</strong> &lt;{msg.email}&gt;</span>
      </div>

      {/* ── STEP 1: Create account ── */}
      <div className={cn('mb-3.5 p-3.5 rounded-lg border transition-colors', canSendEmail ? 'bg-success/10 border-success/25' : 'bg-card/70 border-primary/15')}>

        <p className={cn('text-[10px] font-extrabold uppercase tracking-wider mb-2.5', canSendEmail ? 'text-success' : 'text-primary')}>
          {canSendEmail ? '✓ Step 1 — Account created' : 'Step 1 — Create Account'}
        </p>

        <div className="flex gap-1.5 mb-2">
          <div className={cn(
            'flex-1 flex items-center gap-2 rounded-lg border px-3 transition-colors',
            'border-primary/25 bg-card/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10',
            accountState === 'created' && 'opacity-70'
          )}>
            <KeyRound size={13} className="text-primary shrink-0" />
            <input
              value={password}
              readOnly={accountState === 'created'}
              onChange={e => { setPassword(e.target.value); setAccountState('idle'); }}
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-foreground py-2.5 font-mono tracking-wide"
              style={{ cursor: accountState === 'created' ? 'default' : 'text' }}
            />
          </div>
          <button onClick={handleRegenerate} title="Generate new password"
            disabled={accountState === 'created' || accountState === 'creating'}
            className="px-2.5 rounded-lg border border-primary/25 bg-card/70 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:pointer-events-none flex items-center">
            <RefreshCw size={13} />
          </button>
          <button onClick={handleCopy} title="Copy password"
            className={cn(
              'px-2.5 rounded-lg border transition-colors flex items-center',
              copied ? 'border-success/30 bg-success/15 text-success' : 'border-primary/25 bg-card/70 text-primary'
            )}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>

        {accountState === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-2">
            <AlertCircle size={12} /> {accountError}
          </div>
        )}

        {accountState === 'exists' && (
          <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 border border-warning/25 rounded-lg px-3 py-2 mb-2">
            <AlertCircle size={12} /> {accountError} You can still send the email with this password if you reset it manually.
          </div>
        )}

        {!canSendEmail && (
          <Button
            onClick={handleCreateAccount}
            disabled={!password.trim() || accountState === 'creating'}
            className="w-full"
          >
            {accountState === 'creating'
              ? <><Loader2 size={13} className="animate-spin" /> Creating…</>
              : <><UserPlus size={13} /> Create Procurement Officer Account</>}
          </Button>
        )}

        {accountState === 'created' && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-success/15 border border-success/25 rounded-lg text-xs font-bold text-success">
            <ShieldCheck size={14} /> Account created — {msg.email} can now log in.
          </div>
        )}
      </div>

      {/* ── STEP 2: Send email ── */}
      <div className={cn('p-3.5 rounded-lg border transition-opacity', canSendEmail ? 'bg-card/70 border-primary/15 opacity-100' : 'bg-card/40 border-primary/10 opacity-50')}>

        <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary mb-2.5">
          Step 2 — Send Credentials by Email
        </p>

        <div className="bg-card/70 border border-primary/15 rounded-lg px-3.5 py-2.5 mb-3 text-[11.5px] text-muted-foreground leading-relaxed font-mono">
          Email: <strong className="text-foreground">{msg.email}</strong><br />
          Temp Password: <strong className="text-primary">{password || '—'}</strong><br />
          First login → forced password change
        </div>

        <a
          href={canSendEmail ? buildMailto(msg, password.trim()) : undefined}
          onClick={e => { if (!canSendEmail) e.preventDefault(); }}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold no-underline transition-opacity',
            canSendEmail ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white hover:opacity-90 cursor-pointer' : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          <Send size={13} />
          {canSendEmail ? 'Open in Email Client' : 'Create account first ↑'}
        </a>
      </div>
    </motion.div>
  );
};

/* ── Message card ──────────────────────────────────────────── */
const MessageCard = ({ msg, onRead }) => {
  const [open, setOpen] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const tone = SUBJECT_TONES[msg.subject] || DEFAULT_TONE;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) setShowCreds(false);
    if (!msg.is_read && !open) onRead(msg.id);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card rounded-xl overflow-hidden border transition-shadow',
        open ? cn('shadow-md', tone.split(' ')[2]) : msg.is_read ? 'border-border shadow-sm' : 'border-primary/25 shadow-sm'
      )}>

      <button onClick={handleOpen} className="w-full flex items-center gap-3.5 px-[18px] py-3.5 bg-transparent border-none cursor-pointer text-left">
        <div className={cn('w-2 h-2 rounded-full shrink-0', msg.is_read ? 'border border-border' : 'bg-primary')} />

        <div className={cn('w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-[13px] font-extrabold border', tone)}>
          {msg.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('text-[13px] text-foreground', msg.is_read ? 'font-semibold' : 'font-bold')}>
              {msg.name}
            </span>
            {msg.company && (
              <span className="text-[11px] text-muted-foreground font-medium">· {msg.company}</span>
            )}
          </div>
          <p className={cn('text-xs m-0 whitespace-nowrap overflow-hidden text-ellipsis', msg.is_read ? 'text-muted-foreground font-normal' : 'text-foreground/70 font-medium')}>
            {msg.message.slice(0, 90)}{msg.message.length > 90 ? '…' : ''}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge className={tone}>{msg.subject}</Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={9} /> {timeAgo(msg.created_at)}
          </span>
        </div>

        {open ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className={cn('px-[18px] pb-[18px] border-t', tone.split(' ')[2])}>

              <div className="flex flex-wrap gap-3 py-3.5">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail size={12} className="text-primary" /> {msg.email}
                </span>
                {msg.company && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 size={12} className="text-primary" /> {msg.company}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={12} className="text-primary" />
                  {new Date(msg.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div className="bg-muted/40 rounded-lg px-4 py-3.5 text-[13.5px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </div>

              <div className="flex gap-2 mt-3.5 flex-wrap">
                <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                  className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg no-underline border transition-colors hover:brightness-95', tone)}>
                  <Mail size={12} /> Reply
                </a>

                <Button
                  size="sm"
                  variant={showCreds ? 'default' : 'secondary'}
                  onClick={() => setShowCreds(v => !v)}
                >
                  <KeyRound size={12} /> {showCreds ? 'Hide Credentials' : 'Send Credentials'}
                </Button>
              </div>

              <AnimatePresence>
                {showCreds && <CredentialsPanel key="creds" msg={msg} />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main page ─────────────────────────────────────────────── */
const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiService.getMessages()
      .then(res => { setMessages(res.data.messages || []); setUnread(res.data.unread || 0); })
      .catch(() => setError('Could not load messages.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    try {
      await apiService.markMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllMessagesRead();
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const visible = filter === 'unread' ? messages.filter(m => !m.is_read) : messages;

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1">Super Admin</p>
            <h1 className="text-[22px] font-extrabold text-foreground m-0 tracking-tight">
              Contact Messages
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Enquiries submitted via the public contact form.
            </p>
          </div>
          {unread > 0 && (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              <CheckCheck size={13} /> Mark all read
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { val: 'all', label: `All (${messages.length})` },
          { val: 'unread', label: `Unread (${unread})` },
        ].map(({ val, label }) => {
          const active = filter === val;
          return (
            <button key={val} onClick={() => setFilter(val)}
              className={cn(
                'text-xs font-bold px-4 py-1.5 rounded-lg border transition-colors',
                active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-muted-foreground border-border hover:bg-accent'
              )}>
              {label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl bg-card border border-border" />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2.5 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">
          <AlertCircle size={15} /> {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-[52px] h-[52px] rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3.5">
            <Inbox size={22} className="text-primary" />
          </div>
          <p className="font-bold text-foreground mb-1">
            {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {filter === 'unread' ? 'All caught up!' : 'Messages from the contact form will appear here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(msg => (
            <MessageCard key={msg.id} msg={msg} onRead={handleRead} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
