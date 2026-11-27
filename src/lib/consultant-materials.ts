export const consultantMaterials = [
  {
    slug: "company-profile",
    title: "Company Profile BinaHub",
    description: "Profil perusahaan, pendekatan 4A, tiga pilar, dan delapan layanan utama BinaHub.",
    filename: "BinaHub-company-profile-v3.pdf",
    downloadable: true,
  },
  {
    slug: "product-knowledge",
    title: "Product Knowledge BinaHub",
    description: "Panduan layanan BinaHub dan 32 program Signature Solutions.",
    filename: "BinaHub-product-knowledge-v3.pdf",
    downloadable: false,
  },
] as const;

export type ConsultantMaterial = (typeof consultantMaterials)[number];
