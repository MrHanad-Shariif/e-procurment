import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  FileText,
  GitPullRequestArrow,
  Globe2,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Send,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { PublicHeader, Brand } from "@/features/identity/components/public/PublicHeader";
import { Button } from "@/shared/ui/procurement/button";
import { useAuth } from "@/features/identity/hooks/useAuth";

function ProductPreview() {
  const { t } = useTranslation("website");
  return (
    <div
      className="bg-card relative mx-auto mt-14 w-full max-w-5xl rounded-2xl border p-1.5 shadow-[0_25px_80px_-35px_rgba(30,64,175,0.22)] sm:mt-16 sm:p-2"
      aria-label={t("preview.label")}
    >
      <div className="bg-background overflow-hidden rounded-xl border text-start">
        <div className="bg-card flex h-10 items-center justify-between border-b px-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className="bg-border size-2 rounded-full" />
            ))}
          </div>
          <span className="text-muted-foreground text-[9px] font-medium tracking-wide">
            {t("preview.label")}
          </span>
          <LockKeyhole className="text-muted-foreground size-3" />
        </div>
        <div className="flex min-h-[335px] sm:min-h-[385px]">
          <aside className="bg-card hidden w-44 shrink-0 border-e p-4 sm:block">
            <div className="mb-8 flex items-center gap-2 text-[11px] font-semibold">
              <Layers3 className="text-primary size-4" />
              {t("preview.workspace")}
            </div>
            {[
              { icon: LayoutDashboard, label: "overview" },
              { icon: FileText, label: "requests" },
              { icon: Send, label: "quotations" },
              { icon: ShoppingCart, label: "orders" },
              { icon: Building2, label: "suppliers" },
            ].map(({ icon: Icon, label }, index) => {
              return (
                <div
                  key={String(label)}
                  className={`mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[10px] ${index === 0 ? "bg-primary/8 text-primary font-medium" : "text-muted-foreground"}`}
                >
                  <Icon className="size-3.5" />
                  {t(`preview.${label}`)}
                </div>
              );
            })}
          </aside>
          <div className="flex-1 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[9px]">{t("preview.overview")}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{t("preview.title")}</p>
              </div>
              <span className="bg-card rounded-md border px-2.5 py-1.5 text-[9px] font-medium">
                {t("preview.newRequest")}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: FileText, title: "requests", status: "review" },
                { icon: Send, title: "quotations", status: "compare" },
                { icon: ShoppingCart, title: "orders", status: "deliver" },
              ].map(({ icon: Icon, title, status }) => (
                <div key={title} className="bg-card rounded-lg border p-3">
                  <Icon className="text-primary mb-2.5 size-4" />
                  <p className="text-[10px] font-semibold">{t(`preview.${title}`)}</p>
                  <p className="text-muted-foreground mt-1 text-[9px]">{t(`preview.${status}`)}</p>
                </div>
              ))}
            </div>
            <div className="bg-card mt-4 rounded-lg border">
              <div className="border-b px-4 py-3 text-[10px] font-semibold">
                {t("preview.workflow")}
              </div>
              {[
                { icon: FileText, title: "requestStep", status: "submitted" },
                { icon: ShieldCheck, title: "approvalStep", status: "approved" },
                { icon: ShoppingCart, title: "orderStep", status: "ready" },
              ].map(({ icon: Icon, title, status }, index) => (
                <div
                  key={title}
                  className="flex items-center gap-3 border-b px-4 py-3 last:border-0"
                >
                  <Icon className="text-muted-foreground size-3.5" />
                  <span className="flex-1 text-[10px] font-medium">{t(`preview.${title}`)}</span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] ${index === 1 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                  >
                    {index === 1 && <Check className="size-2.5" />}
                    {t(`preview.${status}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation("website");
  const { isAuthenticated } = useAuth();
  const start = isAuthenticated ? "/dashboard" : "/signup";
  return (
    <div className="bg-card min-h-screen">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[650px] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.07),transparent_65%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl text-center">
            <span className="bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium">
              <span className="bg-primary size-1.5 rounded-full" />
              {t("hero.eyebrow")}
              <ChevronRight className="size-3 rtl:rotate-180" />
            </span>
            <h1 className="mx-auto mt-7 max-w-4xl text-[42px] leading-[1.08] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[76px]">
              {t("hero.title")}
              <br />
              <span className="text-primary">{t("hero.accent")}</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-sm leading-7 sm:text-base">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                className="h-11 gap-3 rounded-lg px-5 text-xs"
                render={<Link to={start} />}
                nativeButton={false}
              >
                {t(isAuthenticated ? "nav.dashboard" : "hero.cta")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
              <Button
                variant="outline"
                className="bg-card h-11 rounded-lg px-5 text-xs"
                render={<a href="#workflow" />}
                nativeButton={false}
              >
                {t("hero.secondary")}
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-[10px]">{t("hero.note")}</p>
            <ProductPreview />
            <div className="text-muted-foreground mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-[11px]">
              {["requests", "quotations", "orders", "suppliers"].map((key) => (
                <span key={key} className="flex items-center gap-2">
                  <CircleCheck className="text-primary size-3.5" />
                  {t(`preview.${key}`)}
                </span>
              ))}
            </div>
          </div>
        </section>
        <section
          id="platform"
          className="bg-background/60 scroll-mt-8 border-y px-5 py-20 sm:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-2 md:items-end">
              <div>
                <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
                  {t("platform.eyebrow")}
                </p>
                <h2 className="mt-4 max-w-lg text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                  {t("platform.title")}
                </h2>
              </div>
              <p className="text-muted-foreground max-w-md text-sm leading-7 md:justify-self-end">
                {t("platform.description")}
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: GitPullRequestArrow, key: "requests" },
                { icon: Building2, key: "suppliers" },
                { icon: ShoppingCart, key: "orders" },
              ].map(({ icon: Icon, key }) => (
                <article key={key} className="bg-card rounded-xl border p-6">
                  <span className="bg-background text-primary flex size-10 items-center justify-center rounded-xl border">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-base font-semibold tracking-tight">
                    {t(`platform.${key}.title`)}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-xs leading-6">
                    {t(`platform.${key}.description`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="workflow" className="scroll-mt-8 px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
                {t("workflow.eyebrow")}
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {t("workflow.title")}
              </h2>
              <p className="text-muted-foreground mt-5 max-w-sm text-sm leading-7">
                {t("workflow.description")}
              </p>
              <Link
                to={start}
                className="text-primary mt-7 inline-flex items-center gap-2 text-xs font-semibold"
              >
                {t("hero.cta")}
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <ol className="space-y-0">
              {["request", "review", "source", "order"].map((key, index) => (
                <li key={key} className="relative flex gap-5 pb-8 last:pb-0">
                  {index < 3 && (
                    <span
                      className="bg-border absolute inset-y-10 start-[17px] w-px"
                      aria-hidden="true"
                    />
                  )}
                  <span className="bg-card text-primary relative flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums">
                    0{index + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-sm font-semibold">{t(`workflow.${key}.title`)}</h3>
                    <p className="text-muted-foreground mt-2 text-xs leading-6">
                      {t(`workflow.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section
          id="built-for-teams"
          className="bg-background/60 scroll-mt-8 border-y px-5 py-16 sm:px-8"
        >
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {[
              { icon: ShieldCheck, key: "roles" },
              { icon: Globe2, key: "languages" },
              { icon: CheckCheck, key: "visibility" },
            ].map(({ icon: Icon, key }) => (
              <div key={key} className="flex gap-4">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold">{t(`teams.${key}.title`)}</h3>
                  <p className="text-muted-foreground mt-2 text-xs leading-6">
                    {t(`teams.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="px-5 py-20 text-center sm:px-8 lg:py-24">
          <span className="bg-background text-primary mx-auto flex size-11 items-center justify-center rounded-xl border">
            <Layers3 className="size-5" />
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-sm leading-7">
            {t("cta.description")}
          </p>
          <Button
            className="mt-7 h-11 gap-3 px-5 text-xs"
            render={<Link to={start} />}
            nativeButton={false}
          >
            {t(isAuthenticated ? "nav.dashboard" : "hero.cta")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </section>
      </main>
      <footer className="border-t px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <Brand />
          <span className="text-muted-foreground text-[10px]">
            © {new Date().getFullYear()} {t("footer")}
          </span>
          <Link to="/login" className="text-muted-foreground hover:text-foreground text-xs">
            {t("nav.signIn")}
            <span className="ms-1.5" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
