import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useRole, usePermissions, useSetRolePermissions } from "@/features/administration/roles/hooks/useRoles";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import type { PermissionGroup } from "@/shared/types/organization";

export function RoleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: role, isLoading } = useRole(id || "");
  const { data: permissionGroups } = usePermissions();
  const setPermissions = useSetRolePermissions(id || "");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (role) {
      setSelectedIds(new Set(role.permissions.map((p: { id: string }) => p.id)));
    }
  }, [role]);

  function togglePermission(permId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  }

  async function handleSave() {
    await setPermissions.mutateAsync([...selectedIds]);
  }

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;
  if (!role) return <div className="p-6">{t("roles.notFound")}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <Button variant="ghost" onClick={() => navigate("/roles")}>
        <ArrowLeft className="me-2 h-4 w-4" />
        {t("common.back")}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{role.name}</h1>
          <p className="text-sm text-muted-foreground">{role.slug}</p>
        </div>
        <PermissionGate permission="role.edit">
          <Button onClick={handleSave} disabled={setPermissions.isPending}>
            {setPermissions.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </PermissionGate>
      </div>

      {role.description && (
        <p className="text-muted-foreground">{role.description}</p>
      )}

      <div className="space-y-4">
        {(permissionGroups as PermissionGroup[])?.map((group) => (
          <Card key={group.group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize">{group.group.replace(/_/g, " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.permissions.map((perm) => {
                  const isSelected = selectedIds.has(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => togglePermission(perm.id)}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                      }`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <div className="font-medium">{perm.codename}</div>
                        {perm.description && (
                          <div className="text-xs text-muted-foreground">{perm.description}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
