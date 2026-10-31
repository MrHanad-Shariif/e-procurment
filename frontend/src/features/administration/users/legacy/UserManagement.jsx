import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiService } from '@/features/tendering/services/api';
import {
  Users, Plus, Trash2, ShieldCheck, User as UserIcon,
  X, Mail, Lock, Search, Building2, Loader2,
} from 'lucide-react';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import { Label } from '@/shared/ui/tenderrank/label';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Skeleton } from '@/shared/ui/tenderrank/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/tenderrank/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/tenderrank/dialog';
import { Avatar, AvatarFallback } from '@/shared/ui/tenderrank/avatar';
import { cn } from '@/shared/ui/tenderrank/utils';

const DeleteDialog = ({ user, onClose, onConfirm, loading }) => (
  <Dialog open={!!user} onOpenChange={(v) => { if (!v) onClose(); }}>
    <DialogContent className="max-w-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10">
          <Trash2 size={16} className="text-destructive" />
        </div>
        <div className="flex-1">
          <DialogTitle>Delete User</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Remove <span className="font-bold text-foreground">{user?.name}</span> permanently?
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">This action cannot be undone.</p>
        </div>
      </div>
      <DialogFooter className="mt-5 gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/* ── Role config ── */
const ROLE_CFG = {
  super_admin: { label: 'Super Admin', tone: 'text-primary bg-primary/10 border-primary/20', dot: 'bg-primary', avatar: 'bg-primary', Icon: ShieldCheck },
  admin: { label: 'Admin', tone: 'text-sky-600 bg-sky-50 border-sky-200', dot: 'bg-sky-500', avatar: 'bg-sky-600', Icon: ShieldCheck },
  supplier: { label: 'Supplier', tone: 'text-success bg-success/10 border-success/20', dot: 'bg-success', avatar: 'bg-success', Icon: Building2 },
};

const ROLE_LABELS = {
  super_admin: 'Super Admins',
  admin: 'Admins',
  supplier: 'Suppliers',
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });

  useEffect(() => {
    apiService.getAllUsers()
      .then(res => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setVal = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async e => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await apiService.createUser(form);
      setUsers(prev => [...prev, res.data]);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setShowForm(false);
      toast.success('User created successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiService.deleteUser(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('User deleted.');
    } catch {
      toast.error('Failed to delete user.');
    } finally { setDeleteLoading(false); }
  };

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    supplier: users.filter(u => u.role === 'supplier').length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
  };

  const searchLower = search.toLowerCase();
  const grouped = Object.entries(ROLE_CFG).map(([role, cfg]) => ({
    role, cfg,
    members: users.filter(u =>
      u.role === role &&
      (!search || u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower))
    ),
  }));

  const totalFiltered = grouped.reduce((s, g) => s + g.members.length, 0);

  return (
    <>
      <DeleteDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5 max-w-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? 'Loading…' : `${counts.total} user${counts.total !== 1 ? 's' : ''} across all roles`}
            </p>
          </div>
          <Button variant={showForm ? 'secondary' : 'default'} onClick={() => setShowForm(v => !v)}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New User'}
          </Button>
        </div>

        {/* Stat chips */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: 'Admins', value: counts.admin, tone: ROLE_CFG.admin.tone, Icon: ROLE_CFG.admin.Icon },
              { label: 'Suppliers', value: counts.supplier, tone: ROLE_CFG.supplier.tone, Icon: ROLE_CFG.supplier.Icon },
              { label: 'Total', value: counts.total, tone: 'text-primary bg-primary/10 border-primary/20', Icon: Users },
            ].map(({ label, value, tone, Icon }) => (
              <div key={label} className="rounded-xl p-4 flex items-center gap-3 bg-card border border-border shadow-sm">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border', tone)}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
                  <p className="text-[11px] font-semibold mt-0.5 text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden">
              <form onSubmit={handleCreate} className="rounded-xl overflow-hidden bg-card border border-primary/20 shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-primary/15 bg-primary/5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary">
                    <Plus size={12} className="text-primary-foreground" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Create New User</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Full Name *</Label>
                      <div className="relative">
                        <UserIcon size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input type="text" required value={form.name} onChange={set('name')} placeholder="Jane Smith" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email *</Label>
                      <div className="relative">
                        <Mail size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input type="email" required value={form.email} onChange={set('email')} placeholder="jane@company.com" className="pl-9" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Password *</Label>
                      <div className="relative">
                        <Lock size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input type="password" required value={form.password} onChange={set('password')} placeholder="Min. 8 characters" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Role *</Label>
                      <Select value={form.role} onValueChange={setVal('role')}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin (Procurement Officer)</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-border">
                    <Button type="submit" disabled={formLoading}>
                      {formLoading
                        ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                        : <><Plus size={14} /> Create User</>}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        {!loading && users.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-10" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground transition-colors hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* User list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl p-5 flex items-center gap-4 bg-card border border-border">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-32" /></div>
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : totalFiltered === 0 ? (
          <div className="py-20 text-center rounded-xl bg-card border border-border">
            <Users size={28} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">{search ? 'No users match your search' : 'No users yet'}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? 'Try a different name or email.' : 'Create the first user to get started.'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ role, cfg, members }) => {
              if (members.length === 0) return null;
              const { Icon } = cfg;
              return (
                <motion.div key={role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center border', cfg.tone)}>
                      <Icon size={11} />
                    </div>
                    <p className={cn('text-xs font-extrabold uppercase tracking-widest', cfg.tone.split(' ')[0])}>
                      {ROLE_LABELS[role]}
                    </p>
                    <Badge className={cfg.tone}>{members.length}</Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
                    <AnimatePresence mode="popLayout">
                      {members.map((u, i) => (
                        <motion.div
                          key={u.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, scale: 0.97 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                          className={cn('flex items-center justify-between px-5 py-3.5 gap-4 transition-colors hover:bg-accent/50', i < members.length - 1 && 'border-b border-border')}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={cn(cfg.avatar, 'text-white')}>{u.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                              </Avatar>
                              <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card', cfg.dot)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                              <p className="text-[11px] font-medium truncate flex items-center gap-1 text-muted-foreground">
                                <Mail size={9} /> {u.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={cn('hidden sm:flex', cfg.tone)}>
                              <Icon size={9} /> {cfg.label}
                            </Badge>
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => setDeleteTarget(u)}
                                className="p-2 rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-white">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default UserManagement;
