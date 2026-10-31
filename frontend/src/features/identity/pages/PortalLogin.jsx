import { useAuth } from '@/features/identity/hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/features/tendering/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Building2, Loader2, MailCheck, Copy, Check } from 'lucide-react';
import { LogoMark } from '@/shared/brand/Logo';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Label } from '@/shared/ui/tenderrank/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/tenderrank/card';

function Field({ icon: Icon, id, label, type: baseType, value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  const isPwd = baseType === 'password';
  const type = isPwd ? (show ? 'text' : 'password') : baseType;
  return (
    <div className="grid gap-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id={id} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
          className="pl-9"
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('supplier');
  const { login } = useAuth();
  const [orgSlug, setOrgSlug] = useState(localStorage.getItem('org_slug') || 'default');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupResult, setSignupResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const roleHome = (r) => {
    if (r === 'super_admin') return '/super-admin';
    if (r === 'supplier') return '/supplier';
    return '/dashboard';
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try { navigate(roleHome(JSON.parse(localStorage.getItem('user') || '{}').role)); }
      catch { navigate('/dashboard'); }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) {
        await login(email, password, orgSlug);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.must_change_password) {
          navigate('/change-password', { replace: true });
        } else {
          navigate(roleHome(user.role));
        }
      } else {
        const res = await apiService.register(name, email, password, role);
        setSignupResult({ email, emailSent: res.data.email_sent, loginPassword: res.data.login_password });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin); setError(''); setName(''); setEmail(''); setPassword(''); setSignupResult(null);
  };

  const copyPassword = () => {
    if (!signupResult?.loginPassword) return;
    navigator.clipboard.writeText(signupResult.loginPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <Link to="/" className="flex items-center gap-2 self-center font-medium no-underline">
          <LogoMark size={28} />
          <span className="text-foreground">TenderRank</span>
        </Link>

        <Card className="shadow-lg">
          <CardHeader>
            <AnimatePresence mode="wait">
              <motion.div key={signupResult ? 'confirm' : isLogin ? 'si' : 'reg'}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}>
                <CardTitle className="text-xl">
                  {signupResult ? 'Check your email' : isLogin ? 'Login to your account' : 'Create your account'}
                </CardTitle>
                <CardDescription>
                  {signupResult
                    ? `We sent your login details to ${signupResult.email}`
                    : isLogin ? 'Enter your email below to access the procurement portal' : 'Register as a supplier to start submitting proposals'}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>
          <CardContent>
            {signupResult ? (
              <div className="flex flex-col gap-4">
                <div className={`flex items-start gap-3 px-3.5 py-3 rounded-lg text-sm ${signupResult.emailSent ? 'bg-primary/10 border border-primary/20 text-foreground' : 'bg-warning/10 border border-warning/20 text-foreground'}`}>
                  <MailCheck size={16} className="shrink-0 mt-0.5" />
                  <p className="m-0 leading-relaxed">
                    {signupResult.emailSent
                      ? <>We emailed a login password to <strong>{signupResult.email}</strong>. Use it to log in below — you'll be asked to set your own password right after.</>
                      : <>We couldn't send the confirmation email, so here's your login password. Use it to log in below.</>}
                  </p>
                </div>

                {!signupResult.emailSent && signupResult.loginPassword && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-muted/40">
                    <code className="flex-1 text-sm font-mono font-semibold text-foreground truncate">{signupResult.loginPassword}</code>
                    <button type="button" onClick={copyPassword} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                <Button onClick={() => switchMode(true)} className="w-full">Go to login</Button>
              </div>
            ) : (
            <>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium px-3.5 py-2.5 rounded-lg">
                    <AlertCircle size={14} className="shrink-0" /> {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-5">
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div key="name-f"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Field icon={User} id="name" label="Full name" type="text" value={name}
                        onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field icon={Building2} id="organization" label="Workspace" type="text" value={orgSlug}
                  onChange={e => { setOrgSlug(e.target.value); localStorage.setItem('org_slug', e.target.value); }} required />
                <Field icon={Mail} id="email" label="Email address" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />

                <div className="grid gap-1.5">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <Link to="#" className="ml-auto text-xs text-muted-foreground hover:text-primary no-underline transition-colors">
                        Forgot your password?
                      </Link>
                    )}
                  </div>
                  <Field icon={Lock} id="password" label="" type="password" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div key="role-f"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-primary bg-primary/10 text-primary text-[13px] font-semibold">
                        <Building2 size={14} /> Supplier account
                        <span className="ml-auto text-[11px] text-primary/70 font-medium">Public registration</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                    : isLogin ? 'Login' : 'Create account'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => switchMode(!isLogin)} className="bg-transparent border-none cursor-pointer p-0 underline underline-offset-4 text-foreground font-medium">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </form>
            </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Federal Government of Somalia · TenderRank Procurement Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
