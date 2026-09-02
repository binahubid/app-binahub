import type { Metadata } from "next";
import { AdminMobileNav } from "@/components/admin-mobile-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-route-layout pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {children}
      <AdminMobileNav />
    </div>
  );
}
