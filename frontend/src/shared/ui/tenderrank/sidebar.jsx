import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SidebarContext, useSidebar } from '@/shared/ui/tenderrank/sidebar-context';
export { useSidebar } from '@/shared/ui/tenderrank/sidebar-context';
import { PanelLeft } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/shared/ui/tenderrank/button';
import { cn } from '@/shared/ui/tenderrank/utils';

const SIDEBAR_WIDTH = '15rem';
const SIDEBAR_WIDTH_ICON = '3.25rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const STORAGE_KEY = 'tenderrank-sidebar-open';
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function SidebarProvider({ children, defaultOpen = true, className, style, ...props }) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [open, setOpenState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === 'true' : defaultOpen;
    } catch { return defaultOpen; }
  });

  const setOpen = useCallback((value) => {
    setOpenState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v);
    else setOpen((v) => !v);
  }, [isMobile, setOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const value = useMemo(() => ({
    state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar,
  }), [state, open, setOpen, isMobile, openMobile, toggleSidebar]);

  return (
    <SidebarContext.Provider value={value}>
      <div
        style={{
          '--sidebar-width': SIDEBAR_WIDTH,
          '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
          ...style,
        }}
        className={cn('flex min-h-screen w-full', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, className }) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <DialogPrimitive.Root open={openMobile} onOpenChange={setOpenMobile}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 start-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground border-e border-sidebar-border outline-none data-[state=open]:animate-in data-[state=closed]:animate-out ltr:data-[state=closed]:slide-out-to-left ltr:data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right duration-200"
            style={{ width: SIDEBAR_WIDTH_MOBILE }}
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <aside
      data-state={state}
      className={cn(
        'group hidden md:flex flex-col shrink-0 h-screen bg-sidebar text-sidebar-foreground border-e border-sidebar-border transition-[width] duration-200 ease-linear overflow-hidden',
        className
      )}
      style={{ width: state === 'expanded' ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)' }}
    >
      {children}
    </aside>
  );
}

export function SidebarTrigger({ className, ...props }) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 text-muted-foreground', className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft size={16} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function SidebarHeader({ className, ...props }) {
  return <div className={cn('shrink-0', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div className={cn('shrink-0', className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden', className)} {...props} />;
}

export function SidebarGroup({ className, ...props }) {
  return <div className={cn('space-y-0.5', className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }) {
  return (
    <p
      className={cn(
        'px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70',
        'group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:h-0 group-data-[state=collapsed]:pointer-events-none overflow-hidden transition-opacity',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }) {
  return <div className={cn('space-y-0.5', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }) {
  return <div className={cn(className)} {...props} />;
}

/** Class generator for the nav link/button inside a sidebar menu item — apply
 * directly to a react-router NavLink (via its className render-prop) or a
 * plain button, so the trigger element can own the DOM node it needs. */
export function sidebarMenuButtonClass(isActive, extra) {
  return cn(
    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
    'group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    extra
  );
}

/** Wraps a label so it disappears (not just visually, but from layout) when the sidebar is collapsed to icons. */
export function SidebarLabel({ className, ...props }) {
  return <span className={cn('group-data-[state=collapsed]:hidden', className)} {...props} />;
}

export function SidebarInset({ className, ...props }) {
  return <div className={cn('flex flex-col flex-1 min-w-0 h-screen overflow-hidden', className)} {...props} />;
}
