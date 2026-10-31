import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get("/v1/roles/");
      return data.data;
    },
  });
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: async () => {
      const { data } = await api.get(`/v1/roles/${roleId}`);
      return data.data;
    },
    enabled: !!roleId,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await api.get("/v1/roles/permissions");
      return data.data;
    },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post("/v1/roles/", body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/v1/roles/${roleId}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const { data } = await api.delete(`/v1/roles/${roleId}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useSetRolePermissions(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (permissionIds: string[]) => {
      const { data } = await api.put(`/v1/roles/${roleId}/permissions`, {
        permission_ids: permissionIds,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
