import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/shared/brand/Logo';
import { Button } from '@/shared/ui/tenderrank/button';
import { ThemeToggle } from '@/shared/brand/ThemeToggle';
import { cn } from '@/shared/ui/tenderrank/utils';

const PublicNavbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  const dashboardPath = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.role === 'super_admin') return '/super-admin';
      if (u.role === 'supplier') return '/supplier';
      return '/dashboard';
    } catch { return '/dashboard'; }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Tenders' },
    { to: '/contact', label: 'Contact' },
    { to: '/apply', label: 'Apply' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border backdrop-blur-xl transition-shadow duration-300',
        scrolled ? 'bg-background/95 shadow-sm' : 'bg-background'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="group no-underline">
            <Logo className="group-hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 no-underline',
                  isActive(to) ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {label}
                {isActive(to) && (
                  <motion.div
                    layoutId="nav-pill-pub"
                    className="absolute inset-0 rounded-lg -z-10 bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {token ? (
              <Button asChild>
                <Link to={dashboardPath()} className="no-underline">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login" className="no-underline">Sign In</Link>
                </Button>
                <Button variant="secondary" className="bg-foreground text-background hover:bg-foreground/90" asChild>
                  <Link to="/login" className="no-underline">Get Started →</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-muted-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={open ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden px-4 py-3 space-y-1 border-t border-border bg-background overflow-hidden"
          >
            {navLinks.map(({ to, label }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={to}
                  className={cn(
                    'block px-4 py-2.5 rounded-lg text-sm font-medium no-underline',
                    isActive(to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  )}
                >{label}</Link>
              </motion.div>
            ))}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-xs font-semibold text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              {token ? (
                <Button asChild className="w-full">
                  <Link to={dashboardPath()} className="no-underline">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login" className="no-underline">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-foreground text-background hover:bg-foreground/90" asChild>
                    <Link to="/login" className="no-underline">Get Started →</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
