import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Globe2, Package2 } from "lucide-react";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { ThemeToggle } from "@/shared/brand/ProcurementThemeToggle";
import { Button } from "@/shared/ui/procurement/button";

export function Brand() {
  const { t } = useTranslation("common");
  return (
    <Link to="/" className="inline-flex shrink-0 items-center gap-2.5" aria-label={t("app.name")}>
      <span className="bg-primary flex size-9 items-center justify-center rounded-xl text-white">
        <Package2 className="size-5" />
      </span>
      <span className="text-base font-bold tracking-tight">{t("app.name")}</span>
    </Link>
  );
}

export function PublicControls() {
  const { t, i18n } = useTranslation("website");
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-muted-foreground flex items-center gap-1 text-xs">
        <Globe2 className="size-3.5" />
        <select
          aria-label={t("language")}
          className="text-foreground w-12 bg-transparent py-2 text-xs outline-none"
          value={i18n.resolvedLanguage || "en"}
          onChange={(event) => void i18n.changeLanguage(event.target.value)}
        >
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="ar">AR</option>
        </select>
      </label>
      <ThemeToggle />
    </div>
  );
}

export function PublicHeader({ simple = false }: { simple?: boolean }) {
  const { t } = useTranslation("website");
  const { isAuthenticated } = useAuth();
  return (
    <header className="border-border/70 bg-card/80 relative z-20 border-b">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <Brand />
        {!simple && (
          <nav
            className="text-muted-foreground hidden items-center gap-8 text-xs font-medium lg:flex"
            aria-label={t("navigation")}
          >
            <a href="#platform" className="hover:text-foreground transition-colors">
              {t("nav.platform")}
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              {t("nav.workflow")}
            </a>
            <a href="#built-for-teams" className="hover:text-foreground transition-colors">
              {t("nav.teams")}
            </a>
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4">
          <PublicControls />
          {!simple && (
            <>
              <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-xs font-medium">
                {t(isAuthenticated ? "nav.dashboard" : "nav.signIn")}
              </Link>
              <Button
                className="hidden h-9 gap-1.5 px-3 text-xs md:inline-flex"
                render={<Link to={isAuthenticated ? "/dashboard" : "/signup"} />}
                nativeButton={false}
              >
                {t(isAuthenticated ? "nav.dashboard" : "nav.start")}
                <ArrowUpRight className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
