import type { Metadata } from "next";
import { ConsultantShell } from "@/components/consultant-shell";
export const metadata: Metadata = {
  title: "Portal Konsultan | BinaHub",
  robots: { index: false, follow: false },
};
export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsultantShell>{children}</ConsultantShell>;
}
