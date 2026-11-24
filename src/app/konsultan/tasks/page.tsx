import { Suspense } from "react";
import { ConsultantPending } from "@/components/consultant-data";
import { ConsultantAgenda } from "@/components/consultant-overview";
export default function ConsultantTasksPage() {
  return <Suspense fallback={<ConsultantPending />}><ConsultantAgenda /></Suspense>;
}
