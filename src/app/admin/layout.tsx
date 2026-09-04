import type { Metadata } from "next";
import { AdminAuthGate } from "@/components/admin-auth-gate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGate><div className="admin-route-layout">{children}</div></AdminAuthGate>;
}
