"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask, TextLayer } from "pdfjs-dist";
import { downloadConsultantFile, fetchConsultantFile } from "@/lib/consultant-client";
import type { ConsultantMaterial } from "@/lib/consultant-materials";
import { ConsultantHeading } from "./consultant-overview";
import { ConsultantPending } from "./consultant-data";
import s from "./consultant.module.css";
import { useConsultantLocale } from "@/components/consultant-language";

type PdfLink = { index: number; label: string; rectangle: number[]; page?: number; url?: string };

type LoadedPdf = { pdf: PDFDocumentProxy; lib: typeof import("pdfjs-dist") };

export function ConsultantMaterialReader({ material }: { material: ConsultantMaterial }) {
  const { t } = useConsultantLocale();
  const path = `/api/konsultan/materials/${material.slug}`;
  const [source, setSource] = useState<{ path: string; document?: LoadedPdf; error?: string }>();
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    let task: PDFDocumentLoadingTask | undefined;
    void (async () => {
      const [response, lib] = await Promise.all([
        fetchConsultantFile(path, abort.signal),
        import("pdfjs-dist"),
      ]);
      const data = new Uint8Array(await response.arrayBuffer());
      if (abort.signal.aborted) return;
      lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      task = lib.getDocument({ data, useWasm: false, enableXfa: false, maxImageSize: 24_000_000 });
      const pdf = await task.promise;
      if (!abort.signal.aborted) setSource({ path, document: { pdf, lib } });
    })().catch(() => {
      if (!abort.signal.aborted) setSource({ path, error: "Pratinjau dokumen belum dapat dibuka." });
    });
    return () => {
      abort.abort();
      void task?.destroy().catch(() => {});
    };
  }, [path, retry]);
  const state = source?.path === path ? source : undefined;
  async function download() {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadConsultantFile(path, material.filename);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Dokumen belum tersedia.");
    } finally {
      setDownloading(false);
    }
  }
  return (
    <>
      <Link href="/konsultan/materials" className={s.readerBack}>
        <ArrowLeft size={16} aria-hidden="true" /> {t("Semua materi")}</Link>
      <ConsultantHeading title={material.title} description={t(material.description)}>
        <button className={s.button} type="button" disabled={downloading} onClick={() => void download()}>
          <Download size={16} aria-hidden="true" /> {downloading ? t("Memuat…") : t("Unduh PDF")}
        </button>
      </ConsultantHeading>
      {downloadError && <p role="alert" className={s.error}>{t(downloadError)}</p>}
      {state?.document ? (
        <PdfPages key={path} document={state.document} title={material.title} />
      ) : (
        <section className={s.panel}>
          {state?.error ? <>
            <p role="alert" className={s.error}>{t(state.error)}</p>
            <button className={s.button} type="button" onClick={() => { setSource(undefined); setRetry((n) => n + 1); }}>{t("Coba lagi")}</button>
          </> : <ConsultantPending message="Memuat dokumen…" />}
        </section>
      )}
    </>
  );
}

