import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Globe2,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { LogoMark } from "@/shared/brand/Logo";
import { Avatar, AvatarFallback } from "@/shared/ui/tenderrank/avatar";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLabel,
  useSidebar,
} from "@/shared/ui/tenderrank/sidebar";
import { cn } from "@/shared/lib/utils";
import api from "@/shared/lib/api";
import { findActiveBranch } from "@/shared/navigation/navigation";
import { useNavigation } from "@/shared/navigation/useNavigation";

interface OpenBranch {
  section: string | null;
  module: string | null;
}

export default function AppSidebar() {
  const { t } = useTranslation("navigation");
  const { user, hasPermission, sections, overview, isAdministrator, isSupplier } = useNavigation();
  const { pathname } = useLocation();
  const { state, setOpen, isMobile, setOpenMobile } = useSidebar();
  const compact = state === "collapsed" && !isMobile;
  const active = useMemo(() => findActiveBranch(sections, pathname), [sections, pathname]);
  const storageKey = `tenderrank-navigation:${user?.orgId}:${user?.id}`;
  const [preference, setPreference] = useState<OpenBranch & { pathname: string }>(() => {
    if (active) return { section: active.section.id, module: active.module.id, pathname };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}") as OpenBranch;
      const section = sections.find((item) => item.id === saved.section);
      if (section)
        return {
          section: section.id,
          module: section.modules.some((item) => item.id === saved.module) ? saved.module : null,
          pathname,
        };
    } catch {
      /* Start with a compact menu if saved preferences are unavailable. */
    }
    return { section: null, module: null, pathname };
  });

  const branch = useMemo(
    () =>
      preference.pathname === pathname
        ? preference
        : {
            section: active?.section.id || null,
            module: active?.module.id || null,
            pathname,
          },
    [preference, pathname, active]
  );

  function setBranch(value: OpenBranch) {
    setPreference({ ...value, pathname });
  }

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(branch));
    } catch {
      /* Navigation also works without storage. */
    }
  }, [branch, storageKey]);

  const { data: counts } = useQuery({
    queryKey: ["navigation-counts", user?.orgId, user?.id],
    enabled: hasPermission("settings.manage"),
    queryFn: async () => {
      const [messages, inquiries] = await Promise.all([
        api.get("/v1/tendering/super-admin/messages"),
        api.get("/v1/tendering/super-admin/inquiries"),
      ]);
      const items = inquiries.data.data as Array<{ status: string }>;
      return {
        messages: Number(messages.data.data.unread || 0),
        inquiries: items.filter((item) => item.status === "pending").length,
      };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const role = isAdministrator
    ? "roles.administrator"
    : isSupplier
      ? "roles.supplier"
      : user?.roles.some((item) => item.slug === "viewer")
        ? "roles.viewer"
        : "roles.officer";
  const badge = (value: number) =>
    value > 0 ? (
      <span className="bg-primary/10 text-primary ms-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
        {value > 99 ? "99+" : value}
      </span>
    ) : null;

  return (
    <SidebarRoot className="">
      <SidebarHeader className="border-sidebar-border border-b px-4 py-4">
        <Link
          to={overview}
          onClick={closeMobile}
          aria-label={t("overview")}
          className="flex items-center gap-3 group-data-[state=collapsed]:justify-center"
        >
          <LogoMark size={32} className="" />
          <SidebarLabel className="min-w-0 leading-tight">
            <span className="block text-sm font-bold tracking-tight">TenderRank</span>
            <span className="text-muted-foreground block text-[10px] font-medium">
              {t("workspace")}
            </span>
          </SidebarLabel>
        </Link>
      </SidebarHeader>

      <SidebarContent className="space-y-5 px-2 py-4" aria-label={t("primaryNavigation")}>
        <Link
          to={overview}
          onClick={closeMobile}
          title={compact ? t("overview") : undefined}
          aria-current={pathname === overview ? "page" : undefined}
          className={cn(
            "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
            compact && "justify-center px-0",
            pathname === overview
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutDashboard size={17} className="shrink-0" />
          <SidebarLabel className="">{t("overview")}</SidebarLabel>
        </Link>

        <div>
          <SidebarLabel className="text-muted-foreground/60 mb-2 block px-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
            {t("workspaceMenu")}
          </SidebarLabel>
          <ul className="space-y-1">
            {sections.map((section) => {
              const opened = branch.section === section.id && !compact;
              const selected = active?.section.id === section.id;
              const Icon = section.icon;
              return (
                <li key={section.id} data-nav-section={section.id}>
                  <button
                    type="button"
                    aria-label={t(section.label)}
                    aria-expanded={opened}
                    aria-controls={opened ? `navigation-${section.id}` : undefined}
                    title={compact ? t(section.label) : undefined}
                    onClick={() => {
                      if (compact) setOpen(true);
                      setBranch({ section: opened ? null : section.id, module: null });
                    }}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-start text-[13px] font-medium transition-colors",
                      compact && "justify-center px-0",
                      compact && selected && "bg-primary/10",
                      selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      opened ? "bg-accent/70" : "hover:bg-accent/60"
                    )}
                  >
                    <Icon size={17} className="shrink-0" />
                    <SidebarLabel className="flex-1">{t(section.label)}</SidebarLabel>
                    {!compact &&
                      (opened ? (
                        <ChevronDown size={14} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={14} className="text-muted-foreground rtl:rotate-180" />
                      ))}
                  </button>
                  {opened && (
                    <ul
                      id={`navigation-${section.id}`}
                      className="border-sidebar-border ms-5 mt-1 space-y-0.5 border-s ps-2"
                    >
                      {section.modules.map((module) => {
                        const moduleOpen = branch.module === module.id;
                        const moduleSelected = active?.module.id === module.id && selected;
                        const moduleCount = module.pages.reduce(
                          (total, page) => total + (page.badge ? counts?.[page.badge] || 0 : 0),
                          0
                        );
                        return (
                          <li key={module.id} data-nav-module={module.id}>
                            <button
                              type="button"
                              aria-label={t(module.label)}
                              aria-expanded={moduleOpen}
                              aria-controls={
                                moduleOpen ? `navigation-${section.id}-${module.id}` : undefined
                              }
                              onClick={() =>
                                setBranch({
                                  section: section.id,
                                  module: moduleOpen ? null : module.id,
                                })
                              }
                              className={cn(
                                "hover:bg-accent/70 flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-start text-[12px] transition-colors",
                                moduleSelected
                                  ? "text-foreground font-semibold"
                                  : "text-muted-foreground font-medium"
                              )}
                            >
                              {moduleOpen ? (
                                <ChevronDown size={12} className="shrink-0" />
                              ) : (
                                <ChevronRight size={12} className="shrink-0 rtl:rotate-180" />
                              )}
                              <span className="flex-1">{t(module.label)}</span>
                              {badge(moduleCount)}
                            </button>
                            {moduleOpen && (
                              <ul
                                id={`navigation-${section.id}-${module.id}`}
                                className="border-sidebar-border ms-3 mt-0.5 space-y-0.5 border-s ps-2"
                              >
                                {module.pages.map((page) => {
                                  const pageSelected = active?.page.id === page.id;
                                  return (
                                    <li key={page.id}>
                                      <Link
                                        to={page.to}
                                        onClick={closeMobile}
                                        data-nav-leaf={page.id}
                                        aria-current={pageSelected ? "page" : undefined}
                                        className={cn(
                                          "flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs transition-colors",
                                          pageSelected
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                                        )}
                                      >
                                        <Circle
                                          size={5}
                                          fill={pageSelected ? "currentColor" : "none"}
                                          className="shrink-0"
                                        />
                                        <span className="flex-1">{t(page.label)}</span>
                                        {page.badge && badge(counts?.[page.badge] || 0)}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="border-sidebar-border border-t pt-3">
          <Link
            to="/"
            onClick={closeMobile}
            title={compact ? t("publicPortal") : undefined}
            className={cn(
              "text-muted-foreground hover:bg-accent hover:text-foreground flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-xs transition-colors",
              compact && "justify-center px-0"
            )}
          >
            <Globe2 size={16} className="shrink-0" />
            <SidebarLabel className="">{t("publicPortal")}</SidebarLabel>
          </Link>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2">
        <div className="bg-sidebar-accent/50 flex items-center gap-2.5 rounded-lg px-2 py-2.5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:bg-transparent group-data-[state=collapsed]:px-0">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <SidebarLabel className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{name}</span>
            <span className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
              <ShieldCheck size={10} />
              {t(role)}
            </span>
          </SidebarLabel>
        </div>
      </SidebarFooter>
    </SidebarRoot>
  );
}
