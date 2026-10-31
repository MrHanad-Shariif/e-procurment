import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/procurement/button";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">{t("common.noResults")}</p>
      <Button render={<Link to="/" />} nativeButton={false}>{t("nav.dashboard")}</Button>
    </div>
  );
}
