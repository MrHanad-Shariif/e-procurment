import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '@/features/tendering/services/api';
import UploadCard from '@/features/tendering/components/UploadCard';
import { motion } from 'framer-motion';
import { SendHorizonal, ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, Clock, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { Label } from '@/shared/ui/tenderrank/label';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { cn } from '@/shared/ui/tenderrank/utils';

const SupplierSubmission = () => {
  const { tenderId } = useParams();
  const [tender, setTender] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiService.getTender(tenderId),
      apiService.getProposals(),
    ]).then(([tRes, pRes]) => {
      setTender(tRes.data);
      const existing = pRes.data.find(p => p.tender_id === String(tenderId));
      if (existing) { setAlreadySubmitted(true); setResult(existing); }
    }).catch(() => setError('Failed to load tender info.'))
      .finally(() => setFetchLoading(false));
  }, [tenderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a document to upload.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('tender_id', tenderId);
      formData.append('file', file);
      const res = await apiService.submitProposal(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="max-w-2xl space-y-5">
      <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-64" /></div>
      <Skeleton className="rounded-xl h-48 bg-card border border-border" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl space-y-5"
    >
      {/* Header */}
      <div>
        <Link to={`/tenders/${tenderId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 text-muted-foreground hover:text-primary no-underline transition-colors">
          <ArrowLeft size={13} /> Back to Tender
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Submit Proposal</h1>
        {tender && (
          <p className="text-sm text-muted-foreground mt-1">
            For: <span className="font-semibold text-foreground">{tender.title}</span>
          </p>
        )}
      </div>


      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle size={15} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </div>
      )}

      {/* Result / success state */}
      {result ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-8 space-y-5 bg-card border border-border shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-success/10 border border-success/25">
              <CheckCircle2 size={26} className="text-success" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">
                {alreadySubmitted ? 'Already Submitted' : 'Proposal Submitted!'}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {alreadySubmitted
                  ? 'You have already submitted a proposal for this tender.'
                  : 'Your document has been received and is being processed by our AI.'}
              </p>
            </div>
          </div>

          {!alreadySubmitted && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary">
                <Zap size={12} className="text-primary-foreground" fill="currentColor" />
              </div>
              <p className="text-xs font-semibold text-primary">
                Our AI is scoring your proposal for compliance and merit.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <Badge variant="warning" className="px-3 py-1.5">
              <AlertCircle size={13} /> Under Review
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} /> The admin will notify you of the result
            </span>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link to="/supplier" className="no-underline">Back to Dashboard</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Proposal Document <span className="text-destructive">*</span>
              </Label>
              <UploadCard onFileSelect={setFile} file={file} />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a single PDF containing all required documents merged together.
              </p>
            </div>
            <div className="pt-2 border-t border-border">
              <Button
                type="submit" disabled={loading || !file}
                size="lg"
                className="w-full"
                style={{ background: loading ? 'var(--primary)' : 'linear-gradient(135deg, var(--foreground), var(--primary))' }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><SendHorizonal size={16} /> Submit Proposal</>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default SupplierSubmission;
