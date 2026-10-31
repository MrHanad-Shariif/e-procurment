import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useInvoices(page = 1, perPage = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ["invoices", page, perPage, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/v1/invoices/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/invoices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/invoices/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useInvoiceAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
      const { data } = await api.post(`/v1/invoices/${id}/action`, { action, notes });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
