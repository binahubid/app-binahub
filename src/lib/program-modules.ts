export const PROGRAM_MODULE_KEYS = ["tbos", "lep", "binainsight"] as const;

export type ProgramModuleKey = (typeof PROGRAM_MODULE_KEYS)[number];

export const PROGRAM_MODULE_META: Record<ProgramModuleKey, { label: string; description: string }> = {
  tbos: { label: "T-BOS", description: "Observasi perilaku tim berbasis misi" },
  lep: { label: "LEP", description: "Evaluasi program oleh peserta" },
  binainsight: { label: "BinaInsight", description: "Diagnostik performa 7 dimensi untuk peserta" },
};
