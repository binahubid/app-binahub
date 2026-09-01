import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminModal, CollapsibleModule, MetricBar } from "./shared";

describe("admin shared interactions", () => {
  it("exposes an accessible modal and closes it with Escape", async () => {
    const onClose = vi.fn();
    render(
      <AdminModal title="Tambah pengguna" onClose={onClose}>
        <button type="button">Simpan</button>
      </AdminModal>,
    );

    expect(screen.getByRole("dialog", { name: "Tambah pengguna" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Tutup modal" })).toHaveFocus());

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("announces and toggles collapsible content", () => {
    render(
      <CollapsibleModule title="Riwayat aktivitas">
        <p>Perubahan pertama</p>
      </CollapsibleModule>,
    );

    const trigger = screen.getByRole("button", { name: "Riwayat aktivitas" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Perubahan pertama")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Perubahan pertama")).toBeVisible();
  });

  it("clamps metric values and exposes progress semantics", () => {
    render(<MetricBar label="Kelengkapan data" value={124} />);

    expect(screen.getByRole("progressbar", { name: "Kelengkapan data" })).toHaveAttribute("aria-valuenow", "100");
  });
});
