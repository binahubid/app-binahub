"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { consultantRequest } from "@/lib/consultant-client";
import { useConsultantLocale } from "./consultant-language";
import s from "./consultant.module.css";

export const consultantDirectoryUrl = "/api/konsultan";
export const consultantMyDirectoryUrl = consultantDirectoryUrl + "?owner=mine";
export const consultantAgendaPath = "/api/konsultan/agenda";
export const agendaUrl = (owner: string, kind: string, page: number) =>
  consultantAgendaPath + "?" + new URLSearchParams({ owner, kind, page: String(page) });
export const consultantAgendaUrl = agendaUrl("mine", "tasks", 0);
export const consultantBookingUrl = agendaUrl("mine", "bookings", 0);
export const consultantTutorialUrl = "/konsultan/materials/tutorial/catalog";
export const consultantDetailUrl = (id: string, page = 0) => `${consultantDirectoryUrl}/${encodeURIComponent(id)}?page=${page}`;
const freshForMs = 30_000;
const maxReads = 32;

function canReuseRead(url: string) {
  return url === consultantDirectoryUrl || url.startsWith(consultantDirectoryUrl + "?")
    || url.startsWith(consultantAgendaPath + "?") || url === consultantTutorialUrl
    || /^\/api\/konsultan\/[a-f0-9-]{36}\?page=\d+$/i.test(url);
}

type Entry = { promise: Promise<unknown>; value?: unknown; expiresAt: number };

export function createConsultantReads() {
  const entries = new Map<string, Entry>();
  return {
    load<T>(url: string, signal?: AbortSignal): Promise<T> {
      if (!canReuseRead(url)) return consultantRequest<T>(url, undefined, "GET", signal);
      const previous = entries.get(url);
      if (previous && previous.expiresAt > Date.now()) return previous.promise as Promise<T>;

      const request = consultantRequest<T>(url, undefined, "GET", AbortSignal.timeout(12_000));
      const entry: Entry = { promise: request, expiresAt: Infinity };
      entries.delete(url);
      if (entries.size >= maxReads) {
        const oldest = entries.keys().next().value;
        if (oldest) entries.delete(oldest);
      }
      entries.set(url, entry);
      void request.then(
        (data) => {
          entry.value = data;
          entry.expiresAt = Date.now() + freshForMs;
        },
        () => { if (entries.get(url) === entry) entries.delete(url); },
      );
      return request;
    },
    peek<T>(url: string): T | undefined {
      const entry = entries.get(url);
      return entry && entry.expiresAt > Date.now() ? entry.value as T | undefined : undefined;
    },
    invalidate(matches: (url: string) => boolean) {
      for (const url of entries.keys()) if (matches(url)) entries.delete(url);
    },
    clear() {
      entries.clear();
    },
  };
}

export const ConsultantReads = createContext<ReturnType<typeof createConsultantReads> | null>(null);
export const ConsultantDirectorySearch = createContext<[string, (value: string) => void]>(["", () => {}]);

export function useConsultantClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);
  return now;
}

export function useConsultantData<T>(url: string | null) {
  const reads = useContext(ConsultantReads);
  const [state, setState] = useState<{ url: string; data?: T; error?: string }>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]);
    const request = reads
      ? reads.load<T>(url, signal)
      : consultantRequest<T>(url, undefined, "GET", signal);
    void request.then(
      (data) => { if (!controller.signal.aborted) setState({ url, data }); },
      (error) => {
        if (!controller.signal.aborted) setState({
          url,
          error: error instanceof Error && error.name !== "TimeoutError"
            ? error.message
            : "Data belum tersedia. Coba lagi.",
        });
      },
    );
    return () => controller.abort();
  }, [reads, url, revision]);
  const reload = useCallback(() => {
    reads?.invalidate((cached) => cached === url);
    setRevision((value) => value + 1);
  }, [reads, url]);
  const current = state?.url === url ? state : undefined;
  return {
    data: current?.error ? undefined : current?.data ?? (url ? reads?.peek<T>(url) : undefined),
    error: current?.error,
    reload,
  };
}

export function ConsultantPending({
  message = "Memuat halaman…",
  layout = "compact",
}: {
  message?: string;
  layout?: "compact" | "page" | "list" | "reader";
}) {
  const { t } = useConsultantLocale();
  return (
    <div className={s.pending} data-layout={layout} role="status">
      <span className={s.pendingLabel}>{t(message)}</span>
      <div className={s.skeleton} aria-hidden="true">
        {layout === "page" && (
          <div className={s.skeletonHeading}><span /><span /></div>
        )}
        {layout === "reader" ? <div className={s.skeletonReader} /> : (
          <div className={s.skeletonRows}>
            {(layout === "compact" ? [0] : [0, 1, 2]).map((row) => (
              <div className={s.skeletonRow} key={row}>
                <span className={s.skeletonIcon} />
                <div><span /><span /></div>
                <span className={s.skeletonTrailing} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
