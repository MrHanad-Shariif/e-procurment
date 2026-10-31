import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function usePurchaseRequisitions(page = 1, perPage = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ["prs", page, perPage, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/v1/purchase-requisitions/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function usePurchaseRequisition(id: string) {
  return useQuery({
    queryKey: ["prs", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/purchase-requisitions/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/purchase-requisitions/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prs"] }),
  });
}

export function useUpdatePr(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/v1/purchase-requisitions/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prs"] }),
  });
}

export function usePrAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
      const { data } = await api.post(`/v1/purchase-requisitions/${id}/action`, { action, notes });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prs"] }),
  });
}

export function useDeletePr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/v1/purchase-requisitions/${id}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prs"] }),
  });
}
