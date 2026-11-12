"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
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
export function ConsultantShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ConsultantSession | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const pathname = usePathname(),
    router = useRouter();
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/?mode=signin&next=" + encodeURIComponent(pathname));
        return;
      }
      try {
        const a = await consultantRequest<ConsultantSession>(
          "/api/konsultan/session",
        );
        if (active) {
          setSession(a);
          setError("");
        }
      } catch (e) {
        if (active) {
          setSession(null);
          setError(
            e instanceof Error ? e.message : "Portal belum dapat dibuka.",
          );
        }
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        router.replace("/?mode=signin&next=/konsultan");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, retry, router]);
  if (!session)
    return (
      <main className={s.access}>
        <Image src="/full-logo.png" alt="BinaHub" width={160} height={50} />
        <h1>Portal Konsultan</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => setRetry((v) => v + 1)}>Coba lagi</button>
            <Link href="/home">Kembali ke ruang kerja</Link>
            <button
              onClick={() => void supabase.auth.signOut({ scope: "local" })}
            >
              Ganti akun
            </button>
          </>
        ) : (
          <p role="status">Memverifikasi akses Anda…</p>
        )}
      </main>
    );
  return (
    <Session.Provider value={session}>
      <div className={s.shell}>
        <aside className={s.sidebar}>
          <Link href="/konsultan" aria-label="Beranda konsultan BinaHub">
            <Image
              src="/full-logo.png"
              alt="BinaHub"
              width={150}
              height={48}
              priority
            />
          </Link>
          <p className={s.workspaceLabel}>Ruang konsultan</p>
          <a href="https://ams.binahub.id/dashboard" className={s.textlink}>Kembali ke AMS</a>
          <nav aria-label="Portal konsultan">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={
                  pathname === n.href ||
                  (n.href !== "/konsultan" && pathname.startsWith(n.href + "/"))
                    ? "page"
                    : undefined
                }
              >
                <n.icon size={19} aria-hidden="true" />
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className={s.account}>
            <strong>{session.name}</strong>
            <span>
              {session.isAdmin ? "Admin · Konsultasi" : "Konsultan BinaHub"}
            </span>
            {session.isAdmin && (
              <Link href="/admin/consultants">
                <ArrowLeft size={16} /> Kelola tim
              </Link>
            )}
            <button
              onClick={() => void supabase.auth.signOut({ scope: "local" })}
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </aside>
        <div className={s.body}>
          <header className={s.topbar}>
            <span>Portal Konsultan</span>
            <div className={s.actions}>
              <span>{session.name}</span>
              <button
                className={s.mobileAccount}
                aria-label="Keluar dari Portal Konsultan"
                onClick={() => void supabase.auth.signOut({ scope: "local" })}
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </div>
          </header>
          <main className={s.main} id="main-content">
            {children}
          </main>
        </div>
      </div>
    </Session.Provider>
  );
}
