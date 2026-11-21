"use client";
import { useState } from "react";
import type { ConsultantTutorial } from "@/lib/consultant-tutorials";
import s from "./consultant-tutorials.module.css";

export function ConsultantVideoPlayer({ episode }: { episode: ConsultantTutorial }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <>
    <video key={attempt} className={s.frame} controls playsInline preload="metadata"
      aria-label={`Video ${episode.id} · ${episode.title}`} poster={`/consultant/tutorials/${episode.id}.webp`}
      src={`/konsultan/materials/tutorial/media/${episode.id}`}
      onError={() => setFailed(true)} onLoadedMetadata={() => setFailed(false)}>
      Browser Anda belum mendukung pemutar video ini. Gunakan tombol Buka di Drive.
    </video>
    {failed && <div className={s.playerError}>
      <p role="alert">Video belum dapat dimuat. Coba lagi atau gunakan tombol Buka di Drive.</p>
      <button type="button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Coba lagi</button>
    </div>}
  </>;
}
