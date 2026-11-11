"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { consultantRequest } from "@/lib/consultant-client";
import { fetchAuthenticatedRole } from "@/lib/authenticated-role";
import { supabase } from "@/lib/supabase";
import s from "@/components/consultant.module.css";

async function activateInvite(hash: string) {
  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (params.get("type") !== "invite" || !accessToken || !refreshToken) {
    throw new Error("Tautan undangan sudah digunakan atau tidak valid.");
  }
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session)
    throw new Error(
      "Tautan undangan tidak dapat dibuka. Hubungi admin BinaHub.",
    );
  const role = await fetchAuthenticatedRole(data.session.access_token);
  if (!role.ok)
    throw new Error("Akses akun belum siap. Hubungi admin BinaHub.");
  if (role.role === "consultant")
    await consultantRequest("/api/konsultan/session");
  return role.role === "consultant" ? "/konsultan" : "/home";
}

export default function ConsultantInvitePage() {
  const router = useRouter();
  const activation = useRef<Promise<string> | null>(null);
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    if (!activation.current) {
      const hash = window.location.hash;
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
      activation.current = activateInvite(hash);
    }
    void activation.current
      .then((path) => {
        if (current) setDestination(path);
      })
      .catch((e) => {
        if (current)
          setError(
            e instanceof Error ? e.message : "Undangan tidak dapat dibuka.",
          );
      });
    return () => {
      current = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirmation")) {
      setError("Kedua kata sandi harus sama.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error)
        throw new Error(
          "Kata sandi belum tersimpan. Coba kata sandi yang lebih kuat.",
        );
      router.replace(destination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aktivasi belum selesai.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={s.access}>
      <Image src="/full-logo.png" alt="BinaHub" width={160} height={48} />
      <h1>
        {destination === "/konsultan"
          ? "Aktifkan akun konsultan"
          : "Aktifkan akun BinaHub"}
      </h1>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {destination ? (
        <form className={s.form} onSubmit={submit}>
          <p>Buat kata sandi untuk masuk kembali ke akun BinaHub.</p>
          <label className={s.field}>
            Kata sandi baru
            <input
              type="password"
              name="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </label>
          <label className={s.field}>
            Ulangi kata sandi
            <input
              type="password"
              name="confirmation"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </label>
          <button className={s.primary} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan dan buka portal"}
          </button>
        </form>
      ) : error ? (
        <Link href="/?mode=signin&next=/konsultan">
          Masuk ke Portal Konsultan
        </Link>
      ) : (
        <p role="status">Memverifikasi undangan…</p>
      )}
    </main>
  );
}
