import React, { useState, useEffect } from 'react';
import { apiService } from '@/features/tendering/services/api';
import {
  Building2, MapPin, Phone, Hash, Mail, User,
  Save, CheckCircle2, AlertTriangle, Flag, Map,
  FileText, Briefcase, Calendar, Layers, Edit2, X, Loader2,
} from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Textarea } from '@/shared/ui/tenderrank/textarea';
import { Label } from '@/shared/ui/tenderrank/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/tenderrank/select';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';

const ORG_TYPES = [
  'Government Ministry', 'Government Agency', 'Local Government Authority',
  'United Nations Agency', 'International NGO', 'Local NGO',
  'Private Company', 'Parastatal / State-Owned Enterprise', 'Other',
];

const Field = ({ icon: Icon, label, required, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {label}{required && <span className="text-destructive"> *</span>}
    </Label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />}
      {children}
    </div>
    {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
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

const REQUIRED = ['company_name', 'company_type', 'country', 'address', 'phone', 'contact_person'];

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    company_name: '', company_type: '', registration_number: '',
    year_established: '', country: '', city: '', address: '',
    phone: '', contact_person: '', business_description: '', industry: '',
  });

  useEffect(() => {
    apiService.getProfile()
      .then(res => {
        const p = res.data;
        setProfile(p);
        setForm({
          company_name: p.company_name || '',
          company_type: p.company_type || '',
          registration_number: p.registration_number || '',
          year_established: p.year_established ? String(p.year_established) : '',
          country: p.country || '',
          city: p.city || '',
          address: p.address || '',
          phone: p.phone || '',
          contact_person: p.contact_person || '',
          business_description: p.business_description || '',
          industry: p.industry || '',
        });
        const incomplete = REQUIRED.some(f => !p[f]?.trim());
        setEditing(incomplete);
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
      const payload = {
        ...form,
        year_established: form.year_established ? parseInt(form.year_established, 10) : null,
      };
      const res = await apiService.updateProfile(payload);
      const savedProfile = res.data;
      setProfile(savedProfile);
      setForm({
        company_name: savedProfile.company_name || '',
        company_type: savedProfile.company_type || '',
        registration_number: savedProfile.registration_number || '',
        year_established: savedProfile.year_established ? String(savedProfile.year_established) : '',
        country: savedProfile.country || '',
        city: savedProfile.city || '',
        address: savedProfile.address || '',
        phone: savedProfile.phone || '',
        contact_person: savedProfile.contact_person || '',
        business_description: savedProfile.business_description || '',
        industry: savedProfile.industry || '',
      });
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
    <div className="space-y-4 max-w-3xl">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisation Profile</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {isComplete ? 'Your profile is complete.' : 'Complete your profile to create tenders.'}
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

      {/* ── VIEW MODE ── */}
      {!editing && (
        <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
          <div className="px-6 py-5 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
                <Building2 size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{profile?.company_name || 'Your Organisation'}</h2>
                {profile?.company_type && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg mt-1 inline-block bg-primary/10 text-primary">
                    {profile.company_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">Organisation Information</p>
            <InfoRow icon={Hash} label="Registration Number" value={profile?.registration_number} />
            <InfoRow icon={Calendar} label="Year Established" value={profile?.year_established ? String(profile.year_established) : null} />
            <InfoRow icon={Layers} label="Industry / Sector" value={profile?.industry} />

            <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">Location</p>
            <InfoRow icon={Flag} label="Country" value={profile?.country} />
            <InfoRow icon={Map} label="City" value={profile?.city} />
            <InfoRow icon={MapPin} label="Office Address" value={profile?.address} />

            <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">Contact</p>
            <InfoRow icon={User} label="Contact Person" value={profile?.contact_person} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
            <InfoRow icon={Mail} label="Email" value={profile?.email} />

            {profile?.business_description && (
              <>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-4 pb-2">About</p>
                <div className="py-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Organisation Description</p>
                  <p className="text-sm leading-relaxed text-foreground/85">{profile.business_description}</p>
                </div>
              </>
            )}
            <div className="py-4" />
          </div>

          {!isComplete && (
            <div className="mx-6 mb-5 px-4 py-3 rounded-xl flex items-center gap-3 bg-warning/10 border border-warning/25">
              <AlertTriangle size={13} className="text-warning" />
              <p className="text-xs font-semibold text-warning">
                Profile incomplete — fill all required fields to create tenders.
              </p>
              <button onClick={() => setEditing(true)} className="ml-auto text-xs font-bold shrink-0 text-warning">
                Complete now
              </button>
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
            {!isComplete && (
              <p className="text-xs mt-2 text-muted-foreground">Complete all required fields to unlock tender creation.</p>
            )}
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
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Organisation Information</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Building2} label="Organisation Name" required>
                    <Input className="pl-10" value={form.company_name} onChange={set('company_name')} placeholder="Ministry of Health" />
                  </Field>
                  <Field label="Organisation Type" required>
                    <Select value={form.company_type} onValueChange={setVal('company_type')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Hash} label="Registration Number" hint="Leave blank if not applicable">
                    <Input className="pl-10" value={form.registration_number} onChange={set('registration_number')} placeholder="e.g. GOV/2005/001" />
                  </Field>
                  <Field icon={Calendar} label="Year Established">
                    <Input className="pl-10" type="number" min="1800" max={new Date().getFullYear()}
                      value={form.year_established} onChange={set('year_established')}
                      placeholder={String(new Date().getFullYear())} />
                  </Field>
                </div>
                <Field icon={Layers} label="Industry / Sector">
                  <Input className="pl-10" value={form.industry} onChange={set('industry')}
                    placeholder="e.g. Public Health, Education, Infrastructure" />
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
                  <Field icon={Map} label="City">
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
                  <Input className="pl-10" value={form.contact_person} onChange={set('contact_person')}
                    placeholder="Name of the procurement officer" />
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
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">About the Organisation</p>
              <Field icon={FileText} label="Organisation Description">
                <Textarea rows={4} value={form.business_description} onChange={set('business_description')}
                  placeholder="Brief description of your organisation's mandate and activities…" className="resize-none pl-10" />
              </Field>
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
  );
};

export default AdminProfile;
