import { Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronRight, Globe2, LogOut, Settings2, UserRound } from "lucide-react";
import { Sidebar } from "@/shared/layout/procurement/Sidebar";
import { NotificationBell } from "@/shared/layout/procurement/NotificationBell";
import { ThemeToggle } from "@/shared/brand/ProcurementThemeToggle";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/shared/ui/procurement/avatar";
import { Button } from "@/shared/ui/procurement/button";
import { Separator } from "@/shared/ui/procurement/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/procurement/sidebar";
import { TooltipProvider } from "@/shared/ui/procurement/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/procurement/dropdown-menu";

const sections: Record<string, string> = {
  "purchase-requisitions": "nav.purchaseRequests",
  rfq: "nav.rfq",
  "purchase-orders": "nav.purchaseOrders",
  "goods-receipts": "nav.goodsReceipts",
  invoices: "nav.invoices",
  suppliers: "nav.suppliers",
  budgets: "nav.budgets",
  contracts: "nav.contracts",
  users: "nav.users",
  roles: "nav.roles",
  settings: "nav.settings",
};

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.pathname.startsWith("/settings/smtp")
    ? t("nav.smtp")
    : t(sections[location.pathname.split("/")[1]] || "nav.dashboard");
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        className="min-h-svh"
        defaultOpen={
          document.cookie
            .split("; ")
            .find((entry) => entry.startsWith("sidebar_state="))
            ?.split("=")[1] !== "false"
        }
      >
        <Sidebar />
        <SidebarInset className="bg-background min-w-0">
          <header className="bg-card/95 sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm sm:px-7">
            <SidebarTrigger aria-label={t("dashboard:toggleSidebar")} />
            <Separator orientation="vertical" className="me-1 h-4!" />
            <nav
              aria-label={t("dashboard:workspace")}
              className="flex min-w-0 items-center gap-2 text-xs"
            >
              <Link to="/dashboard" className="text-muted-foreground hidden sm:block">
                {t("dashboard:workspace")}
              </Link>
              <ChevronRight className="text-muted-foreground hidden size-3 sm:block rtl:rotate-180" />
              <span className="truncate font-medium">{title}</span>
            </nav>
            <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-4">
              <span className="text-muted-foreground hidden items-center gap-2 text-xs xl:flex">
                <CalendarDays className="size-3.5" />
                {new Intl.DateTimeFormat(i18n.language, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date())}
              </span>
              <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Globe2 className="size-4" />
                <select
                  aria-label={t("dashboard:language")}
                  value={i18n.resolvedLanguage || "en"}
                  onChange={(event) => void i18n.changeLanguage(event.target.value)}
                  className="text-foreground max-w-24 bg-transparent py-1.5 outline-none"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </label>
              <NotificationBell />
              <ThemeToggle />
              <Separator orientation="vertical" className="hidden h-5! sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" className="h-9 gap-2 rounded-full p-0.5 pe-2" />}
                  aria-label={t("dashboard:account")}
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-medium lg:block">{user?.firstName}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate text-xs">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {hasPermission("user.view") && (
                    <DropdownMenuItem onClick={() => navigate(`/users/${user?.id}`)}>
                      <UserRound />
                      {t("dashboard:account")}
                    </DropdownMenuItem>
                  )}
                  {hasPermission("settings.view") && (
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings2 />
                      {t("nav.settings")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} variant="destructive">
                    <LogOut />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1600px] flex-1">
            <Suspense
              fallback={
                <div role="status" className="text-muted-foreground p-8 text-sm">
                  {t("common.loading")}
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
