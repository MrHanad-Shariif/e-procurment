import { useMemo } from "react";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { createNavigation } from "@/shared/navigation/navigation";

export function useNavigation() {
  const { user, hasPermission } = useAuth();
  const isAdministrator = Boolean(user?.roles.some((role) => role.slug === "admin"));
  const isSupplier = Boolean(user?.roles.some((role) => role.slug === "supplier"));
  const sections = useMemo(
    () => createNavigation({ isAdministrator, isSupplier, hasPermission }),
    [isAdministrator, isSupplier, hasPermission]
  );
  const overview = isAdministrator ? "/super-admin" : isSupplier ? "/supplier" : "/dashboard";
  return { user, hasPermission, sections, overview, isAdministrator, isSupplier };
}
