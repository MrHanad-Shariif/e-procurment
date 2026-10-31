import { useAuth } from '@/features/identity/hooks/useAuth';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Search, Bell, LogOut, ChevronDown, CheckCircle2, XCircle, CheckCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut,
} from '@/shared/ui/tenderrank/command';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/shared/ui/tenderrank/dropdown-menu';
import { Avatar, AvatarFallback } from '@/shared/ui/tenderrank/avatar';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { Button } from '@/shared/ui/tenderrank/button';
import { ThemeToggle } from '@/shared/brand/ThemeToggle';
import { SidebarTrigger } from '@/shared/ui/tenderrank/sidebar';
import { apiService } from '@/features/tendering/services/api';
import { cn } from '@/shared/ui/tenderrank/utils';

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Procurement Officer',
  supplier: 'Supplier',
};

const roleHome = (role) => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'supplier') return '/supplier';
  return '/dashboard';
};

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const rawUser = userJson ? JSON.parse(userJson) : null;
  const user = { name: 'Guest', role: 'supplier', email: '', ...rawUser };
  const [cmdOpen, setCmdOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);
  const seenIds = useRef(new Set());
  const isAdmin = user.role === 'admin';

  const unread = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user.role !== 'admin') return;

    const fetchAndNotify = () => {
      apiService.getNotifications()
        .then(r => {
          const data = r.data || [];
          setNotifications(data);

          // Toast every unread notification not yet shown this session
          data.forEach(n => {
            if (!seenIds.current.has(n.id) && !n.is_read) {
              seenIds.current.add(n.id);
              if (n.type === 'tender_approved') {
                toast.success(n.title, { description: n.body, duration: 10000 });
              } else if (n.type === 'tender_rejected') {
                toast.error(n.title, { description: n.body, duration: 10000 });
              } else {
                toast(n.title, { description: n.body, duration: 10000 });
              }
            }
          });
        })
        .catch(() => {});
    };

    fetchAndNotify();
    const interval = setInterval(fetchAndNotify, 10000);
    return () => clearInterval(interval);
  }, [user.role]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    await apiService.markNotificationRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await apiService.markAllNotificationsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const allItems = [
    { label: 'Overview', desc: 'Dashboard', path: '/dashboard', shortcut: 'G O', adminOnly: false },
    { label: 'Open Tenders', desc: 'Tenders list', path: '/tenders', shortcut: 'G T', adminOnly: false },
    { label: 'Create Tender', desc: 'Admin only', path: '/create-tender', shortcut: '', adminOnly: true },
    { label: 'Leaderboard', desc: 'Rankings', path: '/rankings', shortcut: 'G R', adminOnly: true },
    { label: 'My Profile', desc: 'Supplier profile', path: '/profile', shortcut: '', adminOnly: false },
    { label: 'Public Home', desc: 'Public portal', path: '/', shortcut: '', adminOnly: false },
    { label: 'Contact', desc: 'Contact page', path: '/contact', shortcut: '', adminOnly: false },
    { label: 'Browse Tenders', desc: 'Public tender list', path: '/browse', shortcut: '', adminOnly: false },
  ];
  const items = allItems.filter(i => !i.adminOnly || isAdmin);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.name.split(' ')[0];
  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  const goTo = (path) => { navigate(path); setCmdOpen(false); };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onMenuOpenChange = (v) => {
    setMenuOpen(v);
    if (!v) setConfirmLogout(false);
  };

  return (
    <>
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {items.map((item) => (
              <CommandItem key={item.path} value={`${item.label} ${item.desc}`} onSelect={() => goTo(item.path)}>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <header className="bg-card px-6 py-3.5 flex items-center justify-between shrink-0 gap-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger />
          <Link to={roleHome(user.role)} className="min-w-0 text-left transition-opacity hover:opacity-75 no-underline">
            <p className="text-base font-bold text-foreground whitespace-nowrap leading-tight">
              {greeting()}, {displayName}
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
              {ROLE_LABEL[user.role] || 'Portal'} · <span className="font-semibold text-primary">Dashboard</span>
            </p>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 w-44 justify-start text-muted-foreground font-normal"
          >
            <Search size={13} className="shrink-0" />
            <span className="flex-1 text-left text-xs">Search...</span>
            <kbd className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted border border-border font-mono shrink-0 text-muted-foreground">⌘K</kbd>
          </Button>

          {/* Notification Bell — admin only */}
          {isAdmin && (
            <div className="relative" ref={bellRef}>
              <Button
                variant="outline"
                size="icon"
                className="relative text-muted-foreground"
                onClick={() => setBellOpen(v => !v)}
              >
                <Bell size={15} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center ring-2 ring-card">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Bell size={13} className="text-primary" />
                      <p className="text-sm font-bold text-foreground">Notifications</p>
                      {unread > 0 && <Badge className="text-[9px] px-1.5 py-0">{unread} new</Badge>}
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/70 transition-colors"
                      >
                        <CheckCheck size={11} /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={20} className="text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => {
                            handleMarkRead(n.id);
                            if (n.tender_id) { navigate(`/tenders/${n.tender_id}`); setBellOpen(false); }
                          }}
                          className={cn(
                            'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors hover:bg-accent/60',
                            !n.is_read && 'bg-primary/5'
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                            n.type === 'tender_approved' ? 'bg-success/10' : 'bg-destructive/10'
                          )}>
                            {n.type === 'tender_approved'
                              ? <CheckCircle2 size={13} className="text-success" />
                              : <XCircle size={13} className="text-destructive" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-xs font-bold text-foreground', !n.is_read && 'text-primary')}>{n.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.is_read && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg border border-transparent transition-all hover:bg-accent hover:border-border">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown size={13} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                <Badge variant={user.role === 'super_admin' ? 'warning' : 'default'} className="mt-1.5">
                  {ROLE_LABEL[user.role]}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!confirmLogout ? (
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              ) : (
                <div className="px-2 py-1.5 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Are you sure?</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" className="flex-1" onClick={handleLogout}>
                      Yes, Sign Out
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmLogout(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
};

export default Navbar;
