export const consultantMaterials = [
  {
    slug: "company-profile-v1",
    title: "Company Profile BinaHub — Versi 1",
    description: "Profil perusahaan, pendekatan 4A, tiga pilar, dan ekosistem BinaHub.",
    filename: "BinaHub-company-profile-v1.pdf",
  },
  {
    slug: "company-profile",
    title: "Company Profile BinaHub — Versi 2",
    description: "Edisi futuristik dari profil perusahaan dan ekosistem BinaHub.",
    filename: "BinaHub-company-profile-v2.pdf",
  },
  {
    slug: "product-knowledge-v1",
    title: "Product Knowledge BinaHub — Versi 1",
    description: "Panduan internal yang membahas 32 program Signature Solutions.",
    filename: "BinaHub-product-knowledge-v1.pdf",
  },
  {
    slug: "product-knowledge",
    title: "Product Knowledge BinaHub — Versi 2",
    description: "Edisi futuristik dari panduan 32 program Signature Solutions.",
    filename: "BinaHub-product-knowledge-v2.pdf",
  },
] as const;

export type ConsultantMaterial = (typeof consultantMaterials)[number];
