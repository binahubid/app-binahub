"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ExternalLink, Mail } from "lucide-react";
import type { CalendarBookingRecord } from "../_lib/types";
import { formatDate } from "../_lib/utils";
import { AdminSearch, AdminSelect, Badge, Panel } from "./shared";

function statusTone(status: string): "navy" | "gold" | "green" | "red" {
  if (["confirmed", "rescheduled", "completed"].includes(status)) return "green";
  if (["cancelled", "rejected", "no_show"].includes(status)) return "red";
  if (status === "requested") return "gold";
  return "navy";
}

export function MeetingsPanel({ bookings }: { bookings: CalendarBookingRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return bookings.filter((booking) =>
      [booking.attendeeName, booking.attendeeEmail, booking.title, booking.eventTypeSlug, booking.status]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
      && (status === "Semua" || booking.status === status)
    );
  }, [bookings, search, status]);
  const statuses = Array.from(new Set(bookings.map((booking) => booking.status))).sort();

  return (
    <Panel title="Meeting Cal.com" action={`${filtered.length}/${bookings.length} booking`}>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <AdminSearch value={search} onChange={setSearch} placeholder="Cari peserta, email, atau event…" />
        <AdminSelect value={status} onChange={setStatus} options={["Semua", ...statuses]} />
      </div>
      {bookings.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-black/10 bg-[#FCFCFB] p-10 text-center">
          <CalendarClock className="mx-auto text-[#D9A441]" size={28} />
          <p className="mt-3 text-sm font-semibold text-[#0B2C6B]">Belum ada booking tersinkronisasi.</p>
          <p className="mt-1 text-xs text-black/45">Aktifkan webhook Cal.com setelah migration dan secret production tersedia.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((booking) => {
            return (
              <article key={booking.id} className="rounded-[12px] border border-black/[0.05] bg-[#FCFCFB] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#0B2C6B]">{booking.title}</h3>
                      {booking.isUpcoming && <Badge tone="gold">Upcoming</Badge>}
                      <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700">{booking.attendeeName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-black/48"><Mail size={13} />{booking.attendeeEmail}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-semibold text-[#0B2C6B]">{formatDate(booking.startTime)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">{booking.timeZone}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] pt-4">
                  <p className="text-xs text-black/45">Event: {booking.eventTypeSlug || "-"} · UID: {booking.providerUid}</p>
                  {booking.meetingUrl && (
                    <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                      Buka meeting <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {booking.cancellationReason && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Alasan: {booking.cancellationReason}</p>}
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
