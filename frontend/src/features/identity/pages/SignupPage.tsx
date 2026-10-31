import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { ArrowRight, Building2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { AuthLayout } from "@/features/identity/components/public/AuthLayout";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";

export function SignupPage() {
  const { t, i18n } = useTranslation("website");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({
        organization_name: name.trim(),
        org_slug: slug,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        preferred_language: (i18n.resolvedLanguage || "en").toUpperCase(),
      });
      navigate("/dashboard");
    } catch (failure) {
      setError(
        isAxiosError(failure) && failure.response?.status === 409
          ? "auth.addressTaken"
          : isAxiosError(failure) && failure.response?.status === 429
            ? "auth.tooManyAttempts"
            : "auth.signupError"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout signup>
      <span className="bg-background text-primary mb-5 flex size-10 items-center justify-center rounded-xl border">
        <Building2 className="size-[18px]" />
      </span>
      <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
        {t("auth.signupEyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("auth.signupTitle")}</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-6">{t("auth.signupDescription")}</p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
          >
            {t(error)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first-name" className="text-xs">
              {t("auth.firstName")}
            </Label>
            <Input
              id="first-name"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              maxLength={80}
              className="bg-background/40 h-10 rounded-lg px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name" className="text-xs">
              {t("auth.lastName")}
            </Label>
            <Input
              id="last-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              maxLength={80}
              className="bg-background/40 h-10 rounded-lg px-3"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization-name" className="text-xs">
            {t("auth.organizationName")}
          </Label>
          <Input
            id="organization-name"
            autoComplete="organization"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugEdited)
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .normalize("NFKD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                    .slice(0, 48)
                );
            }}
            required
            minLength={2}
            maxLength={120}
            className="bg-background/40 h-10 rounded-lg px-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-address" className="text-xs">
            {t("auth.workspaceAddress")}
          </Label>
          <Input
            id="workspace-address"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value.toLowerCase());
            }}
            required
            minLength={3}
            maxLength={48}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            autoCapitalize="none"
            spellCheck={false}
            className="bg-background/40 h-10 rounded-lg px-3"
          />
          <p className="text-muted-foreground text-[10px] leading-4">{t("auth.addressHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-xs">
            {t("auth.email")}
          </Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="bg-background/40 h-10 rounded-lg px-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-xs">
            {t("auth.password")}
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              minLength={10}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="bg-background/40 h-10 rounded-lg px-3 pe-11"
            />
            <button
              type="button"
              aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")}
              className="text-muted-foreground absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-lg"
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-muted-foreground text-[10px] leading-4">{t("auth.passwordHint")}</p>
        </div>
        <p className="text-muted-foreground text-[10px] leading-5">{t("auth.signupNote")}</p>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full justify-between rounded-lg px-4 text-xs"
        >
          {t(loading ? "auth.creating" : "auth.createWorkspace")}
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4 rtl:rotate-180" />
          )}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-xs">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
