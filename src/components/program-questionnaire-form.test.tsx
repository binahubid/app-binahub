import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProgramQuestionnaireForm, type ProgramQuestionnaireQuestion } from "./program-questionnaire-form";

const questions: ProgramQuestionnaireQuestion[] = [
  { id: "single", position: 1, question_type: "single_choice", prompt: "Pilih satu", help_text: null, required: true, options: ["A", "B"], scale_min: null, scale_max: null },
  { id: "multiple", position: 2, question_type: "multiple_choice", prompt: "Pilih beberapa", help_text: null, required: false, options: ["C", "D"], scale_min: null, scale_max: null },
  { id: "scale", position: 3, question_type: "scale", prompt: "Nilai pengalaman", help_text: null, required: true, options: [], scale_min: 1, scale_max: 3, scale_labels: { "1": "Kurang", "3": "Baik" } },
  { id: "long", position: 4, question_type: "long_text", prompt: "Jelaskan", help_text: "Maksimal satu paragraf", required: false, options: [], scale_min: null, scale_max: null },
];

describe("ProgramQuestionnaireForm", () => {
  it("renders the same supported controls used by participant and admin preview", () => {
    render(<ProgramQuestionnaireForm questions={questions} answers={{}} onAnswer={vi.fn()} />);

    expect(screen.getByText("Pilih satu")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "C" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByText("Kurang")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tulis jawaban Anda")).toBeInTheDocument();
  });

  it("returns simulated answers without submitting anything", () => {
    const onAnswer = vi.fn();
    render(<ProgramQuestionnaireForm questions={questions} answers={{}} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByRole("radio", { name: "B" }));
    expect(onAnswer).toHaveBeenCalledWith("single", "B");
  });

  it("visibly marks a missing required question", () => {
    render(<ProgramQuestionnaireForm questions={questions} answers={{}} onAnswer={vi.fn()} missingQuestionId="single" />);
    expect(screen.getByRole("alert")).toHaveTextContent("wajib belum dijawab");
  });
});
