import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useUsers(page = 1, perPage = 20, search?: string) {
  return useQuery({
    queryKey: ["users", page, perPage, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      const { data } = await api.get(`/v1/users/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/users/${userId}`);
      return data.data;
    },
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/users/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/v1/users/${userId}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useToggleUserActive(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/v1/users/${userId}/activate`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
