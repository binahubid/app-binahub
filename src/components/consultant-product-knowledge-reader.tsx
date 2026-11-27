"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { consultantRequest } from "@/lib/consultant-client";
import { useConsultantLocale } from "./consultant-language";
import { ConsultantPending, useConsultantData } from "./consultant-data";
import s from "./consultant.module.css";
import styles from "./consultant-product-knowledge-reader.module.css";

type PageLink = { left: number; top: number; width: number; height: number; page?: number; url?: string };
type PageImage = {
  number: number;
  width: number;
  height: number;
  image: string;
  links: PageLink[];
  text: string;
};
type Preview = {
  revision: string;
  total: number;
  chapters: { number: number; title: string }[];
  page: PageImage;
};

const previewUrl = "/api/konsultan/materials/product-knowledge?view=preview";

export function ConsultantProductKnowledgeReader() {
  const { t } = useConsultantLocale();
  const source = useConsultantData<Preview>(previewUrl);

  if (source.error) return (
    <section className={s.panel}>
      <p role="alert" className={s.error}>{t("Pratinjau dokumen belum dapat dibuka.")}</p>
      <button type="button" className={s.button} onClick={source.reload}>{t("Coba lagi")}</button>
    </section>
  );
  if (!source.data) return <ConsultantPending message="Memuat dokumen…" layout="reader" />;

  return <VisualPages key={source.data.revision} initial={source.data} reload={source.reload} />;
}

function VisualPages({ initial, reload }: { initial: Preview; reload: () => void }) {
  const { t } = useConsultantLocale();
  const { chapters, total, revision } = initial;
  const index = chapters.find(chapter => chapter.title.toLowerCase() === "indeks program")?.number;
  const [shown, setShown] = useState(initial.page);
  const [pending, setPending] = useState<number>();
  const [error, setError] = useState<{ page: number; refresh: boolean }>();
  const [zoom, setZoom] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const navigation = useRef(0);
  const requests = useRef(new Map([[initial.page.number, Promise.resolve(initial)]]));

  const read = useCallback((page: number) => {
    const cache = requests.current;
    const previous = cache.get(page);
    if (previous) return previous;
    if (cache.size >= 6) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    const request = consultantRequest<Preview>(previewUrl + "&page=" + page, undefined, "GET", AbortSignal.timeout(12_000))
      .then(async preview => {
        if (preview.revision === revision) {
          const image = new window.Image();
          image.src = preview.page.image;
          await image.decode();
        }
        return preview;
      })
      .catch(reason => {
        if (cache.get(page) === request) cache.delete(page);
        throw reason;
      });
    cache.set(page, request);
    return request;
  }, [revision]);

  useEffect(() => {
    for (const page of [shown.number - 1, shown.number + 1]) {
      if (page >= 1 && page <= total) void read(page).catch(() => {});
    }
  }, [read, shown.number, total]);

  async function goTo(number: number) {
    if (number < 1 || number > total) return;
    const ticket = ++navigation.current;
    setError(undefined);
    setPending(number === shown.number ? undefined : number);
    if (number === shown.number) return;

    try {
      const result = await read(number);
      if (ticket !== navigation.current || !viewport.current) return;
      if (result.revision !== revision) {
        setError({ page: number, refresh: true });
        return;
      }
      setShown(result.page);
      viewport.current.scrollTo({ top: 0, left: 0 });
    } catch {
      if (ticket === navigation.current && viewport.current) setError({ page: number, refresh: false });
    } finally {
      if (ticket === navigation.current && viewport.current) setPending(undefined);
    }
  }

  const destination = pending ?? shown.number;
  return (
    <section className={s.reader} aria-label={t("Pembaca {0}", ["Product Knowledge"])}>
      <div className={s.readerBar}>
        <div className={s.actions} role="group" aria-label={t("Navigasi halaman dokumen")}>
          <button className={s.button} type="button" aria-label={t("Halaman sebelumnya")} disabled={destination <= 1}
            onClick={() => void goTo(destination - 1)}><ChevronLeft size={17} aria-hidden="true" /></button>
          <output className={s.readerPage}>{t("Halaman")} {shown.number} {t("dari")} {total}</output>
          <button className={s.button} type="button" aria-label={t("Halaman berikutnya")} disabled={destination >= total}
            onClick={() => void goTo(destination + 1)}><ChevronRight size={17} aria-hidden="true" /></button>
        </div>
        <div className={styles.controls}>
          <select className={s.readerOutline} aria-label={t("Daftar isi")} value={destination}
            onChange={event => void goTo(Number(event.target.value))}>
            {Array.from({ length: total }, (_, i) => {
              const page = i + 1;
              return <option key={page} value={page}>{page}. {chapters.find(chapter => chapter.number === page)?.title ?? t("Halaman")}</option>;
            })}
          </select>
          {index && (
            <button className={s.button} type="button" disabled={destination === index} onClick={() => void goTo(index)}>
              {t("Indeks program")}
            </button>
          )}
          <button className={s.button} type="button" onClick={() => {
            setZoom(value => !value);
            viewport.current?.scrollTo({ left: 0 });
          }}>
            {zoom ? <ZoomOut size={16} aria-hidden="true" /> : <ZoomIn size={16} aria-hidden="true" />}
            {t(zoom ? "Pas layar" : "Perbesar")}
          </button>
        </div>
      </div>
      {pending && <p className="sr-only" role="status">{t("Menyiapkan halaman…")}</p>}
      {error && (
        <div className={styles.notice} role="alert">
          <p>{t(error.refresh ? "Dokumen diperbarui. Muat ulang untuk membuka versi terbaru." : "Halaman ini belum dapat ditampilkan.")}</p>
          <button type="button" className={s.button}
            onClick={() => error.refresh ? reload() : void goTo(error.page)}>
            {t(error.refresh ? "Muat ulang dokumen" : "Coba lagi")}
          </button>
        </div>
      )}
      <div className={s.readerViewport} ref={viewport} tabIndex={0} role="region"
        aria-label={t("Isi halaman {0}", [shown.number])} aria-busy={!!pending}>
        <div className={styles.sheet} data-zoom={zoom}>
          <Image src={shown.image} width={shown.width} height={shown.height} unoptimized
            className={styles.pageImage} draggable={false} alt="" />
          <p className="sr-only">{shown.text}</p>
          {shown.links.map(({ left, top, width, height, page, url }, i) => {
            const style = { left: left * 100 + "%", top: top * 100 + "%", width: width * 100 + "%", height: height * 100 + "%" };
            return page ? (
              <button type="button" key={i} className={s.readerLink} style={style}
                aria-label={chapters.find(chapter => chapter.number === page)?.title || t("Halaman") + " " + page}
                onClick={() => void goTo(page)} />
            ) : (
              <a key={i} className={s.readerLink} style={style} aria-label={url} href={url} target="_blank" rel="noopener noreferrer" />
            );
          })}
        </div>
      </div>
    </section>
  );
}
