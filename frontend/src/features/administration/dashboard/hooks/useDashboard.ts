import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import api from "@/shared/lib/api";
import type { ApiResponse } from "@/shared/types/api";
import type { PurchaseOrder, PurchaseRequisition, Supplier } from "@/shared/types/procurement";

async function allPages<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data } = await api.get<ApiResponse<T[]>>(`/v1/${path}/`, {
      params: { page, perPage: 100 },
      signal,
    });
    items.push(...(data.data ?? []));
    totalPages = data.meta?.totalPages ?? 1;
    page++;
  } while (page <= totalPages);
  return items;
}

export function useDashboard() {
  const { user, hasPermission } = useAuth();
  const canReadRequests =
    hasPermission("purchase_request.view") || hasPermission("purchase_request.view_all");
  const canReadOrders =
    hasPermission("purchase_order.view") || hasPermission("purchase_order.view_all");
  const canReadSuppliers = hasPermission("supplier.view");
  const requests = useQuery({
    queryKey: ["prs", "dashboard", user?.orgId, user?.id],
    queryFn: ({ signal }) => allPages<PurchaseRequisition>("purchase-requisitions", signal),
    enabled: canReadRequests,
    staleTime: 60_000,
  });
  const orders = useQuery({
    queryKey: ["pos", "dashboard", user?.orgId, user?.id],
    queryFn: ({ signal }) => allPages<PurchaseOrder>("purchase-orders", signal),
    enabled: canReadOrders,
    staleTime: 60_000,
  });
  const suppliers = useQuery({
    queryKey: ["suppliers", "dashboard", user?.orgId, user?.id],
    queryFn: ({ signal }) => allPages<Supplier>("suppliers", signal),
    enabled: canReadSuppliers,
    staleTime: 60_000,
  });
  const summary = useQuery({
    queryKey: ["dashboard-summary", user?.orgId],
    queryFn: async () => {
      const { data } = await api.get("/v1/dashboard/summary");
      return data.data;
    },
    enabled: canReadRequests || canReadOrders,
    staleTime: 60_000,
  });
  const active = [requests, orders, suppliers].filter(
    (_, index) => [canReadRequests, canReadOrders, canReadSuppliers][index]
  );
  return {
    requests,
    orders,
    suppliers,
    summary,
    canReadRequests,
    canReadOrders,
    canReadSuppliers,
    isLoading: active.some((query) => query.isLoading),
    isFetching: active.some((query) => query.isFetching),
    isError: active.some((query) => query.isError),
    hasAccess: active.length > 0,
    refresh: () => Promise.all(active.map((query) => query.refetch())),
  };
}
