"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { tutorialDriveUrl, type ConsultantTutorial } from "@/lib/consultant-tutorials";
import { useConsultantData } from "./consultant-overview";
import portal from "./consultant.module.css";
import s from "./consultant-tutorials.module.css";

const seriesOptions = [
  { id: "fitur", title: "Fitur portal" },
  { id: "sop", title: "Alur kerja" },
] as const;

function TutorialPlaylist({ episodes }: { episodes: ConsultantTutorial[] }) {
  const [episode, setEpisode] = useState(episodes[0]);
  const [series, setSeries] = useState(episodes[0].series);
  const [query, setQuery] = useState("");
  const player = useRef<HTMLElement>(null);
  const search = query.trim().toLocaleLowerCase("id");
  const visible = episodes.filter((item) =>
    item.series === series && `${item.id} ${item.title}`.toLocaleLowerCase("id").includes(search),
  );

  function selectEpisode(item: ConsultantTutorial) {
    setEpisode(item);
    if (window.matchMedia("(max-width: 1100px)").matches) {
      player.current?.scrollIntoView({ block: "start" });
    }
  }

  return (
    <div className={s.library}>
      <section ref={player} className={s.player} aria-labelledby="tutorial-now-playing">
        <iframe
          key={episode.id}
          className={s.frame}
          title={`Video ${episode.id} · ${episode.title}`}
          src={tutorialDriveUrl(episode, "preview")}
          allow="fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
        <div className={s.details}>
          <div aria-live="polite">
            <p className={s.episodeMeta}>{episode.id} · {episode.duration}</p>
            <h2 id="tutorial-now-playing">{episode.title}</h2>
            <p className={portal.muted}>{episode.description}</p>
          </div>
          <a
            href={tutorialDriveUrl(episode, "view")}
            className={portal.button}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} aria-hidden="true" /> Buka di Drive
          </a>
        </div>
      </section>
      <section className={s.playlist} aria-labelledby="tutorial-playlist">
        <h2 id="tutorial-playlist">Daftar episode</h2>
        <div className={s.series} role="group" aria-label="Seri tutorial">
          {seriesOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={series === option.id}
              onClick={() => {
                setSeries(option.id);
                setQuery("");
              }}
            >
              {option.title}
            </button>
          ))}
        </div>
        <label className={portal.field}>
          <span className="sr-only">Cari episode</span>
          <input
            type="search"
            placeholder="Cari episode…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {visible.length ? (
          <ul className={s.episodes} key={series}>
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={s.episode}
                  aria-pressed={episode.id === item.id}
                  onClick={() => selectEpisode(item)}
                >
                  <Image
                    src={`/consultant/tutorials/${item.id}.webp`}
                    width={320}
                    height={180}
                    alt=""
                    unoptimized
                  />
                  <span>
                    <span className={s.episodeMeta}>{item.id} · {item.duration}</span>
                    <strong>{item.title}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty} role="status">Tidak ada episode yang cocok. Coba judul atau kode lain.</p>
        )}
      </section>
    </div>
  );
}

export function ConsultantTutorialLibrary() {
  const { data, error, reload } = useConsultantData<ConsultantTutorial[]>(
    "/konsultan/materials/tutorial/catalog",
  );
  if (error) {
    return (
      <section className={portal.panel}>
        <p role="alert">{error}</p>
        <button type="button" className={portal.button} onClick={reload}>Coba lagi</button>
      </section>
    );
  }
  if (!data) return <p role="status">Memuat daftar video…</p>;
  return <TutorialPlaylist episodes={data} />;
}
