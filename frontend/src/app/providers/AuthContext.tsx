import { createContext, useState, useCallback, useEffect, type ReactNode } from "react";
import api from "@/shared/lib/api";
import type { SignupRequest, User } from "@/shared/types/auth";
import { useQueryClient } from "@tanstack/react-query";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, orgSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (body: SignupRequest) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

function tenderIdentity(user: User) {
  return { ...user, must_change_password: Boolean((user as User & { mustChangePassword?: boolean }).mustChangePassword), name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.roles.some(role => role.slug === "admin") ? "super_admin"
      : user.roles.some(role => role.slug === "supplier") ? "supplier" : "admin" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/v1/auth/me");
      setUser(data.data);
      localStorage.setItem("user", JSON.stringify(tenderIdentity(data.data)));
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string, orgSlug: string) => {
      const { data } = await api.post("/v1/auth/login", {
        email,
        password,
        org_slug: orgSlug,
      });
      const { accessToken, refreshToken, user: loggedInUser } = data.data;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("org_slug", orgSlug);
      queryClient.clear();
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(tenderIdentity(loggedInUser)));
    },
    [queryClient]
  );

  const signup = useCallback(
    async (body: SignupRequest) => {
      const { data } = await api.post("/v1/auth/signup", body);
      localStorage.setItem("access_token", data.data.accessToken);
      localStorage.setItem("refresh_token", data.data.refreshToken);
      localStorage.setItem("org_slug", data.data.organization.slug);
      queryClient.clear();
      setUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(tenderIdentity(data.data.user)));
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/v1/auth/logout", {
        refreshToken: localStorage.getItem("refresh_token"),
      });
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("org_slug");
    localStorage.removeItem("user");
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
