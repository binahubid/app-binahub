"use client";

import { useEffect, useCallback, useId, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => unknown | Promise<unknown>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const busy = loading || internalLoading;
  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    busyRef.current = busy;
    onCloseRef.current = onClose;
  }, [busy, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && !busyRef.current) {
      e.preventDefault();
      onCloseRef.current();
      return;
    }
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const elements = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!elements.length) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setInternalLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // The action owner is responsible for showing its contextual error.
    } finally {
      setInternalLoading(false);
    }
  };

  const confirmColors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    info: "bg-[#0B2C6B] hover:bg-[#0A255A]",
  };
  const iconStyles = {
    danger: { wrapper: "bg-red-50", icon: "text-red-600", Icon: AlertTriangle },
    warning: { wrapper: "bg-amber-50", icon: "text-amber-600", Icon: AlertCircle },
    info: { wrapper: "bg-blue-50", icon: "text-[#0B2C6B]", Icon: Info },
  };
  const Icon = iconStyles[variant].Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center" onClick={() => { if (!busy) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} aria-busy={busy} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconStyles[variant].wrapper}`}>
            <Icon size={20} className={iconStyles[variant].icon} aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[#0B2C6B]">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-5 text-[#4A4C54]/70">{description}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-11 flex-1 rounded-xl border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${confirmColors[variant]}`}
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
