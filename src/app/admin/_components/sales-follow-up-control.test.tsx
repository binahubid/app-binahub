import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SalesFollowUpControl } from "./sales-follow-up-control";
afterEach(cleanup);
describe("sales follow-up switch", () => {
  it("requires an explicit activation confirmation and never triggers a queue", async () => {
    const action = vi.fn(async (_url: string, init?: RequestInit) => init?.method ? { success: true } : { ready: true, settings: { enabled: false, version: 1 }, blockers: [] });
    render(<SalesFollowUpControl onAction={action} />);
    fireEvent.click(await screen.findByRole("button", { name: "Aktifkan" }));
    expect(action.mock.calls.filter(([, init]) => init?.method)).toHaveLength(0);
    const dialog = screen.getByRole("dialog"); expect(dialog).toHaveTextContent("Tidak ada antrean lama");
    fireEvent.click(within(dialog).getByRole("button", { name: "Aktifkan otomatisasi" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const writes = action.mock.calls.filter(([, init]) => init?.method);
    expect(writes).toHaveLength(1); expect(writes[0][0]).toBe("/api/admin/sales-settings");
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({ enabled: true, expectedVersion: 1, confirmation: "SAVE_SALES_FOLLOW_UP" });
  });
  it("fails closed if database controls are missing", async () => {
    render(<SalesFollowUpControl onAction={vi.fn(async () => ({ ready: false, settings: null, blockers: [] }))} />);
    expect(await screen.findByRole("button", { name: "Aktifkan" })).toBeDisabled();
  });
});
