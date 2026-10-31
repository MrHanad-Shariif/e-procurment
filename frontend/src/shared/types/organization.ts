export interface Organization {
  id?: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  systemName: string | null;
  defaultLanguage: string;
}

export interface SmtpSettings {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpPasswordSet: boolean;
  emailFromName: string | null;
  emailFromAddress: string | null;
}

export interface SessionSettings {
  maxConcurrentSessions: number;
}

export interface Permission {
  id: string;
  codename: string;
  description?: string;
  group?: string;
}

export interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  userCount?: number;
  permissions: Permission[];
}
