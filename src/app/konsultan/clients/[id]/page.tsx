import { Suspense } from "react";
import { ConsultantPending } from "@/components/consultant-data";
import { ConsultantWork } from "@/components/consultant-work";
export default async function ConsultantWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Suspense fallback={<ConsultantPending />}><ConsultantWork key={id} id={id} /></Suspense>;
}
