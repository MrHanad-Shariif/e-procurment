import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useOrgSettings, useUpdateOrgSettings } from "@/features/administration/settings/hooks/useSettings";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Label } from "@/shared/ui/procurement/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

export function OrgSettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useOrgSettings();
  const updateSettings = useUpdateOrgSettings();

  const [form, setForm] = useState({
    name: "",
    system_name: "",
    logo_url: "",
    primary_color: "",
    secondary_color: "",
    default_language: "EN",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || "",
        system_name: settings.systemName || "",
        logo_url: settings.logoUrl || "",
        primary_color: settings.primaryColor || "",
        secondary_color: settings.secondaryColor || "",
        default_language: settings.defaultLanguage || "EN",
      });
    }
  }, [settings]);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateSettings.mutateAsync(form);
  }

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <h1 className="text-2xl font-bold">{t("settings.orgSettings")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.branding")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("settings.orgName")}</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.systemName")}</Label>
                <Input value={form.system_name} onChange={(e) => handleChange("system_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.logoUrl")}</Label>
                <Input value={form.logo_url} onChange={(e) => handleChange("logo_url", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.defaultLanguage")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.default_language}
                  onChange={(e) => handleChange("default_language", e.target.value)}
                >
                  <option value="EN">English</option>
                  <option value="AR">Arabic</option>
                  <option value="FR">French</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.primaryColor")}</Label>
                <div className="flex gap-2">
                  <Input value={form.primary_color} onChange={(e) => handleChange("primary_color", e.target.value)} />
                  <input
                    type="color"
                    value={form.primary_color || "#000000"}
                    onChange={(e) => handleChange("primary_color", e.target.value)}
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-md border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.secondaryColor")}</Label>
                <div className="flex gap-2">
                  <Input value={form.secondary_color} onChange={(e) => handleChange("secondary_color", e.target.value)} />
                  <input
                    type="color"
                    value={form.secondary_color || "#000000"}
                    onChange={(e) => handleChange("secondary_color", e.target.value)}
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-md border"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
