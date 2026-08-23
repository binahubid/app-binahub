import { BarChart3, ClipboardCheck, Gamepad2 } from "lucide-react";
import type { ProgramModuleKey } from "@/lib/program-modules";

export function ModuleChip({ moduleKey, description = false }: { moduleKey: ProgramModuleKey; description?: boolean }) {
  const data = moduleKey === "lep"
    ? { label: "LEP", detail: "Evaluasi Program", Icon: ClipboardCheck }
    : moduleKey === "binainsight"
      ? { label: "BinaInsight", detail: "Diagnostik Performa", Icon: BarChart3 }
      : { label: "T-BOS", detail: "Observasi Perilaku", Icon: Gamepad2 };
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900"><data.Icon className="h-3.5 w-3.5" /> {data.label}{description ? ` · ${data.detail}` : ""}</span>;
}
