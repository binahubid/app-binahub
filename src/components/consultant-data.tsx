"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { consultantRequest } from "@/lib/consultant-client";
import { useConsultantLocale } from "./consultant-language";
import s from "./consultant.module.css";

export const consultantDirectoryUrl = "/api/konsultan";
export const consultantMyDirectoryUrl = consultantDirectoryUrl + "?owner=mine";
export const agendaUrl = (owner: string, kind: string, page: number) =>
  "/api/konsultan/agenda?" + new URLSearchParams({ owner, kind, page: String(page) });
export const consultantAgendaUrl = agendaUrl("mine", "tasks", 0);
export const consultantTutorialUrl = "/konsultan/materials/tutorial/catalog";
const warmUrls = [consultantDirectoryUrl, consultantMyDirectoryUrl, consultantAgendaUrl, consultantTutorialUrl];
const freshForMs = 20_000;

type Entry = { promise: Promise<unknown>; value?: unknown; expiresAt: number };

export function createConsultantReads() {
  const entries = new Map<string, Entry>();
  return {
    load<T>(url: string, signal?: AbortSignal): Promise<T> {
      if (!warmUrls.includes(url)) return consultantRequest<T>(url, undefined, "GET", signal);
      const previous = entries.get(url);
      if (previous && previous.expiresAt > Date.now()) return previous.promise as Promise<T>;

      const request = consultantRequest<T>(url, undefined, "GET", AbortSignal.timeout(12_000));
      const entry: Entry = { promise: request, expiresAt: Infinity };
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
  const current = state?.url === url ? state : undefined;
  return {
    data: current?.data ?? (url ? reads?.peek<T>(url) : undefined),
    error: current?.error,
    reload: () => {
      reads?.clear();
      setRevision((value) => value + 1);
    },
  };
}

export function ConsultantPending({ message = "Memuat halaman…" }: { message?: string }) {
  const { t } = useConsultantLocale();
  return (
    <div className={s.pending} role="status">
      <span className={s.pendingTrack} aria-hidden="true" />
      <span>{t(message)}</span>
    </div>
  );
}
