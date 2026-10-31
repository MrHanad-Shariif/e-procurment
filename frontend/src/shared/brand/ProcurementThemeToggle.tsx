import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/procurement/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation("website");
  const dark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-9 shrink-0 rounded-full"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={t(dark ? "theme.light" : "theme.dark")}
      title={t(dark ? "theme.light" : "theme.dark")}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}
