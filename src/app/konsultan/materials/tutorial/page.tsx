import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConsultantHeading } from "@/components/consultant-overview";
import { ConsultantTutorialLibrary } from "@/components/consultant-tutorial-library";
import s from "@/components/consultant.module.css";

export default function ConsultantTutorialPage() {
  return (
    <>
      <Link href="/konsultan/materials" className={s.readerBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Kembali ke Materi
      </Link>
      <ConsultantHeading
        title="Video tutorial"
        description="Pilih episode untuk mempelajari fitur portal atau mengikuti alur kerja konsultasi."
      />
      <ConsultantTutorialLibrary />
    </>
  );
}
