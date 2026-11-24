"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { ConsultantPending } from "@/components/consultant-data";
import { ConsultantHeading } from "@/components/consultant-overview";
import { ConsultantTutorialLibrary } from "@/components/consultant-tutorial-library";
import { useConsultantLocale } from "@/components/consultant-language";
import s from "@/components/consultant.module.css";

export default function ConsultantTutorialPage() {
  const { t } = useConsultantLocale();
  return (
    <>
      <Link href="/konsultan/materials" className={s.readerBack}>
        <ArrowLeft size={16} aria-hidden="true" /> {t("Kembali ke Materi")}
      </Link>
      <ConsultantHeading
        title={t("Video tutorial")}
        description={t("Pilih episode untuk mempelajari fitur portal atau mengikuti alur kerja konsultasi.")}
      />
      <Suspense fallback={<ConsultantPending />}><ConsultantTutorialLibrary /></Suspense>
    </>
  );
}
