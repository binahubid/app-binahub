import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ConsultantShell } from "@/components/consultant-shell";
import { ConsultantLocaleProvider } from "@/components/consultant-language";
import { consultantLanguageCookie, consultantLocale, consultantTranslator } from "@/lib/consultant-locale";

async function readLocale() {
  return consultantLocale((await cookies()).get(consultantLanguageCookie)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = consultantTranslator(await readLocale());
  return { title: t("Portal Konsultan | BinaHub"), robots: { index: false, follow: false } };
}

export default async function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsultantLocaleProvider initialLocale={await readLocale()}>
      <ConsultantShell>{children}</ConsultantShell>
    </ConsultantLocaleProvider>
  );
}
