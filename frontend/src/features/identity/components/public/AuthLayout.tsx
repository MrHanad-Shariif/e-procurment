import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, FileText, Layers3, ShieldCheck, ShoppingCart } from "lucide-react";
import { PublicHeader } from "@/features/identity/components/public/PublicHeader";

export function AuthLayout({
  children,
  signup = false,
}: {
  children: ReactNode;
  signup?: boolean;
}) {
  const { t } = useTranslation("website");
  return (
    <div className="bg-card min-h-svh">
      <PublicHeader simple />
      <main className="mx-auto grid min-h-[calc(100svh-81px)] max-w-[1500px] lg:grid-cols-2">
        <aside className="bg-background relative m-5 hidden flex-col justify-between overflow-hidden rounded-2xl border p-10 lg:flex xl:p-14">
          <div
            className="bg-primary/6 pointer-events-none absolute -end-16 -top-24 size-96 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="text-primary inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <Layers3 className="size-4" />
              {t("auth.eyebrow")}
            </span>
            <h2 className="mt-12 max-w-sm text-[42px] leading-[1.12] font-semibold tracking-[-0.035em]">
              {t(signup ? "auth.signupPanelTitle" : "auth.panelTitle")}
            </h2>
            <p className="text-muted-foreground mt-5 max-w-sm text-sm leading-7">
              {t("auth.panelDescription")}
            </p>
            <div className="mt-12 space-y-3">
              {[
                { icon: FileText, key: "requestStep", status: "submitted" },
                { icon: ShieldCheck, key: "approvalStep", status: "approved" },
                { icon: ShoppingCart, key: "orderStep", status: "ready" },
              ].map(({ icon: Icon, key, status }, index) => (
                <div
                  key={key}
                  className={`bg-card flex items-center gap-3 rounded-xl border p-4 shadow-sm ${index === 1 ? "border-primary/20 ms-5" : "me-5"}`}
                >
                  <span className="bg-background text-primary flex size-9 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{t(`preview.${key}`)}</p>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {t(`auth.step${index + 1}`)}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] ${index === 1 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                  >
                    {index === 1 && <Check className="size-2.5" />}
                    {t(`preview.${status}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-12 border-t pt-6">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {["roles", "languages", "visibility"].map((key) => (
                <span
                  key={key}
                  className="text-muted-foreground flex items-center gap-1.5 text-[10px]"
                >
                  <Check className="text-primary size-3" />
                  {t(`teams.${key}.title`)}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground mt-5 text-[10px]">{t("preview.label")}</p>
          </div>
        </aside>
        <div className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[410px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
