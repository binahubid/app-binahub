import type { ProgramQuestionnaireQuestion } from "@/components/program-questionnaire-form";

export type ScoredProgramQuestion = ProgramQuestionnaireQuestion & {
  correct_answer: unknown;
  points: number;
};

export type QuestionDraft = {
  id: string;
  questionType: ProgramQuestionnaireQuestion["question_type"];
  prompt: string;
  helpText: string;
  required: boolean;
  options: string[];
  correctAnswers: string[];
  points: number;
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string;
  scaleMaxLabel: string;
};

export const QUESTION_TYPE_OPTIONS: Array<{
  value: QuestionDraft["questionType"];
  label: string;
  description: string;
}> = [
  { value: "single_choice", label: "Pilihan ganda", description: "Peserta memilih satu jawaban." },
  { value: "multiple_choice", label: "Kotak centang", description: "Peserta dapat memilih beberapa jawaban." },
  { value: "yes_no", label: "Ya / Tidak", description: "Pertanyaan biner yang cepat dijawab." },
  { value: "scale", label: "Skala linear", description: "Nilai numerik dengan label pada kedua ujung." },
  { value: "short_text", label: "Jawaban singkat", description: "Jawaban satu baris." },
  { value: "long_text", label: "Paragraf", description: "Jawaban naratif beberapa baris." },
  { value: "number", label: "Angka", description: "Hanya menerima nilai numerik." },
];

export function createEmptyQuestionDraft(): QuestionDraft {
  return {
    id: "",
    questionType: "single_choice",
    prompt: "",
    helpText: "",
    required: true,
    options: ["", ""],
    correctAnswers: [],
    points: 1,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "",
    scaleMaxLabel: "",
  };
}

export function questionTypeLabel(type: QuestionDraft["questionType"]) {
  return QUESTION_TYPE_OPTIONS.find((item) => item.value === type)?.label || type;
}

export function questionToDraft(question: ScoredProgramQuestion): QuestionDraft {
  const correctAnswers = question.correct_answer === null || question.correct_answer === undefined
    ? []
    : Array.isArray(question.correct_answer)
      ? question.correct_answer.map(String)
      : [String(question.correct_answer)];
  const minimum = question.scale_min ?? 1;
  const maximum = question.scale_max ?? 5;
  return {
    id: question.id,
    questionType: question.question_type,
    prompt: question.prompt,
    helpText: question.help_text || "",
    required: question.required,
    options: question.options?.length ? [...question.options] : ["", ""],
    correctAnswers,
    points: Number(question.points ?? 1),
    scaleMin: minimum,
    scaleMax: maximum,
    scaleMinLabel: question.scale_labels?.[String(minimum)] || "",
    scaleMaxLabel: question.scale_labels?.[String(maximum)] || "",
  };
}

function normalizedOptions(options: string[]) {
  return options.map((item) => item.trim()).filter(Boolean);
}

export function validateQuestionDraft(draft: QuestionDraft) {
  if (draft.prompt.trim().length < 3) return "Pertanyaan minimal terdiri dari 3 karakter.";
  if (!Number.isFinite(draft.points) || draft.points < 0 || draft.points > 10000) return "Poin harus berada di antara 0 dan 10.000.";

  if (["single_choice", "multiple_choice"].includes(draft.questionType)) {
    const options = normalizedOptions(draft.options);
    if (options.length < 2) return "Tambahkan minimal dua pilihan jawaban.";
    if (new Set(options.map((item) => item.toLocaleLowerCase("id-ID"))).size !== options.length) return "Setiap pilihan jawaban harus unik.";
    if (draft.correctAnswers.some((answer) => !options.includes(answer))) return "Kunci jawaban harus menggunakan pilihan yang tersedia.";
  }

  if (draft.questionType === "scale") {
    if (!Number.isInteger(draft.scaleMin) || !Number.isInteger(draft.scaleMax) || draft.scaleMin < 0 || draft.scaleMax <= draft.scaleMin || draft.scaleMax - draft.scaleMin > 20) {
      return "Rentang skala harus berupa bilangan bulat, maksimum 20 tingkat, dan nilai akhir lebih besar dari nilai awal.";
    }
    const answer = draft.correctAnswers[0];
    if (answer && (Number(answer) < draft.scaleMin || Number(answer) > draft.scaleMax)) return "Kunci jawaban skala harus berada dalam rentang yang dipilih.";
  }

  if (draft.questionType === "yes_no" && draft.correctAnswers[0] && !["Ya", "Tidak"].includes(draft.correctAnswers[0])) {
    return "Kunci jawaban Ya/Tidak tidak valid.";
  }

  if (draft.questionType === "number" && draft.correctAnswers[0] && !Number.isFinite(Number(draft.correctAnswers[0]))) {
    return "Kunci jawaban harus berupa angka.";
  }
  return "";
}

export function draftToQuestionPayload(draft: QuestionDraft, position: number) {
  const options = ["single_choice", "multiple_choice"].includes(draft.questionType) ? normalizedOptions(draft.options) : [];
  let correctAnswer: string | number | string[] | null = null;
  if (draft.questionType === "multiple_choice") correctAnswer = draft.correctAnswers.filter(Boolean);
  else if (draft.correctAnswers[0]) correctAnswer = draft.questionType === "scale" || draft.questionType === "number" ? Number(draft.correctAnswers[0]) : draft.correctAnswers[0];

  const scaleLabels: Record<string, string> = {};
  if (draft.questionType === "scale") {
    if (draft.scaleMinLabel.trim()) scaleLabels[String(draft.scaleMin)] = draft.scaleMinLabel.trim();
    if (draft.scaleMaxLabel.trim()) scaleLabels[String(draft.scaleMax)] = draft.scaleMaxLabel.trim();
  }

  return {
    ...(draft.id ? { id: draft.id } : {}),
    position,
    questionType: draft.questionType,
    prompt: draft.prompt.trim(),
    helpText: draft.helpText.trim(),
    required: draft.required,
    options,
    correctAnswer,
    points: Number(draft.points),
    scaleMin: draft.questionType === "scale" ? draft.scaleMin : null,
    scaleMax: draft.questionType === "scale" ? draft.scaleMax : null,
    scaleLabels,
  };
}

export function storedQuestionToPayload(question: ScoredProgramQuestion, position: number) {
  return {
    position,
    questionType: question.question_type,
    prompt: question.prompt,
    helpText: question.help_text || "",
    required: question.required,
    options: question.options || [],
    correctAnswer: question.correct_answer as string | number | boolean | string[] | null,
    points: Number(question.points || 0),
    scaleMin: question.scale_min,
    scaleMax: question.scale_max,
    scaleLabels: question.scale_labels || {},
  };
}

export function moveQuestion(questions: ScoredProgramQuestion[], questionId: string, direction: -1 | 1) {
  const currentIndex = questions.findIndex((question) => question.id === questionId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= questions.length) return questions;
  const next = [...questions];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
}

export function totalQuestionnairePoints(questions: ScoredProgramQuestion[]) {
  return questions.reduce((total, question) => total + Math.max(0, Number(question.points || 0)), 0);
}
