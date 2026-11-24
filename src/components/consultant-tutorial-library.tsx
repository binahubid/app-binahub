"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  isTutorialVersion,
  tutorialDriveUrl,
  tutorialThumbnail,
  tutorialVersions,
  tutorialVideo,
  type ConsultantTutorial,
  type TutorialVersion,
} from "@/lib/consultant-tutorials";
import { ConsultantPending, consultantTutorialUrl, useConsultantData } from "./consultant-data";
import { ConsultantVideoPlayer } from "./consultant-video-player";
import portal from "./consultant.module.css";
import s from "./consultant-tutorials.module.css";
import { useConsultantLocale } from "@/components/consultant-language";

const seriesOptions = [
  { id: "fitur", title: "Fitur portal" },
  { id: "sop", title: "Alur kerja" },
] as const;

function videosForVersion(episodes: ConsultantTutorial[], version: TutorialVersion) {
  return episodes.flatMap((episode) => {
    const video = tutorialVideo(episode, version);
    return video ? [video] : [];
  });
}

function TutorialPlaylist({ episodes, first }: { episodes: ConsultantTutorial[]; first: ConsultantTutorial }) {
  const { t } = useConsultantLocale();
  const [episode, setEpisode] = useState(first);
  const [series, setSeries] = useState(first.series);
  const [version, setVersion] = useState<TutorialVersion>("id");
  const [query, setQuery] = useState("");
  const player = useRef<HTMLElement>(null);
  const versions = tutorialVersions.filter(({ id }) => episodes.some((item) => tutorialVideo(item, id)));
  const videos = videosForVersion(episodes, version);
  const availableSeries = seriesOptions.filter(({ id }) => videos.some((item) => item.series === id));
  const locale = version === "en" ? "en" : "id";
  const search = query.trim().toLocaleLowerCase(locale);
  const visible = videos.filter((item) =>
    item.series === series && `${item.id} ${item.title}`.toLocaleLowerCase(locale).includes(search),
  );

  function selectVersion(next: TutorialVersion) {
    const choices = videosForVersion(episodes, next);
    const inSeries = choices.filter((item) => item.series === series);
    const first = inSeries.find((item) => item.id === episode.id) ?? inSeries[0] ?? choices[0];
    if (!first) return;
    setVersion(next);
    setEpisode(first);
    setSeries(first.series);
    setQuery("");
  }

  function selectEpisode(item: ConsultantTutorial) {
    setEpisode(item);
    if (window.matchMedia("(max-width: 1100px)").matches) {
      window.requestAnimationFrame(() => {
        player.current?.focus({ preventScroll: true });
        player.current?.scrollIntoView({ block: "start" });
      });
    }
  }

  return (
    <div className={s.library}>
      <section ref={player} className={s.player} aria-labelledby="tutorial-now-playing" tabIndex={-1}>
        <ConsultantVideoPlayer key={episode.drive.fileId} episode={episode} version={version} />
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
            <ExternalLink size={16} aria-hidden="true" /> {t("Buka di Drive")}</a>
        </div>
      </section>
      <section className={s.playlist} aria-labelledby="tutorial-playlist">
        <h2 id="tutorial-playlist">{t("Daftar episode")}</h2>
        {versions.length > 1 && (
          <label className={`${portal.field} ${s.version}`}>
            <span>{t("Versi video")}</span>
            <select
              value={version}
              onChange={(event) => {
                const value = event.target.value;
                if (isTutorialVersion(value)) selectVersion(value);
              }}
            >
              {versions.map(({ id, label }) => <option key={id} value={id}>{t(label)}</option>)}
            </select>
          </label>
        )}
        <div className={s.series} role="group" aria-label={t("Seri tutorial")}>
          {availableSeries.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={series === option.id}
              onClick={() => {
                setSeries(option.id);
                setQuery("");
              }}
            >
              {t(option.title)}
            </button>
          ))}
        </div>
        <label className={portal.field}>
          <span className="sr-only">{t("Cari episode")}</span>
          <input
            type="search"
            placeholder={t("Cari episode…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {visible.length ? (
          <ul className={s.episodes} key={`${version}-${series}`}>
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={s.episode}
                  aria-pressed={episode.id === item.id}
                  onClick={() => selectEpisode(item)}
                >
                  <Image
                    src={tutorialThumbnail(item.id, version)}
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
          <p className={s.empty} role="status">{t("Tidak ada episode yang cocok. Coba judul atau kode lain.")}</p>
        )}
      </section>
    </div>
  );
}

export function ConsultantTutorialLibrary() {
  const { t } = useConsultantLocale();
  const episodeId = useSearchParams().get("episode");
  const { data, error, reload } = useConsultantData<ConsultantTutorial[]>(
    consultantTutorialUrl,
  );
  if (error) {
    return (
      <section className={portal.panel}>
        <p role="alert">{t(error)}</p>
        <button type="button" className={portal.button} onClick={reload}>{t("Coba lagi")}</button>
      </section>
    );
  }
  if (!data) return <ConsultantPending message="Memuat daftar video…" />;
  const first = data.find((episode) => episode.id === episodeId) ?? data[0];
  if (!first) return <p className={portal.empty}>{t("Belum ada video panduan.")}</p>;
  return <TutorialPlaylist key={first.id} episodes={data} first={first} />;
}
