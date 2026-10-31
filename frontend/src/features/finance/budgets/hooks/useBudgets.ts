import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useBudgets(page = 1, perPage = 20, search?: string, fiscalYear?: number) {
  return useQuery({
    queryKey: ["budgets", page, perPage, search, fiscalYear],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (search) params.set("search", search);
      if (fiscalYear) params.set("fiscalYear", String(fiscalYear));
      const { data } = await api.get(`/v1/budgets/?${params}`);
      return { items: data.data, meta: data.meta };
    },
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ["budgets", id],
    queryFn: async () => {
      const { data } = await api.get(`/v1/budgets/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/budgets/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateBudget(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/v1/budgets/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
