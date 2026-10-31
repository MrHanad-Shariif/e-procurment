import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useSuppliers(page = 1, perPage = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ["suppliers", page, perPage, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/v1/suppliers/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/suppliers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/suppliers/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/v1/suppliers/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplierStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch(`/v1/suppliers/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/v1/suppliers/${id}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
