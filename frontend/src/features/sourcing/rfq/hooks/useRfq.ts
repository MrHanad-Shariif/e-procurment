import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useRfqs(page = 1, perPage = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ["rfqs", page, perPage, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/v1/rfq/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useRfq(id: string) {
  return useQuery({
    queryKey: ["rfqs", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/rfq/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/rfq/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }),
  });
}

export function useRfqAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: string) => {
      const { data } = await api.post(`/v1/rfq/${id}/action`, { action });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }),
  });
}

export function useInviteSuppliers(rfqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplierIds: string[]) => {
      const { data } = await api.post(`/v1/rfq/${rfqId}/invite`, { supplier_ids: supplierIds });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }),
  });
}

export function useAwardSupplier(rfqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplierId: string) => {
      const { data } = await api.post(`/v1/rfq/${rfqId}/award`, { supplier_id: supplierId });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }),
  });
}