function PdfPages({ document: { pdf, lib }, title }: { document: LoadedPdf; title: string }) {
  const { t } = useConsultantLocale();
  const [number, setNumber] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [width, setWidth] = useState(0);
  const [rendered, setRendered] = useState<string>();
  const [failed, setFailed] = useState<string>();
  const [links, setLinks] = useState<PdfLink[]>([]);
  const [programIndex, setProgramIndex] = useState<number>();
  const scroll = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const renderKey = `${number}/${zoom}/${width}`;

  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(1, el.clientWidth - 24)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const outline = await pdf.getOutline();
      const index = outline?.find(({ title }) => title === "Indeks Program");
      const destination = typeof index?.dest === "string" ? await pdf.getDestination(index.dest) : index?.dest;
      if (!destination?.length || cancelled) return;
      const ref = destination[0];
      const target = typeof ref === "number" ? ref : await pdf.getPageIndex(ref);
      if (!cancelled) setProgramIndex(target + 1);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [pdf]);

  useEffect(() => {
    if (!width) return;
    const surface = canvas.current, page = sheet.current, layer = text.current;
    if (!surface || !page || !layer) return;
    let cancelled = false;
    let render: RenderTask | undefined;
    let textLayer: TextLayer | undefined;
    void (async () => {
      const pdfPage = await pdf.getPage(number);
      if (cancelled) return;
      const unit = pdfPage.getViewport({ scale: 1 });
      const target = Math.min(width, 870) * (zoom ? 1.65 : 1);
      const viewport = pdfPage.getViewport({ scale: Math.min(target / unit.width, 2400 / unit.height) });
      const resolution = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.ceil(viewport.width * resolution);
      surface.height = Math.ceil(viewport.height * resolution);
      page.style.width = `${viewport.width}px`;
      page.style.height = `${viewport.height}px`;
      page.style.setProperty("--total-scale-factor", String(viewport.scale));
      render = pdfPage.render({
        canvas: surface,
        viewport,
        annotationMode: lib.AnnotationMode.DISABLE,
        transform: [resolution, 0, 0, resolution, 0, 0],
      });
      layer.replaceChildren();
      textLayer = new lib.TextLayer({ textContentSource: pdfPage.streamTextContent(), container: layer, viewport });
      void textLayer.render().catch(() => {});
      await render.promise;
      if (cancelled) return;
      const annotations = await pdfPage.getAnnotations({ intent: "display" }).catch(() => []);
      const destinations = await Promise.all(annotations.map(async (annotation, index): Promise<PdfLink | null> => {
        if (annotation.subtype !== "Link" || !Array.isArray(annotation.rect)) return null;
        const [left, bottom, right, top] = annotation.rect as number[];
        const [a, b, c, d, e, f] = viewport.transform;
        const rectangle = [
          a * left + c * bottom + e, b * left + d * bottom + f,
          a * right + c * top + e, b * right + d * top + f,
        ];
        const dest = typeof annotation.dest === "string" ? await pdf.getDestination(annotation.dest) : annotation.dest;
        if (Array.isArray(dest) && dest.length) {
          const ref = dest[0];
          const target = 1 + (typeof ref === "number" ? ref : await pdf.getPageIndex(ref));
          if (target < 1 || target > pdf.numPages) return null;
          return { index, rectangle, label: t("Halaman") + " " + target, page: target };
        }
        if (typeof annotation.url === "string" && /^(https:\/\/|mailto:|tel:)/i.test(annotation.url)) {
          return { index, rectangle, label: annotation.url, url: annotation.url };
        }
        return null;
      })).catch(() => []);
      if (!cancelled) {
        setLinks(destinations.flatMap((link) => link ? [link] : []));
        setRendered(renderKey);
      }
    })().catch(() => {
      if (!cancelled) setFailed(renderKey);
    });
    return () => {
      cancelled = true;
      render?.cancel();
      textLayer?.cancel();
    };
  }, [pdf, lib, number, zoom, width, renderKey, t]);

  function goTo(page: number) {
    setNumber(page);
    scroll.current?.scrollTo({ top: 0, left: 0 });
  }
  const ready = rendered === renderKey && failed !== renderKey;
  return (
    <section className={s.reader} aria-label={t("Pembaca {0}", [title])}>
      <div className={s.readerBar}>
        <div className={s.actions} role="group" aria-label={t("Navigasi halaman dokumen")}>
          <button className={s.button} type="button" aria-label={t("Halaman sebelumnya")} disabled={number <= 1}
            onClick={() => goTo(number - 1)}>
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <output className={s.readerPage}>{t("Halaman")} {number} {t("dari")} {pdf.numPages}</output>
          <button className={s.button} type="button" aria-label={t("Halaman berikutnya")} disabled={number >= pdf.numPages}
            onClick={() => goTo(number + 1)}>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
        {programIndex && number !== programIndex ? (
          <button type="button" className={s.button} onClick={() => goTo(programIndex)}>
            {t("Indeks program")}
          </button>
        ) : null}
        <button className={s.button} type="button" onClick={() => setZoom((value) => !value)}>
          {zoom ? <ZoomOut size={16} aria-hidden="true" /> : <ZoomIn size={16} aria-hidden="true" />}
          {t(zoom ? "Pas layar" : "Perbesar")}
        </button>
      </div>
      <div className={s.readerViewport} ref={scroll} tabIndex={0} role="region" aria-label={t("Isi halaman {0}", [number])}>
        {!ready && <p className={s.readerNotice} role={failed === renderKey ? "alert" : "status"}>
          {failed === renderKey ? t("Halaman ini belum dapat ditampilkan. Coba buka halaman lain atau unduh PDF.") : t("Menyiapkan halaman…")}
        </p>}
        <div className={s.readerSheet} ref={sheet} style={{ visibility: ready ? "visible" : "hidden" }}>
          <canvas ref={canvas} aria-hidden="true" />
          <div ref={text} className={s.readerText} />
          {ready && links.map(({ index, label, rectangle: [x1, y1, x2, y2], page, url }) => {
            const style = { left: Math.min(x1, x2), top: Math.min(y1, y2),
              width: Math.abs(x1 - x2), height: Math.abs(y1 - y2) };
            return page ? (
              <button type="button" key={index} className={s.readerLink} style={style}
                aria-label={page === programIndex ? t("Kembali ke indeks program") : label} onClick={() => goTo(page)} />
            ) : (
              <a key={index} className={s.readerLink} style={style} aria-label={label}
                href={url} target="_blank" rel="noopener noreferrer" />
            );
          })}
        </div>
      </div>
    </section>
  );
}
