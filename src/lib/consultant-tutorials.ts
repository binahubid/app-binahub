export type ConsultantTutorial = {
  id: string;
  series: "fitur" | "sop";
  title: string;
  description: string;
  duration: string;
  drive: {
    fileId: string;
    resourceKey?: string;
  };
};

export function tutorialDriveUrl(episode: ConsultantTutorial, view: "preview" | "view") {
  const url = new URL(`https://drive.google.com/file/d/${encodeURIComponent(episode.drive.fileId)}/${view}`);
  if (episode.drive.resourceKey) url.searchParams.set("resourcekey", episode.drive.resourceKey);
  return url.href;
}
