import type { EngagementStatus } from "@/lib/transformation-types";

export const PROGRAM_STATUS_LABELS: Record<EngagementStatus, string> = {
  draft: "Draf",
  active: "Aktif",
  in_progress: "Berjalan",
  review: "Ditinjau",
  completed: "Selesai",
  archived: "Diarsipkan",
};

export const PROGRAM_STATUS_FLOW: Record<EngagementStatus, EngagementStatus[]> = {
  draft: ["active"],
  active: ["in_progress"],
  in_progress: ["review", "active"],
  review: ["completed", "in_progress"],
  completed: ["archived"],
  archived: [],
};

export function programStatusChoices(status: EngagementStatus) {
  return [status, ...PROGRAM_STATUS_FLOW[status]];
}
