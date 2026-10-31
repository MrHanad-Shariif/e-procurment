import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useSmtpSettings, useUpdateSmtpSettings } from "@/features/administration/settings/hooks/useSettings";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

export function SmtpSettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSmtpSettings();
  const updateSmtp = useUpdateSmtpSettings();

  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    email_from_name: "",
    email_from_address: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        smtp_host: settings.smtpHost || "",
        smtp_port: settings.smtpPort || 587,
        smtp_username: settings.smtpUsername || "",
        smtp_password: "",
        email_from_name: settings.emailFromName || "",
        email_from_address: settings.emailFromAddress || "",
      });
    }
  }, [settings]);

  function handleChange(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateSmtp.mutateAsync(form);
  }

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <h1 className="text-2xl font-bold">{t("settings.smtpSettings")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.emailConfiguration")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("settings.smtpHost")}</Label>
                <Input value={form.smtp_host} onChange={(e) => handleChange("smtp_host", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.smtpPort")}</Label>
                <Input type="number" value={form.smtp_port} onChange={(e) => handleChange("smtp_port", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.smtpUsername")}</Label>
                <Input value={form.smtp_username} onChange={(e) => handleChange("smtp_username", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.smtpPassword")}</Label>
                <Input type="password" value={form.smtp_password} onChange={(e) => handleChange("smtp_password", e.target.value)} placeholder={settings?.smtpPasswordSet ? "********" : ""} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.emailFromName")}</Label>
                <Input value={form.email_from_name} onChange={(e) => handleChange("email_from_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.emailFromAddress")}</Label>
                <Input type="email" value={form.email_from_address} onChange={(e) => handleChange("email_from_address", e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={updateSmtp.isPending}>
              {updateSmtp.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
