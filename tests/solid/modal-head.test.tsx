import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar, AvatarFallback } from "../../src/solid/avatar.js";
import { ConfirmDialog } from "../../src/solid/confirm-dialog.js";
import { DialogContent, Dialog, DialogHead } from "../../src/solid/dialog.js";
import { press } from "../press.js";

afterEach(cleanup);

describe("the modal head", () => {
  it("renders a toned icon, the title and one line, in that order", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHead
            icon="lucide:timer-off"
            tone="var(--destructive)"
            title="Code expired"
            line="Get a new one to try again."
          />
        </DialogContent>
      </Dialog>
    ));
    const header = document.querySelector('[data-slot="dialog-header"]');
    expect(
      header?.querySelector('[data-slot="dialog-header-media"] [data-slot="section-icon"]'),
    ).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Code expired" })).toBeTruthy();
    expect(screen.getByText("Get a new one to try again.")).toBeTruthy();
  });

  it("takes an avatar as its media", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHead
            avatar={
              <Avatar>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
            }
            title="Anna"
          />
        </DialogContent>
      </Dialog>
    ));
    expect(screen.getByText("AL")).toBeTruthy();
    expect(document.querySelector('[data-slot="section-icon"]')).toBeNull();
  });

  it("puts status after the title and a mono key in the title", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHead
            icon="lucide:package"
            title="@glasshome/clock"
            mono
            status={<span data-testid="badge">Live</span>}
          />
        </DialogContent>
      </Dialog>
    ));
    const title = screen.getByRole("heading");
    expect(title.className).toContain("font-mono");
    expect(title.querySelector('[data-testid="badge"]')).not.toBeNull();
  });
});

describe("ConfirmDialog", () => {
  it("shows the question with an icon, and Cancel then the action in the footer", async () => {
    const onConfirm = vi.fn();
    render(() => (
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        icon="lucide:user-minus"
        title="Remove Anna?"
        line="She loses access right away."
        actionLabel="Remove"
        onConfirm={onConfirm}
      />
    ));
    const footer = document.querySelector('[data-slot="alert-dialog-footer"]');
    const labels = [...(footer?.querySelectorAll("button") ?? [])].map((b) => b.textContent);
    expect(labels).toEqual(["Cancel", "Remove"]);
    expect(document.querySelector('[data-slot="section-icon"]')).not.toBeNull();
    await press(screen.getByRole("button", { name: "Remove" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
