export const tutorialVersions = [
  { id: "id", label: "Bahasa Indonesia" },
  { id: "en", label: "English" },
  { id: "mobile", label: "Mobile (Bahasa Indonesia)" },
] as const;

export type TutorialVersion = (typeof tutorialVersions)[number]["id"];

type TutorialFile = {
  duration: string;
  drive: {
    fileId: string;
    resourceKey?: string;
  };
};

type TutorialVariant = TutorialFile & { title?: string; description?: string };

export type ConsultantTutorial = TutorialFile & {
  id: string;
  series: "fitur" | "sop";
  title: string;
  description: string;
  versions?: Partial<Record<Exclude<TutorialVersion, "id">, TutorialVariant>>;
};

export function isTutorialVersion(value: string): value is TutorialVersion {
  return tutorialVersions.some(({ id }) => id === value);
}

export function tutorialVideo(episode: ConsultantTutorial, version: TutorialVersion) {
  if (version === "id") return episode;
  const variant = episode.versions?.[version];
  return variant ? { ...episode, ...variant } : undefined;
}

export function tutorialThumbnail(id: string, version: TutorialVersion, poster = false) {
  const suffix = version === "mobile" && poster ? "mobile-poster" : version;
  const filename = version === "id" ? id : `${id}-${suffix}`;
  return `/consultant/tutorials/${filename}.webp`;
}

export function tutorialDriveUrl(episode: ConsultantTutorial, view: "preview" | "view") {
  const url = new URL(`https://drive.google.com/file/d/${encodeURIComponent(episode.drive.fileId)}/${view}`);
  if (episode.drive.resourceKey) url.searchParams.set("resourcekey", episode.drive.resourceKey);
  return url.href;
}
