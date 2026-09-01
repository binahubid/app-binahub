import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import { PipelinePanel, isLikelyTestLead, leadNeedsAttention, sortPipelineLeads } from "./pipeline-panel";

const NOW = Date.parse("2026-09-01T10:00:00.000Z");

function lead(overrides: Partial<PipelineLeadRecord> = {}): PipelineLeadRecord {
  return {
    id: "lead-1",
    name: "Dewi Pratama",
    email: "dewi@example.com",
    company: "PT Maju Bersama",
    industry: "Jasa",
    location: "Jakarta",
    qualificationProfile: {},
    phone: "",
    source: "assessment",
    leadScore: 72,
    leadTemperature: "warm",
    leadScoreConfidence: 90,
    lifecycleStage: "lead",
    opportunityStage: "qualified",
    opportunityOwner: "admin@binahub.id",
    nextAction: "Jadwalkan konsultasi",
    nextActionDueAt: "2026-09-02T10:00:00.000Z",
    leadTimeZone: "Asia/Jakarta",
    opportunityValue: 25_000_000,
    lostReason: null,
    wonAt: null,
    lostAt: null,
    outreachPaused: false,
    outreachPauseReason: null,
    outreachPausedAt: null,
    outreachPausedBy: null,
    pipelineUpdatedAt: null,
    createdAt: "2026-09-01T07:00:00.000Z",
    ...overrides,
  };
}

describe("pipeline operational prioritization", () => {
  it("recognizes isolated phase evidence as internal test data", () => {
    expect(isLikelyTestLead(lead({ email: "phase13@example.invalid" }))).toBe(true);
    expect(isLikelyTestLead(lead({ name: "Phase 13 Cal.com Evidence" }))).toBe(true);
    expect(isLikelyTestLead(lead())).toBe(false);
  });

  it("marks active opportunities without an owner or overdue action for attention", () => {
    expect(leadNeedsAttention(lead({ opportunityOwner: null }), NOW)).toBe(true);
    expect(leadNeedsAttention(lead({ nextActionDueAt: "2026-08-31T10:00:00.000Z" }), NOW)).toBe(true);
    expect(leadNeedsAttention(lead({ opportunityStage: "won", opportunityOwner: null }), NOW)).toBe(false);
  });

  it("places overdue opportunities ahead of healthy high-value opportunities", () => {
    const healthy = lead({ id: "healthy", opportunityValue: 100_000_000 });
    const overdue = lead({ id: "overdue", nextActionDueAt: "2026-08-31T10:00:00.000Z", opportunityValue: 5_000_000 });
    expect(sortPipelineLeads([healthy, overdue], NOW).map((item) => item.id)).toEqual(["overdue", "healthy"]);
  });

  it("keeps internal evidence out of the operational board and separates completed deals", () => {
    const activeLead = lead({ id: "active", name: "Peluang Operasional" });
    const testLead = lead({ id: "test", name: "Phase 13 Suppression Evidence", email: "phase13@example.invalid" });
    const wonLead = lead({ id: "won", name: "Klien Berhasil", opportunityStage: "won" });
    const data = {
      summary: { deliverabilityAlerts: 0 },
      pipelineLeads: [activeLead, testLead, wonLead],
      opportunityActivities: [],
      emailDeliverySummary: { total: 0, delivered: 0, bounced: 0, complained: 0, failed: 0, received: 0, processingFailed: 0 },
    } as unknown as DashboardData;

    render(<PipelinePanel data={data} onAction={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getAllByText("Peluang Operasional").length).toBeGreaterThan(0);
    expect(screen.queryByText("Phase 13 Suppression Evidence")).not.toBeInTheDocument();
    expect(screen.queryByText("Klien Berhasil")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Berhasil 1/ }));
    expect(screen.getByText("Klien Berhasil")).toBeVisible();
  });
});
