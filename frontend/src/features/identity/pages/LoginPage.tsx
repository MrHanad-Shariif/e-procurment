import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { AuthLayout } from "@/features/identity/components/public/AuthLayout";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";

export function LoginPage() {
  const { t } = useTranslation("website");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState(localStorage.getItem("org_slug") || "default");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(false);
    setLoading(true);
    try {
      await login(email.trim(), password, orgSlug.trim().toLowerCase());
      navigate("/dashboard");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <span className="bg-background text-primary mb-6 flex size-10 items-center justify-center rounded-xl border">
        <LockKeyhole className="size-[18px]" />
      </span>
      <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
        {t("auth.signInEyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("auth.loginTitle")}</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-6">{t("auth.loginDescription")}</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
          >
            {t("auth.loginError")}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="organization" className="text-xs">
            {t("auth.workspaceAddress")}
          </Label>
          <Input
            id="organization"
            autoComplete="organization"
            value={orgSlug}
            onChange={(event) => setOrgSlug(event.target.value)}
            placeholder="default"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="bg-background/40 h-11 rounded-lg px-3 text-sm"
          />
          <p className="text-muted-foreground text-[10px] leading-5">{t("auth.workspaceHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs">
            {t("auth.email")}
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
            className="bg-background/40 h-11 rounded-lg px-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs">
            {t("auth.password")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="bg-background/40 h-11 rounded-lg px-3 pe-11 text-sm"
            />
            <button
              type="button"
              aria-label={t(showPassword ? "auth.hidePassword" : "auth.showPassword")}
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-lg"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="h-11 w-full justify-between rounded-lg px-4 text-xs"
          disabled={loading}
        >
          {t(loading ? "auth.signingIn" : "auth.signIn")}
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4 rtl:rotate-180" />
          )}
        </Button>
      </form>
      <p className="text-muted-foreground mt-7 text-center text-xs">
        {t("auth.noAccount")}{" "}
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          {t("auth.createWorkspace")}
        </Link>
      </p>
      <p className="text-muted-foreground mt-9 border-t pt-5 text-center text-[10px] leading-5">
        {t("auth.loginNote")}
      </p>
    </AuthLayout>
  );
}
