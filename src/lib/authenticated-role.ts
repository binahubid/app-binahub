import type { Role } from "@/lib/roles";

type RolePayload = {
  success?: boolean;
  role?: unknown;
  fullName?: unknown;
  error?: unknown;
};

export type AuthenticatedRoleResult = {
  ok: boolean;
  status: number;
  role: Role | null;
  fullName: string;
  error: string;
};

function isAppRole(value: unknown): value is Role {
  return value === "admin"
    || value === "client"
    || value === "facilitator"
    || value === "peserta";
}

export async function fetchAuthenticatedRole(accessToken: string): Promise<AuthenticatedRoleResult> {
  const token = accessToken.trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      role: null,
      fullName: "",
      error: "Token tidak ditemukan",
    };
  }

  const response = await fetch("/api/auth/role", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as RolePayload | null;
  const roleValue = payload?.role;
  const role = isAppRole(roleValue) ? roleValue : null;

  return {
    ok: response.ok && payload?.success === true && role !== null,
    status: response.status,
    role,
    fullName: typeof payload?.fullName === "string" ? payload.fullName : "",
    error: typeof payload?.error === "string" ? payload.error : "",
  };
}
