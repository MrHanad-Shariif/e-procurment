import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useNotifications(page = 1, perPage = 20, unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", page, perPage, unreadOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (unreadOnly) params.set("unreadOnly", "true");
      const { data } = await api.get(`/v1/notifications/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await api.get("/v1/notifications/unread-count");
      return data.data.count as number;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/v1/notifications/mark-all-read");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
