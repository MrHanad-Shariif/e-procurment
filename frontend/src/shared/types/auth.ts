export interface UserRole {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  orgId: string;
  isActive: boolean;
  roles: UserRole[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  orgSlug: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SignupRequest {
  organization_name: string;
  org_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  preferred_language: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
  preferredLanguage?: string;
}
