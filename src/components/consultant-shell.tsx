"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useEffectEvent, useState, type MouseEvent } from "react";
import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  BookOpen,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import {
  consultantRequest,
  type ConsultantSession,
} from "@/lib/consultant-client";
import { supabase } from "@/lib/supabase";
import s from "./consultant.module.css";
import { ConsultantLanguageSelect, useConsultantLocale } from "@/components/consultant-language";
import {
  ConsultantDirectorySearch, ConsultantPending, ConsultantReads, consultantAgendaUrl, consultantDirectoryUrl,
  consultantMyDirectoryUrl,
  consultantTutorialUrl, createConsultantReads,
} from "./consultant-data";
const Session = createContext<ConsultantSession | null>(null);
export function useConsultant() {
  const a = useContext(Session);
  if (!a) throw new Error("Portal session required");
  return a;
}
const nav = [
  { href: "/konsultan", label: "Beranda", icon: LayoutDashboard },
  { href: "/konsultan/clients", label: "Klien & peluang", icon: UsersRound },
  { href: "/konsultan/tasks", label: "Tugas & jadwal", icon: CalendarDays },
  { href: "/konsultan/materials", label: "Materi", icon: BookOpen },
];
const amsOrigin = "https://ams.binahub.id";
const pageReads: Record<string, readonly string[]> = {
  "/konsultan": [consultantMyDirectoryUrl, consultantDirectoryUrl],
  "/konsultan/clients": [consultantMyDirectoryUrl],
  "/konsultan/tasks": [consultantMyDirectoryUrl, consultantAgendaUrl],
  "/konsultan/materials/tutorial": [consultantTutorialUrl],
};

export function ConsultantShell({ children }: { children: React.ReactNode }) {
  const { locale, t } = useConsultantLocale();
  const [session, setSession] = useState<ConsultantSession | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [reads] = useState(createConsultantReads);
  const [search, setSearch] = useState("");
  const [returning, setReturning] = useState(false);
  const pathname = usePathname(),
    router = useRouter();
  const signIn = useEffectEvent(() => {
    router.replace("/?mode=signin&next=" + encodeURIComponent(pathname));
  });

  useEffect(() => {
    const controller = new AbortController();
    let authUser: string | undefined;
    let checking = false;
    let verifiedAt = 0;

    async function verify(preload = false) {
      if (checking || controller.signal.aborted) return;
      checking = true;
      try {
        const { data } = await supabase.auth.getSession();
        if (controller.signal.aborted) return;
        if (!data.session) {
          reads.clear();
          setSession(null);
          signIn();
          return;
        }
        authUser = data.session.user.id;
        if (preload) {
          for (const url of pageReads[window.location.pathname] ?? []) {
            void reads.load(url).catch(() => {});
          }
        }
        const verified = await consultantRequest<ConsultantSession>(
          "/api/konsultan/session", undefined, "GET",
          AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
        );
        if (!controller.signal.aborted) {
          verifiedAt = Date.now();
          setSession(verified);
          setError("");
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          reads.clear();
          setSession(null);
          setError(
            e instanceof Error && e.name !== "TimeoutError"
              ? e.message
              : "Portal belum dapat dibuka. Coba lagi.",
          );
        }
      } finally {
        checking = false;
      }
    }
    void verify(true);
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible" && Date.now() - verifiedAt >= 30_000) {
        void verify();
      }
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_OUT" && (!authUser || !next || next.user.id === authUser)) return;
      controller.abort();
      reads.clear();
      setSearch("");
      setSession(null);
      if (event === "SIGNED_OUT") signIn();
      else setRetry((value) => value + 1);
    });
    return () => {
      controller.abort();
      listener.subscription.unsubscribe();
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [reads, retry]);

  useEffect(() => {
    const restore = () => setReturning(false);
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  function goToAms(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setReturning(true);
  }

  function warmPage(href: string) {
    for (const url of pageReads[href] ?? []) void reads.load(url).catch(() => {});
  }

  if (!session)
    return (
      <main className={s.access} lang={locale}>
        <Image src="/full-logo.png" alt="BinaHub" width={160} height={50} />
        <h1>{t("Portal Konsultan")}</h1>
        <ConsultantLanguageSelect />
        {error ? (
          <>
            <p role="alert">{t(error)}</p>
            <button onClick={() => setRetry((v) => v + 1)}>{t("Coba lagi")}</button>
            <Link href="/home">{t("Kembali ke ruang kerja")}</Link>
            <button
              onClick={() => void supabase.auth.signOut({ scope: "local" })}
            >{t("Ganti akun")}</button>
          </>
        ) : (
          <ConsultantPending message="Memverifikasi akses Anda…" />
        )}
      </main>
    );
  return (
    <Session.Provider value={session}>
      <ConsultantReads.Provider value={reads}>
      <ConsultantDirectorySearch.Provider value={[search, setSearch]}>
      <div className={s.shell} lang={locale}>
        <link rel="preconnect" href={amsOrigin} />
        <aside className={s.sidebar}>
          <Link href="/konsultan" aria-label={t("Beranda konsultan BinaHub")}>
            <Image
              src="/full-logo.png"
              alt="BinaHub"
              width={150}
              height={48}
              priority
            />
          </Link>
          <p className={s.workspaceLabel}>{t("Ruang konsultan")}</p>
          <a href={amsOrigin + "/dashboard"} className={s.textlink} onClick={goToAms}>
            {returning ? t("Membuka AMS…") : t("Kembali ke AMS")}
          </a>
          <nav aria-label={t("Portal konsultan")}>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                prefetch
                onMouseEnter={() => warmPage(n.href)}
                onFocus={() => warmPage(n.href)}
                onPointerDown={() => warmPage(n.href)}
                aria-current={
                  pathname === n.href ||
                  (n.href !== "/konsultan" && pathname.startsWith(n.href + "/"))
                    ? "page"
                    : undefined
                }
              >
                <n.icon size={19} aria-hidden="true" />
                <span>{t(n.label)}</span>
              </Link>
            ))}
          </nav>
          <div className={s.account}>
            <strong>{session.name}</strong>
            <span>
              {session.isAdmin ? t("Admin · Konsultasi") : t("Konsultan BinaHub")}
            </span>
            {session.isAdmin && (
              <Link href="/admin/consultants">
                <ArrowLeft size={16} /> {t("Kelola tim")}</Link>
            )}
            <button
              onClick={() => void supabase.auth.signOut({ scope: "local" })}
            >
              <LogOut size={16} />{t("Keluar")}</button>
          </div>
        </aside>
        <div className={s.body}>
          <header className={s.topbar}>
            <span>{t("Portal Konsultan")}</span>
            <div className={s.actions}>
              <span className={s.topbarAccount}>{session.name}</span>
              <a href={amsOrigin + "/dashboard"} className={s.amsBackMobile}
                onClick={goToAms} aria-label={t("Kembali ke AMS")}>
                <ArrowLeft size={15} aria-hidden="true" /> AMS
              </a>
              <ConsultantLanguageSelect />
              <button
                className={s.mobileAccount}
                aria-label={t("Keluar dari Portal Konsultan")}
                onClick={() => void supabase.auth.signOut({ scope: "local" })}
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </div>
          </header>
          <main className={s.main} id="main-content">
            {returning && <ConsultantPending message="Membuka AMS…" />}
            {children}
          </main>
        </div>
      </div>
      </ConsultantDirectorySearch.Provider>
      </ConsultantReads.Provider>
    </Session.Provider>
  );
}
