import { type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/identity/hooks/useAuth";
import PublicNavbar from "@/shared/layout/PublicNavbar";
import Sidebar from "@/shared/navigation/AppSidebar";
import { NavigationBreadcrumb } from "@/shared/navigation/NavigationBreadcrumb";
import Navbar from "@/shared/layout/TopBar";
import { SidebarProvider, SidebarInset } from "@/shared/ui/tenderrank/sidebar";
import { Toaster } from "@/shared/ui/tenderrank/sonner";
import SuperAdminDashboard from "@/features/administration/dashboard/pages/SuperAdminDashboard";
import Dashboard from "@/features/administration/dashboard/pages/Dashboard";
import SupplierDashboard from "@/features/supplier-portal/pages/SupplierDashboard";

export function UnifiedPublic({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
    </>
  );
}

export function UnifiedShell() {
  const { i18n } = useTranslation();
  return (
    <SidebarProvider className="bg-background h-screen overflow-hidden" style={{}}>
      <Sidebar />
      <SidebarInset className="">
        <Navbar />
        <div className="flex min-h-9 items-center justify-between gap-3 border-b px-5 py-1 md:px-6">
          <NavigationBreadcrumb />
          <select
            aria-label="Language"
            className="bg-background text-muted-foreground text-xs"
            value={i18n.resolvedLanguage || "en"}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

export function UnifiedOverview() {
  const { user } = useAuth();
  if (user?.roles.some((role) => role.slug === "supplier")) return <SupplierDashboard />;
  return user?.roles.some((role) => role.slug === "admin") ? (
    <SuperAdminDashboard />
  ) : (
    <Dashboard />
  );
}
