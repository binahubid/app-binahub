export type TrialProduct = 'pe' | 'rm';
export type TrialAnswer = number | 'NA' | 'A' | 'B' | 'C' | 'D';
export type TrialQuestion = { id: string; prompt?: string; scenario?: string; question?: string; options?: { id: string; text: string }[] };
export type TrialDefinition = {
  demo: true; product: TrialProduct; revision: string;
  offer: { title: string; price: number; selfReport: number; sjt: number };
  definition: { title: string; selfReportScale: { value: TrialAnswer; label: string }[]; selfReportItems: TrialQuestion[]; sjtItems: TrialQuestion[] };
};
export type TrialReport = {
  demo: true; product: TrialProduct; title: string; generatedAt: string; notice: string; methodNote: string;
  moduleProfile: { selfReport: number | null; sjt: number | null; combined: number | null };
  areas: { code: string; name: string; selfReport: number | null; sjt: number | null; combined: number | null }[];
  nextSteps: string[];
};
export type TrialDraft = { revision: string; expiresAt: number; stage: 'checkout' | 'paid' | 'questions' | 'review'; index: number; responses: Record<string, TrialAnswer> };
export const trialMoney = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export const trialQuestions = (d: TrialDefinition) => [...d.definition.selfReportItems, ...d.definition.sjtItems];
export function validTrialAnswer(d: TrialDefinition, id: string, value: unknown): value is TrialAnswer {
  if (d.definition.selfReportItems.some(q => q.id === id)) return d.definition.selfReportScale.some(o => o.value === value);
  return d.definition.sjtItems.find(q => q.id === id)?.options?.some(o => o.id === value) === true;
}
// Demo responses only, scoped to this browser tab/admin and source revision; never a payment/entitlement.
export function restoreTrialDraft(raw: string | null, d: TrialDefinition, now = Date.now()): TrialDraft | null {
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || v.revision !== d.revision || !Number.isFinite(v.expiresAt) || v.expiresAt <= now || v.expiresAt > now + 86400000 ||
      !['checkout', 'paid', 'questions', 'review'].includes(v.stage) || !Number.isInteger(v.index) || v.index < 0 || v.index > trialQuestions(d).length ||
      !v.responses || Array.isArray(v.responses) || typeof v.responses !== 'object') return null;
    if (Object.entries(v.responses).some(([id, value]) => !validTrialAnswer(d, id, value))) return null;
    return { revision: d.revision, expiresAt: v.expiresAt, stage: v.stage, index: v.index, responses: v.responses };
  } catch { return null; }
}
export function trialSelectedAnswer(d: TrialDefinition, q: TrialQuestion, value: TrialAnswer | undefined) {
  return q.options ? q.options.find(o => o.id === value)?.text : d.definition.selfReportScale.find(o => o.value === value)?.label;
}
