import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Mail, User, Upload, FileText, CheckCircle2, ArrowRight, AlertCircle, X } from 'lucide-react';
import { apiService } from '@/features/tendering/services/api';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { cn } from '@/shared/ui/tenderrank/utils';

const Field = ({ label, icon: Icon, error, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
      {Icon && <Icon size={12} className="text-muted-foreground" />}
      {label}
    </label>
    {children}
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

const Apply = () => {
  const [form, setForm] = useState({ contact_name: '', email: '', company_name: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const fileRef = useRef();

  // Clear the error for a field as soon as the user starts correcting it
  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.contact_name.trim()) e.contact_name = 'Contact name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.company_name.trim()) e.company_name = 'Company name is required.';
    return e;
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowed.includes(f.type) && !/\.(pdf|docx|doc)$/i.test(f.name)) {
      setErrors(prev => ({ ...prev, file: 'Only PDF or Word documents are accepted.' }));
      return;
    }
    setErrors(prev => { const n = { ...prev }; delete n.file; return n; });
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('contact_name', form.contact_name.trim());
      fd.append('email', form.email.trim());
      fd.append('company_name', form.company_name.trim());
      if (file) fd.append('profile', file);

      await apiService.submitInquiry(fd);
      setSubmitted(true);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-success" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Application Submitted</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thank you, <span className="font-semibold text-foreground">{form.contact_name}</span>.
              We've received your application for <span className="font-semibold text-foreground">{form.company_name}</span>.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our team will verify your company details and reach out to{' '}
              <span className="font-semibold text-foreground">{form.email}</span> with your credentials
              if approved.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">What happens next</p>
            {[
              'We verify your company domain and website',
              'Our team reviews your company profile document',
              'If approved, you receive login credentials by email',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-[10px] font-black w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-xs text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Building2 size={12} /> Procurement Officer Application
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Apply to list tenders</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Companies with a verified domain can become procurement officers on TenderRank.
              Submit your details below and we'll review your application.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contact Information</p>

              <Field label="Full Name" icon={User} error={errors.contact_name}>
                <Input
                  placeholder="Jane Doe"
                  value={form.contact_name}
                  onChange={set('contact_name')}
                  className={cn(errors.contact_name && 'border-destructive')}
                />
              </Field>

              <Field label="Work Email" icon={Mail} error={errors.email}>
                <Input
                  type="email"
                  placeholder="jane@yourcompany.com"
                  value={form.email}
                  onChange={set('email')}
                  className={cn(errors.email && 'border-destructive')}
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Company Details</p>

              <Field label="Company Name" icon={Building2} error={errors.company_name}>
                <Input
                  placeholder="Acme Corporation Ltd."
                  value={form.company_name}
                  onChange={set('company_name')}
                  className={cn(errors.company_name && 'border-destructive')}
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Company Profile Document</p>
              <p className="text-xs text-muted-foreground">
                Upload your company profile (PDF or Word). This helps us verify your organisation. Max 50MB.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={handleFile}
              />

              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
                  <FileText size={16} className="text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); fileRef.current.value = ''; }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className={cn(
                    'w-full rounded-xl border-2 border-dashed px-6 py-8 flex flex-col items-center gap-2 transition-colors',
                    errors.file ? 'border-destructive bg-destructive/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  <Upload size={22} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Click to upload</span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, or DOC</span>
                </button>
              )}
              {errors.file && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.file}
                </p>
              )}
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-2"
                >
                  <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Submitting…
                </>
              ) : (
                <>Submit Application <ArrowRight size={15} /></>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Apply;
