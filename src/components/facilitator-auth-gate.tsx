"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAuthenticatedRole } from "@/lib/authenticated-role";

export function FacilitatorAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        if (alive) router.replace("/login");
        return;
      }

      try {
        const result = await fetchAuthenticatedRole(session.access_token);
        const role = result.ok ? result.role : null;

        if (role !== "facilitator" && role !== "admin") {
          if (alive) router.replace("/login");
          return;
        }

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
        Memeriksa akses fasilitator...
      </main>
    );
  }

  return <>{children}</>;
}
