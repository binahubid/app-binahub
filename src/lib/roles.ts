export const roles = ["admin", "client", "facilitator", "peserta", "consultant"] as const;

export type Role = (typeof roles)[number];

export const roleHome: Record<Role, string> = {
  admin: "/admin/dashboard",
  client: "/client/program",
  facilitator: "/fasilitator/tbos",
  peserta: "/peserta/dashboard",
  consultant: "/konsultan",
};

export function isRole(value: string | null | undefined): value is Role {
  return roles.includes(value as Role);
}
