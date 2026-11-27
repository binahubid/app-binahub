'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Check, CheckCircle2, ChevronDown, LoaderCircle, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-fetch';
import { formatSpinCopy, SpinFieldControl, type SpinCopy } from '@/components/spin-discovery';
import { spinErrors, spinLabel, type SpinAnswers, type SpinOption } from '@/lib/spin-form';
import { hasMeetingAnswer, meetingEffective, meetingFields, meetingProgress, type MeetingContext, type MeetingChecklist } from '../_lib/spin-meeting';

type Props = { id: string; onSaved: (checklist: MeetingChecklist) => void; onDirty: (dirty: boolean) => void; endpoint?: string; readOnly?: boolean; translate?: SpinCopy; locale?: 'id' | 'en' };
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B] disabled:opacity-50';
const serialize = (answers: SpinAnswers, notes: string, status: MeetingChecklist['status']) => JSON.stringify({ answers, notes, status });

export function SpinMeetingChecklist(props: Props) {
  const [loaded, setContext] = useState<MeetingContext | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const t = props.translate || formatSpinCopy;
  const context = useMemo(() => {
    if (!loaded || props.locale !== 'en') return loaded;
    const options = (items?: SpinOption[]) => items?.map(item => ({
      ...item, label: t(item.label.trim().replace(/\s+/g, ' ')),
    }));
    return {
      ...loaded,
      definition: {
        ...loaded.definition,
        stages: loaded.definition.stages.map(stage => t(stage)),
        fields: loaded.definition.fields.map(field => ({
          ...field,
          label: t(field.label.trim().replace(/\s+/g, ' ')),
          options: options(field.options),
          commonOptions: options(field.commonOptions),
          optionGroups: field.optionGroups && Object.fromEntries(
            Object.entries(field.optionGroups).map(([key, choices]) => [key, options(choices) ?? []]),
          ),
        })),
      },
    };
  }, [loaded, props.locale, t]);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    void apiFetch(props.endpoint || `/api/admin/discovery/${props.id}/meeting`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Checklist belum dapat dibuka.'); if (active) { setContext(body); setError(''); } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Checklist belum dapat dibuka.'); });
    return () => { active = false; controller.abort(); };
  }, [props.id, props.endpoint, reload]);
  if (error) return <div role="alert" className="py-5 text-sm leading-6 text-red-700">{t(error)} <button type="button" onClick={() => setReload(value => value + 1)} className={button + ' underline'}>{t('Coba buka lagi')}</button></div>;
  if (!context) return <p role="status" className="flex items-center gap-2 py-6 text-sm text-slate-600"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{t('Memuat checklist meeting…')}</p>;
  if (props.readOnly) {
    const effective = meetingEffective(context, context.checklist.answers);
    return <section aria-label={t('Checklist meeting · hanya baca')} className="mt-5 space-y-4"><p className="text-sm text-slate-600">{t('Kebutuhan dan catatan konsultasi · hanya baca')}</p>{context.definition.stages.map((stage, index) => <details key={stage} name={'meeting-readonly-' + props.id} open={index === 0} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold text-[#0B2C6B]">{stage}</summary><dl className="mt-4 space-y-5">{meetingFields(context.definition, effective, index).map(field => <div key={field.key}><dt className="text-sm font-semibold text-slate-800">{field.label}</dt><dd className="mt-1 whitespace-pre-line text-sm leading-7 text-slate-600">{hasMeetingAnswer(effective[field.key]) ? spinLabel(context.definition, effective, field.key) : t('Belum ditentukan')}</dd></div>)}</dl></details>)}<h4 className="font-semibold">{t('Catatan konsultasi')}</h4><p className="whitespace-pre-line text-sm leading-7 text-slate-600">{context.checklist.notes || t('Belum ada catatan.')}</p></section>;
  }
  return <MeetingEditor key={props.id + ':' + reload} {...props} context={context} onReload={() => { setContext(null); setReload(value => value + 1); }} />;
}

function MeetingEditor({ id, context, onSaved, onDirty, onReload, endpoint, locale = 'id', translate: t = formatSpinCopy }: Props & { context: MeetingContext; onReload: () => void }) {
  const { definition, original, checklist } = context;
  const [additions, setAdditions] = useState(checklist.answers);
  const [notes, setNotes] = useState(checklist.notes);
  const [status, setStatus] = useState(checklist.status);
  const [saved, setSaved] = useState(serialize(checklist.answers, checklist.notes, checklist.status));
  const [updatedAt, setUpdatedAt] = useState(checklist.updated_at);
  const [expanded, setExpanded] = useState<number | 'notes' | null>(checklist.status === 'completed' ? null : 0);
  const [missingOnly, setMissingOnly] = useState(false);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<string[]>([]);
  const [error, setError] = useState(''), [conflict, setConflict] = useState(false), [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [validationTarget, setValidationTarget] = useState<{ key: string }>();
  const revision = useRef(checklist.revision), lock = useRef(false), alive = useRef(true), edits = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const effective = meetingEffective(context, additions), progress = meetingProgress(definition, effective);
  const current = serialize(additions, notes, status), dirty = current !== saved;
  const errors = spinErrors(definition, effective, showErrors);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!validationTarget) return;
    const field = document.getElementById('meeting-field-' + id + '-' + validationTarget.key);
    const focus = field?.querySelector<HTMLElement>('[aria-invalid="true"], input:not([disabled]), textarea:not([disabled]), select:not([disabled])') || heading.current;
    focus?.focus({ preventScroll: true });
    focus?.scrollIntoView?.({ block: 'center' });
  }, [id, validationTarget]);
  useEffect(() => { onDirty(dirty || saving); return () => onDirty(false); }, [dirty, saving, onDirty]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', prevent); return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty, saving]);

  const revealField = useCallback((key: string, answers: SpinAnswers) => {
    const stage = definition.stages.findIndex((_, index) =>
      meetingFields(definition, answers, index).some(field => field.key === key));
    if (stage >= 0) setExpanded(stage);
    setValidationTarget({ key });
  }, [definition]);

  const save = useCallback(async (finish = false) => {
    if (lock.current || conflict) return;
    const targetStatus = finish ? 'completed' : status;
    if (finish) {
      const effectiveAnswers = meetingEffective(context, additions);
      const issues = spinErrors(definition, effectiveAnswers, true);
      if (Object.keys(issues).length) {
        const first = meetingFields(definition, effectiveAnswers).find(field => issues[field.key]);
        setShowErrors(true);
        setMissingOnly(true);
        setMissingKeys(Object.keys(issues));
        setError('Lengkapi jawaban yang wajib sebelum menandai sesi selesai.');
        if (first) revealField(first.key, effectiveAnswers);
        return;
      }
    } else if (Object.keys(spinErrors(definition, meetingEffective(context, additions), false)).length) return;
    lock.current = true; setSaving(true); setError(''); setValidationTarget(undefined);
    const editAtStart = edits.current;
    const payload = { revision: revision.current, answers: additions, notes, status: targetStatus };
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await apiFetch(endpoint || `/api/admin/discovery/${id}/meeting`, { method: 'PATCH', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) { if (response.status === 409 && alive.current) setConflict(true); throw new Error(body.error || 'Perubahan belum tersimpan. Coba simpan lagi.'); }
      const result = body.checklist as MeetingChecklist;
      revision.current = result.revision;
      if (alive.current) {
        // A newer local edit is never replaced by an older in-flight response.
        setSaved(serialize(additions, notes, targetStatus)); setUpdatedAt(result.updated_at);
        onSaved(result);
        if (finish && result.status === 'completed' && edits.current === editAtStart) {
          setStatus('completed');
          setExpanded(null);
          toast.success(t('Checklist meeting berhasil diselesaikan.'));
          window.requestAnimationFrame(() => {
            const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
          });
        }
      }
    } catch (reason) { if (alive.current) setError(reason instanceof Error && reason.name === 'AbortError' ? 'Koneksi terlalu lama. Jawaban masih ada di halaman ini; coba simpan lagi.' : reason instanceof Error ? reason.message : 'Perubahan belum tersimpan.'); }
    finally { clearTimeout(timer); lock.current = false; if (alive.current) setSaving(false); }
  }, [additions, conflict, context, definition, id, notes, onSaved, status, endpoint, revealField, t]);

  useEffect(() => {
    if (!dirty || saving || error || conflict) return;
    const timer = setTimeout(() => void save(), 900); return () => clearTimeout(timer);
  }, [dirty, saving, error, conflict, save]);

  function change(key: string, value: SpinAnswers[string]) {
    onDirty(true);
    edits.current += 1;
    if (missingOnly) setMissingKeys(current => current.includes(key) ? current : [...current, key]);
    setAdditions(current => ({ ...current, [key]: value })); setStatus('in_progress');
    setError(current => conflict ? current : '');
    setValidationTarget(undefined);
  }
  function jumpTo(target: string) {
    const element = document.getElementById(target);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView?.({ block: 'start' });
  }

  const groups = definition.stages.map((label, index) => {
    const all = meetingFields(definition, effective, index);
    return {
      label,
      index,
      progress: meetingProgress(definition, effective, index),
      fields: all.filter(field => !missingOnly || missingKeys.includes(field.key)
        || !hasMeetingAnswer(effective[field.key]) || !!errors[field.key]),
    };
  }).filter(part => part.fields.length > 0);
  const firstIncomplete = meetingFields(definition, effective).find(field =>
    field.required && (!hasMeetingAnswer(effective[field.key]) || errors[field.key]));
  const stageId = (index: number) => 'meeting-stage-' + id + '-' + index;
  const notesId = 'meeting-notes-section-' + id;
  function toggleSection(section: number | 'notes') {
    setExpanded(current => current === section ? null : section);
  }
  function jumpToSection(value: string) {
    if (!value) return;
    const section = value === 'notes' ? value : Number(value);
    setExpanded(section);
    requestAnimationFrame(() => jumpTo(section === 'notes' ? notesId : stageId(section)));
  }
  const toggleMissing = (value: boolean) => {
    setMissingKeys(value ? meetingFields(definition, effective)
      .filter(field => !hasMeetingAnswer(effective[field.key]) || errors[field.key]).map(field => field.key) : []);
    setMissingOnly(value);
  };

  return (
    <section aria-label={t('Checklist meeting')} className="mt-5 min-w-0">
      <header className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 tabIndex={-1} ref={heading} className="text-lg font-semibold text-[#0B2C6B]">{t('Checklist meeting')}</h4>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{t('Jawaban klien menjadi acuan. Lengkapi bagian yang kosong atau catat klarifikasi tanpa mengubah pengisian aslinya.')}</p>
          </div>
          {firstIncomplete && <button type="button" className={button + ' border border-blue-200 bg-white text-[#0B2C6B]'}
            onClick={() => revealField(firstIncomplete.key, effective)}>
            {t('Ke isian wajib berikutnya')}<ArrowDown size={16} aria-hidden="true" />
          </button>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold tabular-nums text-slate-800">{t('{0} dari {1} bagian terisi', [progress.answered, progress.total])}</span>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-slate-700">
            <input type="checkbox" checked={missingOnly} onChange={event => toggleMissing(event.target.checked)} className="size-4 accent-[#0B2C6B]" />
            {t('Hanya yang belum diisi')}
          </label>
        </div>
        <progress max={Math.max(1, progress.total)} value={progress.answered} aria-label={t('Kemajuan checklist')}
          className="block h-2 w-full accent-[#0B2C6B]" />
      </header>

      {error && <div role="alert" className="my-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{t(error)}{conflict ? <button type="button" onClick={() => { if (window.confirm(t('Muat versi terbaru? Perubahan lokal yang belum tersimpan akan diganti.'))) onReload(); }} className={button + ' underline'}>{t('Muat versi terbaru')}</button> : !validationTarget && <button type="button" onClick={() => { setError(''); void save(); }} className={button + ' underline'}>{t('Coba simpan lagi')}</button>}</div>}

      <nav aria-label={t('Bagian checklist meeting')}
        className="sticky top-16 z-[12] my-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <select aria-label={t('Lompat ke bagian')} value="" onChange={event => jumpToSection(event.target.value)}
          className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-[#0B2C6B] focus-visible:outline-2 focus-visible:outline-[#0B2C6B]">
          <option value="" disabled>{t('Lompat ke bagian')}</option>
          {groups.map(part => (
            <option key={part.index} value={part.index}>{part.label} · {part.progress.answered}/{part.progress.total}</option>
          ))}
          <option value="notes">{t('Catatan konsultasi')}</option>
        </select>
      </nav>

      <div className="min-w-0 space-y-3">
          {!groups.length && <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-[#0B2C6B]">
            {t('Semua bagian yang ditampilkan sudah terisi. Tinjau jawaban atau lanjut ke catatan konsultasi.')}
          </p>}
          {groups.map(part => (
            <ChecklistSection key={part.index} id={stageId(part.index)} title={part.label} expanded={expanded === part.index}
              count={part.progress.answered + '/' + part.progress.total} onToggle={() => toggleSection(part.index)}>
              <div className="space-y-5">{part.fields.map(field => {
          const clientFilled = hasMeetingAnswer(original[field.key]), changed = additions[field.key] !== undefined && JSON.stringify(additions[field.key]) !== JSON.stringify(original[field.key]);
          const editable = !clientFilled || changed || editing.includes(field.key) || !!errors[field.key];
          return <div key={field.key} id={'meeting-field-' + id + '-' + field.key} className="border-b border-slate-200/70 pb-5 last:border-0 last:pb-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className={'inline-flex items-center gap-1.5 text-xs font-semibold ' + (changed ? 'text-amber-800' : clientFilled ? 'text-emerald-800' : 'text-slate-600')}>{clientFilled && !changed && <Check size={13} aria-hidden="true" />}{t(changed ? 'Catatan saat meeting' : clientFilled ? 'Diisi klien' : 'Belum diisi')}</span>
              {clientFilled && !editable && <button type="button" aria-label={t('Klarifikasi jawaban: {0}', [field.label])} onClick={() => setEditing(current => [...current, field.key])} className="min-h-9 px-2 text-xs font-semibold text-[#0B2C6B] underline underline-offset-4">{t('Klarifikasi jawaban')}</button>}
              {changed && <button type="button" onClick={() => { edits.current += 1; setAdditions(current => { const next = { ...current }; delete next[field.key]; return next; }); setEditing(current => current.filter(key => key !== field.key)); setStatus('in_progress'); }} className="inline-flex min-h-9 items-center gap-1 px-2 text-xs font-semibold text-[#0B2C6B]"><RotateCcw size={12} aria-hidden="true" />{t(clientFilled ? 'Gunakan jawaban klien' : 'Kosongkan')}</button>}
            </div>
            {editable ? <SpinFieldControl definition={definition} field={field} answers={effective} error={errors[field.key]} onChange={value => change(field.key, value)} translate={t} /> : <div><h6 className="text-sm font-semibold leading-6 text-slate-800">{field.label}</h6><p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-slate-700">{spinLabel(definition, original, field.key)}</p></div>}
            {changed && clientFilled && <p className="mt-3 text-xs leading-6 text-slate-600">{t('Jawaban awal klien: {0}', [spinLabel(definition, original, field.key)])}</p>}
          </div>;
              })}</div>
            </ChecklistSection>
          ))}
          <ChecklistSection id={notesId} title={t('Catatan konsultasi')} expanded={expanded === 'notes'}
            onToggle={() => toggleSection('notes')}>
            <p id={notesId + '-hint'} className="text-xs leading-6 text-slate-600">{t('Untuk tim BinaHub saja. Tidak dikirim ke klien dan tidak mengubah laporan yang sudah tersedia.')}</p>
            <textarea aria-label={t('Catatan dan tindak lanjut konsultasi')} aria-describedby={notesId + '-hint'} maxLength={4000} value={notes}
              onChange={event => { edits.current += 1; setNotes(event.target.value); setStatus('in_progress'); }}
              rows={4} className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 text-slate-900 placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#0B2C6B]"
              placeholder={t('Ringkas hasil diskusi dan langkah berikutnya yang disepakati.')} />
          </ChecklistSection>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <p role="status" aria-live="polite" className="text-xs leading-6 text-slate-600">
              {saving ? t('Menyimpan perubahan… Anda tetap dapat melanjutkan pengisian.')
                : dirty ? t('Ada perubahan yang belum tersimpan.')
                : updatedAt ? t('Tersimpan · {0}', [new Date(updatedAt).toLocaleString(locale === 'en' ? 'en-GB' : 'id-ID')])
                : t('Jawaban tambahan akan tersimpan otomatis saat Anda mengisi.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving || conflict || !dirty} onClick={() => void save()} className={button + ' border border-slate-300 bg-white text-[#0B2C6B]'}>
                {saving ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Save size={16} aria-hidden="true" />}
                {t('Simpan sesi')}
              </button>
              <button type="button" disabled={saving || conflict || status === 'completed' && !dirty} onClick={() => void save(true)} className={button + ' bg-[#0B2C6B] text-white hover:bg-[#071B3D]'}>
                <CheckCircle2 size={16} aria-hidden="true" />{t('Tandai selesai')}
              </button>
            </div>
          </div>
      </div>
    </section>
  );
}

function ChecklistSection({ id, title, expanded, count, onToggle, children }: {
  id: string; title: string; expanded: boolean; count?: string; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
      <h5 className="scroll-mt-36">
        <button id={id} type="button" aria-expanded={expanded} aria-controls={id + '-body'}
          onClick={onToggle} className="flex min-h-12 w-full scroll-mt-36 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#0B2C6B] hover:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0B2C6B] sm:px-5">
          <span className="min-w-0 flex-1 break-words">{title}</span>
          {count && <span className="shrink-0 text-xs font-medium tabular-nums text-slate-600">{count}</span>}
          <ChevronDown size={16} aria-hidden="true" className={expanded ? 'shrink-0 rotate-180' : 'shrink-0'} />
        </button>
      </h5>
      <div id={id + '-body'} hidden={!expanded} className="min-w-0 border-t border-slate-100 p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}
