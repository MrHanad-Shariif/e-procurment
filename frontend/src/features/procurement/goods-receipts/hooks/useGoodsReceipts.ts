import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useGoodsReceipts(page = 1, perPage = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ["grs", page, perPage, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/v1/goods-receipts/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useGoodsReceipt(id: string) {
  return useQuery({
    queryKey: ["grs", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/goods-receipts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateGr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/goods-receipts/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grs"] }),
  });
}

export function useGrAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
      const { data } = await api.post(`/v1/goods-receipts/${id}/action`, { action, notes });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grs"] }),
  });
}

export function usePoRemainingQuantities(poId: string) {
  return useQuery({
    queryKey: ["po-remaining", poId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/goods-receipts/po-remaining/${poId}`);
      return data.data as Record<string, number>;
    },
    enabled: !!poId,
  });
}
