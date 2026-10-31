import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useOrgSettings() {
  return useQuery({
    queryKey: ["settings", "org"],
    queryFn: async () => {
      const { data } = await api.get("/v1/settings/");
      return data.data;
    },
  });
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch("/v1/settings/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useSmtpSettings() {
  return useQuery({
    queryKey: ["settings", "smtp"],
    queryFn: async () => {
      const { data } = await api.get("/v1/settings/smtp");
      return data.data;
    },
  });
}

export function useUpdateSmtpSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.put("/v1/settings/smtp", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "smtp"] }),
  });
}

export function useSessionSettings() {
  return useQuery({
    queryKey: ["settings", "sessions"],
    queryFn: async () => {
      const { data } = await api.get("/v1/settings/sessions");
      return data.data;
    },
  });
}

export function useUpdateSessionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (maxConcurrentSessions: number) => {
      const { data } = await api.put("/v1/settings/sessions", {
        max_concurrent_sessions: maxConcurrentSessions,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "sessions"] }),
  });
}
