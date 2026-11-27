"use client";

import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useConsultantLocale } from "./consultant-language";
import { ConsultantPending, useConsultantData } from "./consultant-data";
import s from "./consultant.module.css";
import styles from "./consultant-product-knowledge-reader.module.css";

type ReadingPage = {
  page: number;
  title: string;
  blocks: { kind: "heading" | "paragraph" | "bullet"; text: string }[];
};

export function ConsultantProductKnowledgeReader() {
  const { t } = useConsultantLocale();
  const source = useConsultantData<{ pages: ReadingPage[] }>("/api/konsultan/materials/product-knowledge?view=reader");
  if (source.error) return (
    <section className={s.panel}>
      <p role="alert" className={s.error}>{t("Pratinjau dokumen belum dapat dibuka.")}</p>
      <button type="button" className={s.button} onClick={source.reload}>{t("Coba lagi")}</button>
    </section>
  );
  if (!source.data) return <ConsultantPending message="Memuat dokumen…" layout="reader" />;
  if (!source.data.pages.length) return <p role="status">{t("Pratinjau dokumen belum dapat dibuka.")}</p>;
  return <ReadingPages pages={source.data.pages} />;
}

function ReadingPages({ pages }: { pages: ReadingPage[] }) {
  const { t } = useConsultantLocale();
  const [pageIndex, setPageIndex] = useState(0);
  const [showOutline, setShowOutline] = useState(false);
  const viewport = useRef<HTMLElement>(null);
  const page = pages[pageIndex];
  const index = pages.findIndex(item => item.title.toLowerCase() === "indeks program");
  const programPages = pages
    .map((item, i) => [item.title.split(" / ").at(-1) ?? "", i] as const)
    .filter(([name, i]) => !!name && index >= 0 && i > index && pages[i].title.includes(" / "));

  function goTo(next: number) {
    setPageIndex(Math.max(0, Math.min(next, pages.length - 1)));
    setShowOutline(false);
    viewport.current?.scrollTo({ top: 0 });
  }

  return (
    <section className={styles.reader} aria-label={t("Pembaca {0}", ["Product Knowledge"])}>
      <div className={styles.toolbar}>
        <div className={s.actions} role="group" aria-label={t("Navigasi halaman dokumen")}>
          <button className={s.button} type="button" aria-label={t("Halaman sebelumnya")} disabled={pageIndex === 0}
            onClick={() => goTo(pageIndex - 1)}><ChevronLeft size={18} aria-hidden="true" /></button>
          <output className={s.readerPage}>{t("Halaman")} {page.page} {t("dari")} {pages.length}</output>
          <button className={s.button} type="button" aria-label={t("Halaman berikutnya")} disabled={pageIndex === pages.length - 1}
            onClick={() => goTo(pageIndex + 1)}><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
        <div className={s.actions}>
          <button type="button" className={s.button} aria-expanded={showOutline} aria-controls="product-knowledge-outline"
            onClick={() => setShowOutline(value => !value)}><List size={17} aria-hidden="true" />{t("Daftar isi")}</button>
          {index >= 0 && index !== pageIndex && (
            <button type="button" className={s.button} onClick={() => goTo(index)}>{t("Indeks program")}</button>
          )}
        </div>
      </div>
      {showOutline && (
        <nav className={styles.outline} id="product-knowledge-outline" aria-label={t("Daftar isi")}>
          {pages.map((item, i) => (
            <button key={item.page} type="button" onClick={() => goTo(i)} aria-current={i === pageIndex ? "page" : undefined}>
              <span>{item.title || t("Halaman") + " " + item.page}</span><small>{item.page}</small>
            </button>
          ))}
        </nav>
      )}
      <article className={styles.sheet} ref={viewport} tabIndex={0} aria-labelledby="product-knowledge-title">
        <h2 id="product-knowledge-title">{page.title.split(" / ").at(-1) || t("Halaman") + " " + page.page}</h2>
        {page.blocks.map((block, i) => {
          if (block.text === page.title || block.text === page.title.split(" / ").at(-1)) return null;
          if (pageIndex === index) {
            const match = programPages.find(([name]) => block.text === name || block.text.startsWith(name + " SS-"));
            if (match) return <button type="button" key={i} className={styles.program} onClick={() => goTo(match[1])}>
              {block.text}<ArrowRight size={15} aria-hidden="true" />
            </button>;
          }
          if (block.kind === "heading") return <h3 key={i}>{block.text}</h3>;
          return <p key={i} data-bullet={block.kind === "bullet"}>{block.text}</p>;
        })}
      </article>
    </section>
  );
}
