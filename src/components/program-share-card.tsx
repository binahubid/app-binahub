"use client";

import { Copy, Download, Link2, QrCode, Send, ShieldCheck } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { programAccessUrl, programInvitationText } from "@/lib/program-access-link";

export function ProgramShareCard({
  programId,
  code,
  title,
  status,
}: {
  programId: string;
  code: string;
  title: string;
  status: string;
}) {
  const [origin, setOrigin] = useState("https://app.binahub.id");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const available = ["active", "in_progress", "review"].includes(status);

  useEffect(() => {
    void Promise.resolve().then(() => setOrigin(window.location.origin));
  }, []);

  const link = programAccessUrl(programId, origin, code);
  const invitation = programInvitationText({ programId, code, title, origin });

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(link, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0B2C6B", light: "#FFFFFF" },
    }).then((value) => {
      if (active) setQrDataUrl(value);
    }).catch(() => {
      if (active) setQrDataUrl("");
    });
    return () => { active = false; };
  }, [link]);

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Browser tidak mengizinkan penyalinan otomatis. Salin teks secara manual.");
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Program BinaHub — ${title}`, text: invitation });
        return;
      }
      await copy(invitation, "Undangan program disalin.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Undangan belum dapat dibagikan. Coba salin tautan dan kode secara terpisah.");
    }
  };

  const downloadQr = async () => {
    if (!qrDataUrl) {
      toast.error("QR code belum siap. Coba beberapa saat lagi.");
      return;
    }
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 760;
      canvas.height = 900;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#0B2C6B";
      context.font = "700 28px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("BinaHub Program Access", canvas.width / 2, 54);
      context.drawImage(image, 60, 82, 640, 640);
      context.fillStyle = "#0F172A";
      context.font = "700 27px Arial, sans-serif";
      const readableTitle = title.length > 42 ? `${title.slice(0, 39)}…` : title;
      context.fillText(readableTitle, canvas.width / 2, 770);
      context.fillStyle = "#D18B15";
      context.font = "700 24px Arial, sans-serif";
      context.fillText(`Kode program: ${code}`, canvas.width / 2, 810);
      context.fillStyle = "#64748B";
      context.font = "400 17px Arial, sans-serif";
      context.fillText("Pindai QR; kode program akan terisi otomatis.", canvas.width / 2, 850);

      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "program";
      const anchor = document.createElement("a");
      anchor.href = canvas.toDataURL("image/png");
      anchor.download = `binahub-qr-${code.toLowerCase()}-${safeTitle}.png`;
      anchor.click();
      toast.success("QR code program diunduh.");
    };
    image.onerror = () => toast.error("QR code gagal diproses.");
    image.src = qrDataUrl;
  };

  return (
    <section className="rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 text-left shadow-[0_20px_60px_-48px_rgba(11,44,107,0.55)] sm:p-6" aria-labelledby="share-program-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><Send className="h-4.5 w-4.5" aria-hidden="true" /></span>
        <div>
          <h3 id="share-program-title" className="font-bold text-[#0B2C6B]">Bagikan kepada peserta</h3>
          <p className="mt-1 text-xs leading-5 text-[#4A4C54]/65">Kirim tautan atau QR berikut. Kode program sudah tertanam dan akan terisi otomatis, lalu tetap diverifikasi oleh server.</p>
        </div>
      </div>

      {!available && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Program masih berstatus <strong>{status === "draft" ? "Draf" : status}</strong>. Tautan boleh dibagikan, tetapi peserta baru dapat masuk setelah program diaktifkan.
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"><Link2 className="h-3.5 w-3.5" /> Tautan program</div>
            <p className="mt-1.5 truncate text-xs font-semibold text-blue-900" title={link}>{link}</p>
          </div>
          <button type="button" onClick={() => void copy(link, "Tautan program disalin.")} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-blue-900"><Copy className="h-3.5 w-3.5" /> Salin</button>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#D9A441]/30 bg-[#FFF9EA] p-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A6817]">Kode akses</p>
            <p className="mt-1 font-mono text-base font-bold tracking-[0.12em] text-[#0B2C6B]">{code}</p>
          </div>
          <button type="button" onClick={() => void copy(code, "Kode akses disalin.")} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-[#0B2C6B] shadow-sm"><Copy className="h-3.5 w-3.5" /> Salin</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-[9rem_1fr] sm:items-center">
        <div className="flex aspect-square items-center justify-center border border-slate-200 bg-white p-2" aria-label={`QR code untuk program ${title}`}>
          {qrDataUrl ? <Image src={qrDataUrl} alt={`QR code akses program ${title}`} width={640} height={640} unoptimized className="h-full w-full" /> : <QrCode className="h-10 w-10 animate-pulse text-slate-300" aria-hidden="true" />}
        </div>
        <div>
          <p className="text-sm font-bold text-[#0B2C6B]">QR akses peserta</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">File unduhan menyertakan nama dan kode program, sehingga tetap mudah dikenali saat tersimpan atau dicetak.</p>
          <button type="button" onClick={() => void downloadQr()} disabled={!qrDataUrl} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 px-4 text-xs font-bold text-blue-900 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-50">
            <Download className="h-4 w-4" /> Download PNG
          </button>
        </div>
      </div>

      <button type="button" onClick={() => void share()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-bold text-white hover:bg-[#071B3D]">
        <Send className="h-4 w-4" /> Bagikan undangan lengkap
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#4A4C54]/55"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Kode pada tautan hanya memilih program dan tetap diverifikasi oleh server.</p>
    </section>
  );
}
