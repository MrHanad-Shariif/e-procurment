import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '@/features/tendering/services/api';
import {
  Building2, MapPin, Phone, Globe, Hash, Mail, User,
  Save, CheckCircle2, AlertTriangle, ArrowRight, Clock,
  Eye, Briefcase, Flag, Map, FileText, Layers, Edit2, X, Loader2,
} from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Textarea } from '@/shared/ui/tenderrank/textarea';
import { Label } from '@/shared/ui/tenderrank/label';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/tenderrank/select';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';

const COMPANY_TYPES = [
  'Sole Proprietorship', 'Partnership', 'Limited Liability Company (LLC)',
  'Corporation', 'Non-Governmental Organization (NGO)', 'Cooperative',
  'Joint Venture', 'Other',
];

const Field = ({ icon: Icon, label, required, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {label}{required && <span className="text-destructive"> *</span>}
    </Label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />}
      {children}
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary/10">
        <Icon size={13} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground/85">{value}</p>
      </div>
    </div>
  );
};

const REQUIRED = ['company_name', 'registration_number', 'company_type', 'country', 'city', 'address', 'phone', 'contact_person'];

const EMPTY_FORM = {
  name: '', company_name: '', company_type: '', registration_number: '',
  country: '', city: '', address: '', phone: '', contact_person: '',
  business_description: '', main_services: '', industry: '', website: '',
};

const PROPOSAL_BADGE_VARIANT = { approved: 'success', rejected: 'destructive', under_review: 'warning' };
const PROPOSAL_BADGE_LABEL = { approved: 'Approved', rejected: 'Rejected', under_review: 'Review' };

