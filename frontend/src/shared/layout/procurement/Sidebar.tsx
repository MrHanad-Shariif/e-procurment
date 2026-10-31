import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Mail,
  Package2,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Users,
  Send,
  PackageCheck,
  FileCheck,
  Wallet,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useTenant } from "@/app/providers/TenantContext";
import { Avatar, AvatarFallback } from "@/shared/ui/procurement/avatar";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/procurement/sidebar";

const groups = [
  {
    label: "workspace",
    items: [{ key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, permissions: [] }],
  },
  {
    label: "procurement",
    items: [
      {
        key: "nav.purchaseRequests",
        href: "/purchase-requisitions",
        icon: FileText,
        permissions: ["purchase_request.view", "purchase_request.view_all"],
      },
      { key: "nav.rfq", href: "/rfq", icon: Send, permissions: ["rfq.view", "rfq.view_all"] },
      {
        key: "nav.purchaseOrders",
        href: "/purchase-orders",
        icon: ShoppingCart,
        permissions: ["purchase_order.view", "purchase_order.view_all"],
      },
      {
        key: "nav.goodsReceipts",
        href: "/goods-receipts",
        icon: PackageCheck,
        permissions: ["goods_receipt.view", "goods_receipt.view_all"],
      },
      {
        key: "nav.invoices",
        href: "/invoices",
        icon: FileCheck,
        permissions: ["invoice.view", "invoice.view_all"],
      },
      { key: "nav.suppliers", href: "/suppliers", icon: Building2, permissions: ["supplier.view"] },
      {
        key: "nav.budgets",
        href: "/budgets",
        icon: Wallet,
        permissions: ["budget.view"],
      },
      {
        key: "nav.contracts",
        href: "/contracts",
        icon: ScrollText,
        permissions: ["contract.view", "contract.view_all"],
      },
    ],
  },
  {
    label: "administration",
    items: [
      { key: "nav.users", href: "/users", icon: Users, permissions: ["user.view"] },
      { key: "nav.roles", href: "/roles", icon: ShieldCheck, permissions: ["role.view"] },
      { key: "nav.settings", href: "/settings", icon: Settings2, permissions: ["settings.view"] },
      {
        key: "nav.smtp",
        href: "/settings/smtp",
        icon: Mail,
        permissions: ["settings.manage_smtp"],
      },
    ],
  },
];

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, hasPermission } = useAuth();
  const { organization } = useTenant();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <SidebarPrimitive
      collapsible="icon"
      side={i18n.dir() === "rtl" ? "right" : "left"}
      dir={i18n.dir()}
    >
      <SidebarHeader className="gap-5 px-4 pt-6 pb-4 group-data-[collapsible=icon]:px-2">
        <Link to="/dashboard" className="flex items-center gap-2.5" aria-label={t("app.name")}>
          <span className="bg-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm group-data-[collapsible=icon]:size-8">
            <Package2 className="size-5" />
          </span>
          <span className="truncate text-[17px] font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            {organization?.systemName || t("app.name")}
          </span>
        </Link>
        <div className="bg-background/70 flex items-center gap-2.5 rounded-lg border p-2.5 group-data-[collapsible=icon]:hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-white">
            <Building2 className="text-muted-foreground size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {organization?.name || t("dashboard:workspace")}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              {t("dashboard:workspaceLabel")}
            </p>
          </div>
          <ShieldCheck className="text-muted-foreground size-3.5" />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2">
        {groups.map((group) => {
          const items = group.items.filter(
            (item) => !item.permissions.length || item.permissions.some(hasPermission)
          );
          if (!items.length) return null;
          return (
            <SidebarGroup key={group.label} className="py-0">
              <SidebarGroupLabel className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                {t(`dashboard:${group.label}`)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {items.map(({ key, href, icon: Icon }) => {
                    const active =
                      href === "/"
                        ? ["/", "/dashboard"].includes(location.pathname)
                        : location.pathname === href ||
                          (location.pathname.startsWith(`${href}/`) &&
                            !(
                              href === "/settings" && location.pathname.startsWith("/settings/smtp")
                            ));
                    return (
                      <SidebarMenuItem key={key}>
                        <SidebarMenuButton
                          render={<Link to={href} />}
                          isActive={active}
                          tooltip={t(key)}
                          onClick={() => setOpenMobile(false)}
                          className="text-muted-foreground data-active:bg-primary/8 data-active:text-primary h-10 gap-3 px-3 text-[13px] dark:data-active:text-blue-300 [&>svg]:size-[17px]"
                        >
                          <Icon />
                          <span>{t(key)}</span>
                          {active && <ChevronRight className="ms-auto size-3.5! rtl:rotate-180" />}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="gap-4 p-4 group-data-[collapsible=icon]:p-2">
        {hasPermission("settings.view") && (
          <div className="bg-background rounded-xl border p-3.5 group-data-[collapsible=icon]:hidden">
            <span className="ring-border mb-2 flex size-7 items-center justify-center rounded-lg bg-white ring-1">
              <ShieldCheck className="text-primary size-4" />
            </span>
            <p className="text-xs font-semibold">{t("dashboard:workspaceReady")}</p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              {t("dashboard:workspaceReadyHint")}
            </p>
            <Link
              to="/settings"
              onClick={() => setOpenMobile(false)}
              className="text-primary mt-3 flex items-center justify-between text-xs font-medium"
            >
              {t("dashboard:manageWorkspace")}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        )}
        <div className="flex items-center gap-2.5 border-t pt-4">
          <Avatar className="size-8">
            <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">{user?.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
