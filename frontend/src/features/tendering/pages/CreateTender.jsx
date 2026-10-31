import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/features/tendering/services/api';
import UploadCard from '@/features/tendering/components/UploadCard';
import { motion } from 'framer-motion';
import { FilePlus, CheckCircle2, AlertTriangle, ArrowLeft, Calendar, Zap, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Textarea } from '@/shared/ui/tenderrank/textarea';
import { Label } from '@/shared/ui/tenderrank/label';
import { cn } from '@/shared/ui/tenderrank/utils';

const SECTORS = [
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

const CreateTender = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sector', sector);
      if (deadline) formData.append('deadline', deadline);
      if (file) formData.append('file', file);
      const res = await apiService.createTender(formData);
      setSuccess(`Tender "${res.data.title}" saved as draft with ${res.data.requirements.length} requirements. Go to My Tenders to submit it for approval.`);
      setTitle(''); setDescription(''); setSector(''); setDeadline(''); setFile(null);
      setTimeout(() => navigate('/tenders'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tender.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl space-y-5"
    >
      {/* Header */}
      <div>
        <Link to="/tenders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 text-muted-foreground hover:text-primary no-underline transition-colors">
          <ArrowLeft size={13} /> Back to Tenders
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create New Tender</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add the tender details and specification, then review its evaluation requirements.
        </p>
      </div>

      {/* Draft workflow info */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-primary/10 border border-primary/20">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary">
          <Zap size={12} className="text-primary-foreground" fill="currentColor" />
        </div>
        <div>
          <span className="text-xs font-bold text-primary">Draft Workflow</span>
          <p className="text-xs text-primary/80 mt-0.5 leading-relaxed">
            Tender is saved as a draft → you submit it for approval → Super Admin reviews and publishes it.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-success">{success}</p>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Tender Title <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text" required value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Solar Farm Installation Project 2026"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Layers size={14} className="text-muted-foreground" />
              Sector <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(s => {
                const active = sector === s;
                return (
                  <button
                    key={s} type="button"
                    onClick={() => setSector(s)}
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors',
                      active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {!sector && <p className="text-xs text-muted-foreground">Select the sector this tender belongs to.</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Description</Label>
            <Textarea
              rows={4} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the scope, objectives, and any important notes..."
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={14} className="text-muted-foreground" /> Submission Deadline
            </Label>
            <Input
              type="date" value={deadline}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Optional. Suppliers cannot submit after this date.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Tender Specification PDF</Label>
            <UploadCard onFileSelect={setFile} file={file} />
            <p className="text-xs text-muted-foreground mt-1.5">
              If no PDF is uploaded, default requirements (Company Profile, Tax Compliance, Bank Statement) will be used.
            </p>
          </div>

          <div className="pt-2 border-t border-border">
            <Button
              type="submit" disabled={loading || !sector}
              size="lg"
              className="w-full"
              style={{ background: loading ? 'var(--primary)' : 'linear-gradient(135deg, var(--foreground), var(--primary))' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Draft...
                </>
              ) : (
                <>
                  <FilePlus size={16} /> Save as Draft
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateTender;
