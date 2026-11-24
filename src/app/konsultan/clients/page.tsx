import { Suspense } from "react";
import { ConsultantPending } from "@/components/consultant-data";
import { ConsultantClients } from "@/components/consultant-overview";
export default function ConsultantClientsPage() {
  return <Suspense fallback={<ConsultantPending />}><ConsultantClients /></Suspense>;
}
