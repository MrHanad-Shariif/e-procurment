import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useUser, useToggleUserActive } from "@/features/administration/users/hooks/useUsers";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";

export function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser(id || "");
  const toggleActive = useToggleUserActive(id || "");

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!user) return <div className="p-6">{t("users.notFound")}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <Button variant="ghost" onClick={() => navigate("/users")}>
        <ArrowLeft className="me-2 h-4 w-4" />
        {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h1>
        <PermissionGate permission="user.deactivate">
          <Button
            variant={user.isActive ? "destructive" : "default"}
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
          >
            {user.isActive ? t("users.deactivate") : t("users.activate")}
          </Button>
        </PermissionGate>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("users.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("auth.email")}</span>
              <p>{user.email}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("users.language")}</span>
              <p>{user.preferredLanguage}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("users.status")}</span>
              <p>{user.isActive ? t("users.active") : t("users.inactive")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("users.roles")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.roles.map((role: { id: string; name: string; slug: string }) => (
                <div key={role.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-muted-foreground">{role.slug}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("users.permissions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {user.permissions.map((perm: string) => (
                <span key={perm} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  {perm}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
