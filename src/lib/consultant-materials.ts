export const consultantMaterials = [
  {
    slug: "company-profile",
    title: "Company Profile BinaHub",
    description: "Profil perusahaan, pendekatan 4A, tiga pilar, dan ekosistem BinaHub.",
  },
  {
    slug: "product-knowledge",
    title: "Product Knowledge BinaHub",
    description: "Panduan internal untuk memahami produk dan program dalam katalog.",
  },
] as const;

export type ConsultantMaterial = (typeof consultantMaterials)[number];
