import { describe, it, expect } from 'vitest';
import { restoreTrialDraft, validTrialAnswer, trialSelectedAnswer, type TrialDefinition } from './individual-trial';
const definition: TrialDefinition = { demo: true, product: 'pe', revision: 'a'.repeat(64), offer: { title: 'PE', price: 59000, selfReport: 1, sjt: 1 },
  definition: { title: 'PE', selfReportScale: [{ value: 1, label: 'Jarang' }, { value: 'NA', label: 'Belum ada kesempatan' }], selfReportItems: [{ id: 'SR01', prompt: 'Synthetic' }], sjtItems: [{ id: 'SJ01', question: 'Synthetic', options: [{ id: 'A', text: 'Opsi terpilih' }] }] } };
describe('individual demo draft boundary', () => {
  const draft = { revision: definition.revision, expiresAt: 2000, stage: 'review', index: 1, responses: { SR01: 'NA', SJ01: 'A' } };
  it('restores only current, unexpired demo responses', () => {
    expect(restoreTrialDraft(JSON.stringify(draft), definition, 1000)).toEqual(draft);
    for (const changed of [{ revision: 'other' }, { expiresAt: 1000 }, { expiresAt: 86401001 }, { responses: { other: 1 } }, { responses: { SR01: 'A' } }, { responses: { SJ01: 1 } }, { index: -1 }, { stage: 'paid_real' }])
      expect(restoreTrialDraft(JSON.stringify({ ...draft, ...changed }), definition, 1000)).toBeNull();
    expect(restoreTrialDraft('not-json', definition)).toBeNull();
  });
  it('does not coerce answer domains or show unselected options', () => {
    expect(validTrialAnswer(definition, 'SR01', '1')).toBe(false);
    expect(validTrialAnswer(definition, 'SR01', 1)).toBe(true);
    expect(validTrialAnswer(definition, 'SJ01', 'NA')).toBe(false);
    expect(trialSelectedAnswer(definition, definition.definition.sjtItems[0], 'A')).toBe('Opsi terpilih');
  });
});
