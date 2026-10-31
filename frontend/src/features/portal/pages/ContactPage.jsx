import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
import { apiService } from '@/features/tendering/services/api';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Textarea } from '@/shared/ui/tenderrank/textarea';
import { Label } from '@/shared/ui/tenderrank/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/tenderrank/select';
import { cn } from '@/shared/ui/tenderrank/utils';

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const FAQS = [
  { q: 'How do I register as a supplier?', a: 'Click "Get Started" in the navbar or visit the Supplier Portal. Fill in your company details, registration number, and upload any required certifications. Approval takes 1–2 business days.' },
  { q: 'Can international companies bid on tenders?', a: 'Most tenders are open to registered Somali businesses only. Some large infrastructure tenders allow international bidding — check the specific tender requirements.' },
  { q: 'How are proposals evaluated?', a: "Our AI system scores each proposal for compliance against the tender's requirements. Procurement officers then review the scores and confirm the final ranking before awarding the contract." },
  { q: 'How long does evaluation take?', a: 'Most tenders are evaluated and awarded within 72 hours of the submission deadline. Complex infrastructure projects may take up to 7 business days.' },
  { q: 'What document formats are accepted?', a: 'We accept PDF and Microsoft Word documents (.pdf, .doc, .docx). Maximum file size is 50MB per submission.' },
];

const CONTACT_METHODS = [
  { icon: Mail, label: 'Email', val: 'procurement@npc.gov.so', tone: 'bg-primary/10 text-primary' },
  { icon: Phone, label: 'Phone', val: '+252 61 234 5678', tone: 'bg-blue-50 text-blue-600' },
  { icon: MapPin, label: 'Address', val: 'Villa Somalia Complex, Mogadishu', tone: 'bg-emerald-50 text-emerald-600' },
];

const OFFICE_HOURS = [
  { day: 'Mon – Thu', hrs: '8:00 AM – 5:00 PM', open: true },
  { day: 'Friday', hrs: '8:00 AM – 12:30 PM', open: true },
  { day: 'Sat – Sun', hrs: 'Closed', open: false },
];

const SUBJECTS = [
  'Supplier Registration', 'Tender Enquiry', 'Proposal Submission',
  'Evaluation & Results', 'Technical Support', 'Other',
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [openFaq, setOpenFaq] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setSubmitError('');
    try {
      await apiService.submitContact(form);
      setStatus('success');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to send. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div className="bg-background min-h-screen">

      {/* ── Hero / Main section ── */}
      <section className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left — info */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-5">
                  <MessageSquare size={11} /> Get in Touch
                </div>

                <h1 className="text-4xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
                  Contact the<br />
                  <span className="text-primary">NPC Team</span>
                </h1>

                <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-[400px]">
                  Questions about a tender, submission process, or your application? Our team responds within 1 business day.
                </p>

                {/* Contact methods */}
                <div className="flex flex-col gap-3">
                  {CONTACT_METHODS.map(({ icon: Icon, label, val, tone }) => (
                    <div key={label} className="flex items-center gap-3.5 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', tone)}>
                        <Icon size={17} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-[13px] font-semibold text-foreground">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Office hours */}
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-[34px] h-[34px] rounded-lg bg-card flex items-center justify-center shadow-sm">
                      <Clock size={15} className="text-amber-600" />
                    </div>
                    <p className="text-[13px] font-bold text-foreground">Office Hours</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {OFFICE_HOURS.map(({ day, hrs, open }) => (
                      <div key={day} className="flex justify-between items-center py-1.5 border-b border-amber-200/50 last:border-0">
                        <span className="text-xs text-amber-900">{day}</span>
                        <span className={cn('text-xs font-bold', open ? 'text-amber-600' : 'text-amber-900/40')}>{hrs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right — form */}
            <FadeUp delay={0.08}>
              <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">

                <div className="px-7 py-5 bg-gradient-to-br from-primary/10 to-blue-100 border-b border-border">
                  <p className="text-[15px] font-bold text-foreground m-0">Send a message</p>
                  <p className="text-xs text-muted-foreground mt-1 m-0">We'll get back to you within 1 business day.</p>
                </div>

                <div className="px-7 py-6">
                  <AnimatePresence mode="wait">
                    {status === 'success' ? (
                      <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-10 text-center">
                        <div className="w-[60px] h-[60px] rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                          <CheckCircle2 size={26} className="text-emerald-600" />
                        </div>
                        <p className="text-base font-bold text-foreground mb-2">Message sent!</p>
                        <p className="text-[13px] text-muted-foreground max-w-[260px]">Our team will reply within 1 business day.</p>
                        <Button
                          variant="secondary"
                          className="mt-5"
                          onClick={() => { setStatus('idle'); setForm({ name: '', email: '', company: '', subject: '', message: '' }); }}
                        >
                          Send another →
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name *</Label>
                            <Input name="name" required value={form.name} onChange={handleChange} placeholder="Your name" />
                          </div>
                          <div>
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email *</Label>
                            <Input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@company.so" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Company / Organization</Label>
                          <Input name="company" value={form.company} onChange={handleChange} placeholder="Your company name" />
                        </div>
                        <div>
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Subject *</Label>
                          <Select value={form.subject} onValueChange={(v) => setForm(f => ({ ...f, subject: v }))} required>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a subject…" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Message *</Label>
                          <Textarea name="message" required rows={4} value={form.message} onChange={handleChange} placeholder="Describe your enquiry…" className="resize-y" />
                        </div>
                        {submitError && (
                          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium px-3.5 py-2.5 rounded-lg">
                            {submitError}
                          </div>
                        )}
                        <Button type="submit" disabled={status === 'sending'} size="lg" className="w-full">
                          {status === 'sending'
                            ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                            : <><Send size={14} /> Send Message</>}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FadeUp className="text-center mb-10">
          <span className="inline-block text-[11px] font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full mb-4">FAQ</span>
          <h2 className="text-[30px] font-extrabold text-foreground tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">Everything you need to know about the procurement process.</p>
        </FadeUp>

        <div className="flex flex-col gap-2.5">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = openFaq === i;
            return (
              <FadeUp key={i} delay={i * 0.04}>
                <div className={cn(
                  'bg-card rounded-xl overflow-hidden border transition-shadow',
                  isOpen ? 'border-primary/30 shadow-md' : 'border-border'
                )}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center gap-3.5 px-5 py-4 bg-transparent border-none cursor-pointer text-left"
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-extrabold transition-colors',
                      isOpen ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    )}>
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-foreground">{q}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className={isOpen ? 'text-primary' : 'text-muted-foreground'} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-5 pb-[18px] pl-[62px] border-t border-border">
                          <p className="text-[13.5px] leading-relaxed text-muted-foreground mt-3.5">{a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
