"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAuthenticatedRole } from "@/lib/authenticated-role";
import { isRole, roleHome } from "@/lib/roles";

let verifiedClient: { userId: string; expiresAt: number } | null = null;

export function ClientAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (alive) router.replace("/client/access");
        return;
      }

      if (verifiedClient?.userId === session.user.id && verifiedClient.expiresAt > Date.now()) {
        if (alive) setAllowed(true);
        return;
      }

      try {
        const result = await fetchAuthenticatedRole(session.access_token);
        const role = result.ok ? result.role : null;

        if (role !== "client") {
          if (alive) router.replace(isRole(role) ? roleHome[role] : "/client/access");
          return;
        }

        verifiedClient = { userId: session.user.id, expiresAt: Date.now() + 5 * 60_000 };
        if (alive) setAllowed(true);
      } catch {
        if (alive) router.replace("/");
      }
    }

    void checkAccess();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]">
        Memeriksa akses...
      </main>
    );
  }

  return children;
}
