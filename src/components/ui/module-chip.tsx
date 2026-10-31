import { BarChart3, ClipboardCheck, ClipboardList, Compass, Gamepad2 } from "lucide-react";
import { PROGRAM_MODULE_META, type ProgramModuleKey } from "@/lib/program-modules";

const icons = {tbos: Gamepad2, lep: ClipboardCheck, binainsight: BarChart3, pre_test: ClipboardList, post_test: ClipboardCheck, peta: Compass} satisfies Record<ProgramModuleKey, typeof Compass>;

export function ModuleChip({ moduleKey, description = false }: { moduleKey: ProgramModuleKey; description?: boolean }) {
  const data = PROGRAM_MODULE_META[moduleKey], Icon = icons[moduleKey];
  if (!data || !Icon) return null;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900"><Icon className="h-3.5 w-3.5" aria-hidden="true" /> {data.label}{description ? ` · ${data.description}` : ""}</span>;
}
