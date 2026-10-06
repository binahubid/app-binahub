import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OutboundSettingsDialog } from "./outbound-settings-dialog";
afterEach(cleanup);
const settings = { enabled: false, recipientMode: "restricted" as const, allowedEmails: [], businessHoursOnly: false, version: 0 };
const props = { settings, myEmail: "admin@example.com", campaignName: "Demo", setupBlockers: [], onClose: vi.fn(), onSave: vi.fn(async () => {}) };
describe("simple campaign controls", () => {
  it("prefills the admin for a first restricted test", () => {
    render(<OutboundSettingsDialog {...props} />);
    expect(screen.getByRole("textbox", { name: /Alamat uji/ })).toHaveValue("admin@example.com");
  });
  it("requires explicit approval to enable or broaden recipients", () => {
    render(<OutboundSettingsDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Diaktifkan" }));
    expect(screen.getByRole("button", { name: "Simpan pengaturan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Saya menyetujui/ }));
    expect(screen.getByRole("button", { name: "Simpan pengaturan" })).toBeEnabled();
    fireEvent.click(screen.getByRole("radio", { name: /Target disetujui/ }));
    expect(screen.getByRole("button", { name: "Simpan pengaturan" })).toBeDisabled();
    expect(screen.queryByRole("textbox", { name: /Alamat uji/ })).not.toBeInTheDocument();
  });
  it("rejects malformed addresses before a settings write", async () => {
    const save = vi.fn(); render(<OutboundSettingsDialog {...props} onSave={save} />);
    fireEvent.change(screen.getByRole("textbox", { name: /Alamat uji/ }), { target: { value: "not-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan pengaturan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("alamat email yang valid"); expect(save).not.toHaveBeenCalled();
  });
});
