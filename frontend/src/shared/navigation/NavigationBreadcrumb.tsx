import { ChevronRight, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@/shared/navigation/useNavigation";
import { findActiveBranch } from "@/shared/navigation/navigation";

export function NavigationBreadcrumb() {
  const { t } = useTranslation("navigation");
  const { pathname } = useLocation();
  const { sections, overview } = useNavigation();
  const active = findActiveBranch(sections, pathname);
  return (
    <nav
      aria-label={t("breadcrumb")}
      className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]"
    >
      <Link to={overview} aria-label={t("overview")} className="hover:text-foreground shrink-0">
        <LayoutDashboard size={13} />
      </Link>
      {active ? (
        <>
          <ChevronRight size={11} className="shrink-0 rtl:rotate-180" />
          <span className="hidden sm:inline">{t(active.section.label)}</span>
          <ChevronRight size={11} className="hidden shrink-0 sm:block rtl:rotate-180" />
          <span className="hidden sm:inline">{t(active.module.label)}</span>
          <ChevronRight size={11} className="hidden shrink-0 sm:block rtl:rotate-180" />
          <span aria-current="page" className="text-foreground truncate font-medium">
            {t(active.page.label)}
          </span>
        </>
      ) : (
        <span className="text-foreground font-medium">{t("overview")}</span>
      )}
    </nav>
  );
}
