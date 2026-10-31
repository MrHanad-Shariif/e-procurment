import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Lock, Trash2 } from "lucide-react";
import { useRoles, useDeleteRole } from "@/features/administration/roles/hooks/useRoles";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { Role } from "@/shared/types/organization";

export function RoleListPage() {
  const { t } = useTranslation();
  const { data: roles, isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("roles.title")}</h1>
        <PermissionGate permission="role.create">
          <Button render={<Link to="/roles/new" />} nativeButton={false}>
              <Plus className="me-2 h-4 w-4" />
              {t("roles.createRole")}
            </Button>
        </PermissionGate>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(roles as Role[])?.map((role) => (
          <Card key={role.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <Link to={`/roles/${role.id}`} className="group">
                  <h3 className="font-semibold group-hover:text-primary">{role.name}</h3>
                  <p className="text-xs text-muted-foreground">{role.slug}</p>
                </Link>
                <div className="flex gap-1">
                  {role.isSystem && (
                    <span title={t("roles.systemRole")}>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {!role.isSystem && (
                    <PermissionGate permission="role.delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteRole.mutate(role.id)}
                        disabled={deleteRole.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              </div>
              {role.description && (
                <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {role.permissions.length} {t("roles.permissions")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
