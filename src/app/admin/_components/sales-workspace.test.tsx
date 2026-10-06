import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assessmentDashboard, assessmentFixture } from "@/test/fixtures/assessment-admin";
vi.mock("./assessment-panel", () => ({ AssessmentPanel: (props: { expandedId: string; initialDetailTab: string }) => <p>Assessment {props.expandedId} · {props.initialDetailTab}</p> }));
vi.mock("./inquiries-panel", () => ({ InquiriesPanel: (props: { initialSelectedId: string }) => <p>Inquiry {props.initialSelectedId}</p> }));
vi.mock("./acquisition-control-panel", () => ({ AcquisitionControlPanel: (props: { initialView: string }) => <p>Kampanye {props.initialView}</p> }));
vi.mock("./pipeline-panel", () => ({ PipelinePanel: () => <p>Peluang penjualan</p> }));
vi.mock("./meetings-panel", () => ({ MeetingsPanel: () => <p>Booking konsultasi</p> }));
import { SalesWorkspace } from "./sales-workspace";
afterEach(cleanup);
describe("unified sales workspace", () => {
  it("opens the selected client's proposal in place, without any send request", () => {
    const action = vi.fn();
    render(<SalesWorkspace data={assessmentDashboard([assessmentFixture()])} onAction={action} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Buka proposal" }));
    expect(screen.getByText("Assessment demo-assessment-1 · proposal")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });
  it("opens the correct inquiry and searches by its traffic source", () => {
    const data = assessmentDashboard([]);
    data.inquiries = [{ id: "inquiry-1", name: "Rina", email: "rina@example.com", source: "instagram", message: "Bisa konsultasi?", status: "Baru", notes: "", whatsapp: "", createdAt: "2026-10-06T03:00:00Z" }];
    const action = vi.fn();
    render(<SalesWorkspace data={data} onAction={action} onRefresh={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Cari prioritas penjualan" }), { target: { value: "instagram" } });
    fireEvent.click(screen.getByRole("button", { name: "Tulis balasan" }));
    expect(screen.getByText("Inquiry inquiry-1")).toBeInTheDocument(); expect(action).not.toHaveBeenCalled();
  });
  it("offers inbound and outbound from the same page with no mutation", () => {
    const action = vi.fn();
    render(<SalesWorkspace data={assessmentDashboard([])} onAction={action} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Mulai kampanye email" }));
    expect(screen.getByText("Kampanye outbound")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inbound" }));
    expect(screen.getByText("Kampanye inbound")).toBeInTheDocument(); expect(action).not.toHaveBeenCalled();
  });
});