const SupplierProfile = () => {
  const [profile, setProfile] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([apiService.getProfile(), apiService.getProposals()])
      .then(([pRes, prRes]) => {
        const p = pRes.data;
        setProfile(p);
        setForm({
          name: p.name || '',
          company_name: p.company_name || '',
          company_type: p.company_type || '',
          registration_number: p.registration_number || '',
          country: p.country || '',
          city: p.city || '',
          address: p.address || '',
          phone: p.phone || '',
          contact_person: p.contact_person || '',
          business_description: p.business_description || '',
          main_services: p.main_services || '',
          industry: p.industry || '',
          website: p.website || '',
        });
        const profileIncomplete = REQUIRED.some(f => !p[f]?.trim());
        setEditing(profileIncomplete);
        setProposals(prRes.data);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setVal = k => v => setForm(f => ({ ...f, [k]: v }));

  const completedCount = REQUIRED.filter(f => form[f]?.trim()).length;
  const completionPct = Math.round((completedCount / REQUIRED.length) * 100);
  const completionTone = completionPct === 100 ? 'text-success' : completionPct >= 60 ? 'text-warning' : 'text-destructive';
  const completionBar = completionPct === 100 ? 'bg-success' : completionPct >= 60 ? 'bg-warning' : 'bg-destructive';
  const isComplete = completionPct === 100;

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await apiService.updateProfile(form);
      const savedProfile = res.data;
      setProfile(savedProfile);
      setForm({
        name: savedProfile.name || '',
        company_name: savedProfile.company_name || '',
        company_type: savedProfile.company_type || '',
        registration_number: savedProfile.registration_number || '',
        country: savedProfile.country || '',
        city: savedProfile.city || '',
        address: savedProfile.address || '',
        phone: savedProfile.phone || '',
        contact_person: savedProfile.contact_person || '',
        business_description: savedProfile.business_description || '',
        main_services: savedProfile.main_services || '',
        industry: savedProfile.industry || '',
        website: savedProfile.website || '',
      });
      const stored = localStorage.getItem('user');
      if (stored) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), name: savedProfile.name }));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-5xl">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {isComplete ? 'Your profile is complete.' : 'Complete your profile to submit proposals.'}
          </p>
        </div>
        {!editing && profile?.company_name && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Edit2 size={13} /> Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-destructive" />
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <CheckCircle2 size={15} className="text-success" />
          <p className="text-sm font-semibold text-success">Profile saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* ── VIEW MODE ── */}
          {!editing && (
            <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
              <div className="px-6 py-5 bg-muted/40 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{profile?.company_name || 'Your Company'}</h2>
                    {profile?.company_type && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg mt-1 inline-block bg-primary/10 text-primary">
                        {profile.company_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-2">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">Company Information</p>
                <InfoRow icon={Hash} label="Registration Number" value={profile?.registration_number} />
                <InfoRow icon={Layers} label="Industry" value={profile?.industry} />
                <InfoRow icon={Globe} label="Website" value={profile?.website} />

                <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">Location</p>
                <InfoRow icon={Flag} label="Country" value={profile?.country} />
                <InfoRow icon={Map} label="City" value={profile?.city} />
                <InfoRow icon={MapPin} label="Office Address" value={profile?.address} />

                <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">Contact</p>
                <InfoRow icon={User} label="Contact Person" value={profile?.contact_person} />
                <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
                <InfoRow icon={Mail} label="Email" value={profile?.email} />

                {(profile?.business_description || profile?.main_services) && (
                  <>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">About</p>
                    {profile?.business_description && (
                      <div className="py-3 border-b border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Business Description</p>
                        <p className="text-sm leading-relaxed text-foreground/85">{profile.business_description}</p>
                      </div>
                    )}
                    {profile?.main_services && (
                      <div className="py-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Main Services</p>
                        <p className="text-sm leading-relaxed text-foreground/85">{profile.main_services}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="py-4" />
              </div>

              {!isComplete && (
                <div className="mx-6 mb-5 px-4 py-3 rounded-xl flex items-center gap-3 bg-warning/10 border border-warning/25">
                  <AlertTriangle size={13} className="text-warning" />
                  <p className="text-xs font-semibold text-warning">
                    Profile incomplete — fill all required fields to submit proposals.
                  </p>
                  <button onClick={() => setEditing(true)} className="ml-auto text-xs font-bold shrink-0 text-warning">Complete now</button>
                </div>
              )}
            </div>
          )}

          {/* ── EDIT MODE ── */}
          {editing && (
            <>
              <div className="rounded-xl p-5 bg-card border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Profile Completeness</p>
                  <span className={cn('text-sm font-bold', completionTone)}>{completionPct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <div className={cn('h-full rounded-full transition-all duration-700', completionBar)} style={{ width: `${completionPct}%` }} />
                </div>
              </div>

              <form onSubmit={handleSave} className="rounded-xl p-6 space-y-6 bg-card border border-border shadow-sm">

                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-foreground">Edit Profile</p>
                  {profile?.company_name && (
                    <button type="button" onClick={() => setEditing(false)}
                      className="p-1.5 rounded-lg text-muted-foreground bg-muted transition-colors hover:bg-accent">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Company Information</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={Building2} label="Company Name" required>
                        <Input className="pl-10" value={form.company_name} onChange={set('company_name')} placeholder="Acme Suppliers Ltd." />
                      </Field>
                      <Field icon={Hash} label="Registration Number" required>
                        <Input className="pl-10" value={form.registration_number} onChange={set('registration_number')} placeholder="e.g. 2024/001234/07" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Company Type" required>
                        <Select value={form.company_type} onValueChange={setVal('company_type')}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type…" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field icon={Layers} label="Industry">
                        <Input className="pl-10" value={form.industry} onChange={set('industry')} placeholder="e.g. Healthcare, ICT" />
                      </Field>
                    </div>
                    <Field icon={Globe} label="Website">
                      <Input className="pl-10" type="url" value={form.website} onChange={set('website')} placeholder="https://yourcompany.com" />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Location</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={Flag} label="Country" required>
                        <Input className="pl-10" value={form.country} onChange={set('country')} placeholder="Somalia" />
                      </Field>
                      <Field icon={Map} label="City" required>
                        <Input className="pl-10" value={form.city} onChange={set('city')} placeholder="Mogadishu" />
                      </Field>
                    </div>
                    <Field icon={MapPin} label="Office Address" required>
                      <Textarea rows={2} value={form.address} onChange={set('address')}
                        placeholder="Street, District, City" className="resize-none pl-10" />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field icon={User} label="Contact Person" required>
                      <Input className="pl-10" value={form.contact_person} onChange={set('contact_person')} placeholder="Jane Smith" />
                    </Field>
                    <Field icon={Phone} label="Phone Number" required>
                      <Input className="pl-10" type="tel" value={form.phone} onChange={set('phone')} placeholder="+252 61 000 0000" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                        <Mail size={11} /> Email Address
                      </Label>
                      <Input value={profile?.email || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
                      <p className="text-xs mt-1 text-muted-foreground/60">Email address cannot be changed.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">About the Company</p>
                  <div className="space-y-4">
                    <Field icon={FileText} label="Business Description">
                      <Textarea rows={3} value={form.business_description} onChange={set('business_description')}
                        placeholder="Brief description of what your company does…" className="resize-none pl-10" />
                    </Field>
                    <Field icon={Layers} label="Main Services / Products">
                      <Textarea rows={3} value={form.main_services} onChange={set('main_services')}
                        placeholder="List your main services or products…" className="resize-none pl-10" />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-border pt-2 flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><Save size={14} /> Save Profile</>}
                  </Button>
                  {profile?.company_name && (
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* Right: activity */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 bg-card border border-primary/20 shadow-sm">
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.12em] mb-4">My Activity</p>
            <div>
              <p className="text-3xl font-extrabold text-foreground">{proposals.length}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">Total Proposals Submitted</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-border">
              {[
                { label: 'Review', count: proposals.filter(p => p.status === 'under_review').length, tone: 'text-warning' },
                { label: 'Approved', count: proposals.filter(p => p.status === 'approved').length, tone: 'text-success' },
                { label: 'Rejected', count: proposals.filter(p => p.status === 'rejected').length, tone: 'text-destructive' },
              ].map(({ label, count, tone }) => (
                <div key={label} className="text-center">
                  <p className={cn('text-xl font-bold', tone)}>{count}</p>
                  <p className="text-[9px] mt-0.5 text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-sm text-foreground">Recent Submissions</h3>
            </div>
            {proposals.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
                <Link to="/supplier/tenders" className="text-xs font-semibold mt-1 block text-primary no-underline">
                  Browse open tenders
                </Link>
              </div>
            ) : proposals.slice(0, 5).map(p => {
              const st = p.status || 'under_review';
              return (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-border last:border-0 transition-colors hover:bg-accent/50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">Tender #{p.tender_id}</p>
                    <p className="text-[10px] flex items-center gap-1 mt-0.5 text-muted-foreground">
                      <Clock size={9} /> {new Date(p.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={PROPOSAL_BADGE_VARIANT[st] || 'warning'}>{PROPOSAL_BADGE_LABEL[st] || 'Review'}</Badge>
                    <Link to={`/supplier/proposal/${p.id}`}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                      <Eye size={11} />
                    </Link>
                  </div>
                </div>
              );
            })}
            {proposals.length > 0 && (
              <div className="px-5 py-3 border-t border-border">
                <Link to="/supplier" className="text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-primary no-underline transition-colors">
                  View all <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfile;
