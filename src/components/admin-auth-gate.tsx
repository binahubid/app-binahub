"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAuthenticatedRole } from "@/lib/authenticated-role";

export type AppRole = "admin" | "facilitator" | "client" | "peserta";

const AdminAccessContext = createContext(false);

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const inheritedAccess = useContext(AdminAccessContext);
  const router = useRouter();
  const [allowed, setAllowed] = useState(inheritedAccess);

  useEffect(() => {
    if (inheritedAccess) return;
    let alive = true;

    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        if (alive) router.replace("/login");
        return;
      }

      try {
        const result = await fetchAuthenticatedRole(session.access_token);
        const role = result.ok ? result.role : null;

        if (role !== "admin") {
          if (alive) router.replace(result.status === 401 ? "/login" : "/access-denied");
          return;
        }

        if (alive) setAllowed(true);
      } catch {
        if (alive) router.replace("/");
      }
    }

    void checkAccess();
    return () => { alive = false; };
  }, [inheritedAccess, router]);

  if (inheritedAccess) return <>{children}</>;

  if (!allowed) {
    return (
      <main role="status" aria-live="polite" aria-busy="true" className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]">
        Memeriksa akses admin...
      </main>
    );
  }

  return <AdminAccessContext.Provider value>{children}</AdminAccessContext.Provider>;
}

interface PermissionGateProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, allowedRoles, fallback }: PermissionGateProps) {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    async function checkPermission() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        if (alive) setGranted(false);
        return;
      }

      try {
        const result = await fetchAuthenticatedRole(session.access_token);
        const userRole = (result.ok ? result.role : "peserta") as AppRole;
        if (alive) setGranted(allowedRoles.includes(userRole));
      } catch {
        if (alive) setGranted(false);
      }
    }

    void checkPermission();
    return () => { alive = false; };
  }, [allowedRoles]);

  if (granted === null) return null;
  if (!granted) return fallback ?? null;
  return <>{children}</>;
}
