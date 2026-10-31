import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/shared/lib/api";
import type { Organization } from "@/shared/types/organization";
import { useAuth } from "@/features/identity/hooks/useAuth";

interface TenantState {
  organization: Organization | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantState>({
  organization: null,
  isLoading: true,
});

export function useTenant() {
  return useContext(TenantContext);
}

function getOrgSlug(): string {
  const stored = localStorage.getItem("org_slug");
  if (stored) return stored;

  const parts = window.location.hostname.split(".");
  const isIpv4 = parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part));
  if (parts.length > 2 && !isIpv4) return parts[0];

  return "default";
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    const slug = getOrgSlug();
    api
      .get(`/v1/org/${slug}`, { signal: controller.signal })
      .then(({ data }) => setOrganization(data.data))
      .catch(() => {
        if (!controller.signal.aborted) setOrganization(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [user?.orgId]);

  useEffect(() => {
    if (!organization) return;
    const root = document.documentElement;
    if (organization.primaryColor) {
      root.style.setProperty("--brand-primary", organization.primaryColor);
    }
    if (organization.secondaryColor) {
      root.style.setProperty("--brand-secondary", organization.secondaryColor);
    }
  }, [organization]);

  return (
    <TenantContext.Provider value={{ organization, isLoading }}>{children}</TenantContext.Provider>
  );
}
