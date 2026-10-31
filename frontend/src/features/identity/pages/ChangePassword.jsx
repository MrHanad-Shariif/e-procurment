import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/features/tendering/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Label } from '@/shared/ui/tenderrank/label';

function PwdField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</Label>
      <div className="relative">
        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type={show ? 'text' : 'password'}
          required value={value} onChange={onChange} placeholder={placeholder}
          className="pl-10 h-11"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login', { replace: true }); return; }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.must_change_password) {
        const home = user.role === 'super_admin' ? '/super-admin'
          : user.role === 'supplier' ? '/supplier' : '/dashboard';
        navigate(home, { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPwd.length < 10) { setError('New password must be at least 10 characters.'); return; }
    if (newPwd !== confirmPwd) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await apiService.changePassword(currentPwd, newPwd);
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setDone(true);
      setTimeout(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.assign('/login');
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center px-5 py-10">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]">

        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} className="text-primary-foreground" />
          </div>
          <h1 className="m-0 mb-1.5 text-[22px] font-bold text-foreground tracking-tight">
            Set your password
          </h1>
          <p className="m-0 text-[13.5px] text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
            Your account requires a password change before you can continue.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-md p-7">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-3">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3.5">
                  <CheckCircle2 size={22} className="text-success" />
                </div>
                <p className="m-0 mb-1 font-bold text-foreground text-[15px]">
                  Password updated!
                </p>
                <p className="m-0 text-[13px] text-muted-foreground">
                  Redirecting to your dashboard…
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium px-3.5 py-2.5 rounded-lg">
                        <AlertCircle size={14} className="shrink-0" /> {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <PwdField label="Current (temporary) password" value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)} placeholder="Your temporary password" />
                <PwdField label="New password" value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 characters" />
                <PwdField label="Confirm new password" value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />

                <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : 'Set new password →'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-[18px] text-center text-[11.5px] text-muted-foreground/50">
          Federal Government of Somalia · TenderRank
        </p>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
