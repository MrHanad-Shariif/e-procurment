import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useContracts(page = 1, perPage = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ["contracts", page, perPage, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/v1/contracts/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/contracts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/contracts/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useContractAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
      const { data } = await api.post(`/v1/contracts/${id}/action`, { action, notes });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useAddAmendment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post(`/v1/contracts/${id}/amendments`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}
