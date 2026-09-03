import { describe, expect, it } from "vitest";
import {
  createEmptyQuestionDraft,
  draftToQuestionPayload,
  moveQuestion,
  totalQuestionnairePoints,
  validateQuestionDraft,
  type ScoredProgramQuestion,
} from "./program-questionnaire-editor";

const baseQuestion = (id: string, position: number): ScoredProgramQuestion => ({
  id,
  position,
  question_type: "single_choice",
  prompt: `Pertanyaan ${position}`,
  help_text: null,
  required: true,
  options: ["A", "B"],
  correct_answer: "A",
  points: position,
  scale_min: null,
  scale_max: null,
  scale_labels: {},
});

describe("program questionnaire editor", () => {
  it("validates duplicate options before calling the API", () => {
    const draft = { ...createEmptyQuestionDraft(), prompt: "Pilih jawaban", options: ["Sama", "sama"] };
    expect(validateQuestionDraft(draft)).toContain("unik");
  });

  it("stores scale labels and numeric answer in the supported payload", () => {
    const draft = {
      ...createEmptyQuestionDraft(),
      prompt: "Nilai pengalaman",
      questionType: "scale" as const,
      correctAnswers: ["4"],
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: "Kurang",
      scaleMaxLabel: "Sangat baik",
    };
    expect(draftToQuestionPayload(draft, 3)).toMatchObject({
      position: 3,
      correctAnswer: 4,
      scaleLabels: { "1": "Kurang", "5": "Sangat baik" },
    });
  });

  it("moves questions without mutating the source list", () => {
    const source = [baseQuestion("one", 1), baseQuestion("two", 2), baseQuestion("three", 3)];
    const moved = moveQuestion(source, "two", -1);
    expect(moved.map((item) => item.id)).toEqual(["two", "one", "three"]);
    expect(source.map((item) => item.id)).toEqual(["one", "two", "three"]);
    expect(totalQuestionnairePoints(source)).toBe(6);
  });
});
