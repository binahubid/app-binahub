import { describe, expect, it } from "vitest";
import { programStatusChoices, PROGRAM_STATUS_LABELS } from "./program-status";

describe("program status controls", () => {
  it("hanya menawarkan transisi aman dari daftar program", () => {
    expect(programStatusChoices("draft")).toEqual(["draft", "active"]);
    expect(programStatusChoices("review")).toEqual(["review", "completed", "in_progress"]);
    expect(programStatusChoices("archived")).toEqual(["archived"]);
  });

  it("memiliki label Indonesia untuk setiap status", () => {
    expect(PROGRAM_STATUS_LABELS.in_progress).toBe("Berjalan");
    expect(PROGRAM_STATUS_LABELS.completed).toBe("Selesai");
  });
});
