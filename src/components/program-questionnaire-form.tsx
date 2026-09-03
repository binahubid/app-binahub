"use client";

export type ProgramQuestionnaireQuestion = {
  id: string;
  position: number;
  question_type: "single_choice" | "multiple_choice" | "yes_no" | "scale" | "short_text" | "long_text" | "number";
  prompt: string;
  help_text: string | null;
  required: boolean;
  options: string[] | null;
  scale_min: number | null;
  scale_max: number | null;
  scale_labels?: Record<string, string> | null;
};

interface ProgramQuestionnaireFormProps {
  questions: ProgramQuestionnaireQuestion[];
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  disabled?: boolean;
  missingQuestionId?: string;
}

function optionClass(selected: boolean, disabled: boolean) {
  return `flex min-h-12 items-center gap-3 border px-4 text-sm transition-colors ${
    selected
      ? "border-blue-900 bg-blue-50 font-semibold text-blue-950"
      : "border-slate-200 bg-white text-slate-700"
  } ${disabled ? "cursor-default" : "cursor-pointer hover:border-blue-300"}`;
}

export function ProgramQuestionnaireForm({
  questions,
  answers,
  onAnswer,
  disabled = false,
  missingQuestionId,
}: ProgramQuestionnaireFormProps) {
  return (
    <div className="space-y-5">
      {questions.map((question, index) => {
        const answer = answers[question.id];
        const scaleMin = question.scale_min ?? 1;
        const scaleMax = question.scale_max ?? 5;
        const scaleLabels = question.scale_labels || {};
        const isMissing = missingQuestionId === question.id;

        return (
          <fieldset
            id={`question-${question.id}`}
            key={question.id}
            className={`border bg-white p-5 shadow-sm transition-colors sm:p-6 ${isMissing ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}
          >
            <legend className="sr-only">Pertanyaan {index + 1}</legend>
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue-900 text-xs font-bold text-white">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-6 text-slate-950">
                  {question.prompt}
                  {question.required && <span className="ml-1 text-red-500" aria-label="wajib">*</span>}
                </p>
                {question.help_text && <p className="mt-1 text-xs leading-5 text-slate-500">{question.help_text}</p>}
                {isMissing && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">Pertanyaan wajib belum dijawab.</p>}
              </div>
            </div>

            <div className="mt-5 sm:pl-12">
              {(question.question_type === "single_choice" || question.question_type === "yes_no") && (
                <div className="grid gap-2">
                  {(question.question_type === "yes_no" ? ["Ya", "Tidak"] : question.options || []).map((option) => (
                    <label key={option} className={optionClass(answer === option, disabled)}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answer === option}
                        disabled={disabled}
                        onChange={() => onAnswer(question.id, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === "multiple_choice" && (
                <div className="grid gap-2">
                  {(question.options || []).map((option) => {
                    const selected = Array.isArray(answer) ? answer as string[] : [];
                    return (
                      <label key={option} className={optionClass(selected.includes(option), disabled)}>
                        <input
                          type="checkbox"
                          checked={selected.includes(option)}
                          disabled={disabled}
                          onChange={() => onAnswer(question.id, selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              )}

              {question.question_type === "scale" && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: scaleMax - scaleMin + 1 }, (_, offset) => scaleMin + offset).map((value) => (
                      <button
                        type="button"
                        key={value}
                        disabled={disabled}
                        onClick={() => onAnswer(question.id, value)}
                        className={`h-12 min-w-12 border text-sm font-bold transition-colors ${answer === value ? "border-blue-900 bg-blue-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"} disabled:cursor-default`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  {(scaleLabels[String(scaleMin)] || scaleLabels[String(scaleMax)]) && (
                    <div className="mt-2 flex max-w-xl justify-between gap-4 text-xs text-slate-500">
                      <span>{scaleLabels[String(scaleMin)] || scaleMin}</span>
                      <span className="text-right">{scaleLabels[String(scaleMax)] || scaleMax}</span>
                    </div>
                  )}
                </div>
              )}

              {question.question_type === "long_text" && (
                <textarea
                  rows={5}
                  value={String(answer ?? "")}
                  disabled={disabled}
                  placeholder="Tulis jawaban Anda"
                  onChange={(event) => onAnswer(question.id, event.target.value)}
                  className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              )}

              {(question.question_type === "short_text" || question.question_type === "number") && (
                <input
                  type={question.question_type === "number" ? "number" : "text"}
                  value={String(answer ?? "")}
                  disabled={disabled}
                  placeholder={question.question_type === "number" ? "Masukkan angka" : "Jawaban singkat"}
                  onChange={(event) => onAnswer(question.id, question.question_type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)}
                  className="min-h-12 w-full border border-slate-300 px-4 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              )}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
