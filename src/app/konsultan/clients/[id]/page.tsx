import { ConsultantWork } from "@/components/consultant-work";
export default async function ConsultantWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ConsultantWork id={(await params).id} />;
}
