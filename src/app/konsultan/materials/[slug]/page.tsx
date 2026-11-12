import { notFound } from "next/navigation";
import { ConsultantMaterialReader } from "@/components/consultant-material-reader";
import { consultantMaterials } from "@/lib/consultant-materials";

export default async function ConsultantMaterialPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const material = consultantMaterials.find((entry) => entry.slug === slug);
  if (!material) notFound();
  return <ConsultantMaterialReader material={material} />;
}
