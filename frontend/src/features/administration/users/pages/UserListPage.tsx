import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, Shield, ShieldOff } from "lucide-react";
import { useUsers } from "@/features/administration/users/hooks/useUsers";
import { PermissionGate } from "@/features/identity/components/PermissionGate";
import { Button } from "@/shared/ui/procurement/button";
import { Input } from "@/shared/ui/procurement/input";
import { Card, CardContent } from "@/shared/ui/procurement/card";
import type { User } from "@/shared/types/auth";

export function UserListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers(page, 20, search || undefined);

  if (isLoading) return <div className="p-6">{t("common.loading")}</div>;

  const users: User[] = data?.items || [];
  const meta = data?.meta;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("users.title")}</h1>
        <PermissionGate permission="user.create">
          <Button render={<Link to="/users/new" />} nativeButton={false}>
              <Plus className="me-2 h-4 w-4" />
              {t("users.createUser")}
            </Button>
        </PermissionGate>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="ps-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("users.name")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("auth.email")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.roles")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/users/${user.id}`} className="font-medium text-primary hover:underline">
                        {user.firstName} {user.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span key={role.id} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Shield className="h-3 w-3" />
                          {t("users.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <ShieldOff className="h-3 w-3" />
                          {t("users.inactive")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("common.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("common.next")}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
