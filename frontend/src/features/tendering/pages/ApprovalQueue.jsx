import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiService, downloadDocument } from '@/features/tendering/services/api';
import {
  CheckCircle2, XCircle, FileText,
  ChevronDown, ChevronUp, Clock, Building2,
  MapPin, Phone, User, Hash, Calendar, Briefcase, Mail, Download,
} from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Textarea } from '@/shared/ui/tenderrank/textarea';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/tenderrank/dialog';

const RejectDialog = ({ isOpen, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-destructive/10">
              <XCircle size={15} className="text-destructive" />
            </div>
            <DialogTitle>Reject Tender</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">Provide a reason for the rejection so the admin can improve their tender.</p>
        <Textarea
          rows={4} value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Enter rejection reason…" className="resize-none"
        />
        <DialogFooter className="mt-4 gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={loading || !reason.trim()}
            onClick={() => { onConfirm(reason); setReason(''); }}
          >
            {loading ? 'Rejecting…' : 'Reject Tender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const IssuerRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 min-w-0">
    <Icon size={11} className="text-primary mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground truncate">{value}</p>
    </div>
  </div>
);

const ApprovalQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });

  useEffect(() => {
    apiService.getApprovalQueue()
      .then(res => setQueue(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await apiService.approveTender(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      toast.success('Tender approved successfully.');
    } catch {
      toast.error('Failed to approve tender.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (reason) => {
    const { id } = rejectModal;
    setRejectModal({ open: false, id: null });
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      await apiService.rejectTender(id, reason);
      setQueue(prev => prev.filter(item => item.id !== id));
      toast.success('Tender rejected.');
    } catch {
      toast.error('Failed to reject tender.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  return (
    <>
      <RejectDialog
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null })}
        onConfirm={handleReject}
        loading={!!actionLoading[rejectModal.id]}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5 max-w-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1 text-primary">
              Super Admin
            </p>
            <h1 className="text-2xl font-extrabold text-foreground">Approval Queue</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and action tenders submitted by admins.
            </p>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/10 border border-warning/25">
              <Clock size={13} className="text-warning" />
              <span className="text-sm font-bold text-warning">{queue.length} pending</span>
            </div>
          )}
        </div>

        {/* Queue */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="rounded-xl h-24 bg-card border border-border" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="py-24 text-center rounded-xl bg-card border border-border shadow-sm">
            <CheckCircle2 size={36} className="mx-auto mb-4 text-success/60" />
            <p className="text-lg font-bold text-foreground">Queue is clear!</p>
            <p className="text-sm text-muted-foreground mt-1">All tenders have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {queue.map((item) => {
                const isExpanded = !!expanded[item.id];
                const al = actionLoading[item.id];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl overflow-hidden bg-card border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                          <FileText size={15} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 size={9} /> {item.company_name || 'Unknown Company'} · {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item.id)}
                          disabled={!!al}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          {al === 'approve' ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" /> : <CheckCircle2 size={12} />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectModal({ open: true, id: item.id })}
                          disabled={!!al}
                          className="text-destructive border-destructive/25 bg-destructive/10 hover:bg-destructive hover:text-white"
                        >
                          {al === 'reject' ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" /> : <XCircle size={12} />}
                          Reject
                        </Button>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-2 rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-accent">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="px-5 py-4 space-y-4 bg-muted/30">

                            {item.created_by && (
                              <div className="rounded-xl overflow-hidden border border-primary/20">
                                <div className="px-4 py-3 flex items-center gap-2 bg-primary">
                                  <Building2 size={13} className="text-primary-foreground" />
                                  <p className="text-xs font-bold text-primary-foreground tracking-wide">Issuer Organisation</p>
                                  {item.created_by.company_type && (
                                    <Badge className="ml-auto bg-white/20 text-primary-foreground border-transparent">
                                      {item.created_by.company_type}
                                    </Badge>
                                  )}
                                </div>
                                <div className="p-4 bg-card">
                                  <p className="text-base font-extrabold text-foreground mb-3">
                                    {item.created_by.company_name || item.created_by.name}
                                  </p>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                    {item.created_by.contact_person && (
                                      <IssuerRow icon={User} label="Contact Person" value={item.created_by.contact_person} />
                                    )}
                                    {item.created_by.email && (
                                      <IssuerRow icon={Mail} label="Email" value={item.created_by.email} />
                                    )}
                                    {item.created_by.phone && (
                                      <IssuerRow icon={Phone} label="Phone" value={item.created_by.phone} />
                                    )}
                                    {item.created_by.registration_number && (
                                      <IssuerRow icon={Hash} label="Reg. Number" value={item.created_by.registration_number} />
                                    )}
                                    {(item.created_by.city || item.created_by.country) && (
                                      <IssuerRow icon={MapPin} label="Location"
                                        value={[item.created_by.city, item.created_by.country].filter(Boolean).join(', ')} />
                                    )}
                                    {item.created_by.year_established && (
                                      <IssuerRow icon={Calendar} label="Est." value={item.created_by.year_established} />
                                    )}
                                    {item.created_by.industry && (
                                      <IssuerRow icon={Briefcase} label="Industry" value={item.created_by.industry} />
                                    )}
                                  </div>
                                  {item.created_by.address && (
                                    <div className="mt-2.5 pt-2.5 border-t border-border">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Address</p>
                                      <p className="text-xs text-muted-foreground">{item.created_by.address}</p>
                                    </div>
                                  )}
                                  {item.created_by.business_description && (
                                    <div className="mt-2.5 pt-2.5 border-t border-border">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">About</p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">{item.created_by.business_description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.pdf_path && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Tender Document</p>
                                <a
                                  href={`/api/v1/tendering/documents/${item.pdf_path}`}
                                  onClick={event => { event.preventDefault(); void downloadDocument(item.pdf_path); }}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold no-underline transition-colors hover:bg-primary hover:text-primary-foreground border border-primary/20"
                                >
                                  <Download size={13} /> Download / View Document
                                </a>
                              </div>
                            )}

                            {item.description && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Description</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              {item.budget && (
                                <div className="rounded-lg p-3 bg-card border border-border">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Budget</p>
                                  <p className="text-sm font-bold text-foreground">${Number(item.budget).toLocaleString()}</p>
                                </div>
                              )}
                              {item.deadline && (
                                <div className="rounded-lg p-3 bg-card border border-border">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Deadline</p>
                                  <p className="text-sm font-bold text-foreground">{new Date(item.deadline).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                            {item.requirements?.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Requirements</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.requirements.map((req, i) => {
                                    const label = typeof req === 'object' ? req.display_label : req.replace(/_/g, ' ');
                                    return <Badge key={i}>{label}</Badge>;
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ApprovalQueue;
