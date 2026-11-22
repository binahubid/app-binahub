"use client";
import { useState } from "react";
import { tutorialThumbnail, type ConsultantTutorial, type TutorialVersion } from "@/lib/consultant-tutorials";
import s from "./consultant-tutorials.module.css";

export function ConsultantVideoPlayer({ episode, version }: {
  episode: ConsultantTutorial;
  version: TutorialVersion;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mediaPath = `/konsultan/materials/tutorial/media/${episode.id}`;
  const src = version === "id" ? mediaPath : `${mediaPath}?version=${version}`;
  return <>
    <video key={attempt} className={version === "mobile" ? `${s.frame} ${s.portraitFrame}` : s.frame}
      controls playsInline preload="metadata" aria-label={`Video ${episode.id} · ${episode.title}`}
      poster={tutorialThumbnail(episode.id, version, true)} src={src}
      onError={() => setFailed(true)} onLoadedMetadata={() => setFailed(false)}>
      Browser Anda belum mendukung pemutar video ini. Gunakan tombol Buka di Drive.
    </video>
    {failed && <div className={s.playerError}>
      <p role="alert">Video belum dapat dimuat. Coba lagi atau gunakan tombol Buka di Drive.</p>
      <button type="button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Coba lagi</button>
    </div>}
  </>;
}
