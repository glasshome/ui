import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../../src/solid/alert-dialog.js";

afterEach(cleanup);

describe("AlertDialogAction busy", () => {
  it("keeps focus and the dialog open while busy, then confirms again", async () => {
    const [open, setOpen] = createSignal(true);
    const [busy, setBusy] = createSignal(false);
    const onClick = vi.fn();
    render(() => (
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove</AlertDialogTitle>
          <AlertDialogDescription>Gone for good.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction busy={busy()} onClick={onClick}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ));
    const action = await screen.findByRole("button", { name: "Remove" });
    action.focus();
    setBusy(true);
    await Promise.resolve();

    expect(document.activeElement).toBe(action);
    expect(action.getAttribute("aria-busy")).toBe("true");
    expect(action.getAttribute("aria-disabled")).toBe("true");

    action.click();
    expect(onClick).not.toHaveBeenCalled();
    expect(open()).toBe(true);

    setBusy(false);
    action.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(open()).toBe(false);
  });
});
