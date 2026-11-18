import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { Button, Dialog, DialogContent, DialogTitle } from "../../src/solid";
import { settle } from "../harness/mount";

declare global {
  interface Window {
    find(text: string): boolean;
  }
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const TEXT = "Humidity reads forty percent";

function panelParts() {
  const panel = document.querySelector('[data-slot="dialog-content"]');
  const warmer = panel?.querySelector("button");
  const layer = panel?.parentElement;
  if (!(panel instanceof HTMLElement) || !warmer || !layer) throw new Error("no kept dialog");
  return { panel, warmer, layer };
}

function reach(warmer: HTMLElement, layer: Element, at: { x: number; y: number }) {
  warmer.focus();
  const focused = document.activeElement === warmer;
  const hit = layer.contains(document.elementFromPoint(at.x, at.y));
  getSelection()?.removeAllRanges();
  const found = window.find(TEXT);
  getSelection()?.removeAllRanges();
  return { focused, hit, found };
}

describe("kept modal contract, dormant content", () => {
  it("DK2 a dormant Dialog's content takes no focus, no hit and no find", async () => {
    const beside = document.body.appendChild(document.createElement("button"));
    beside.textContent = "Beside";
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog keep open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Kept climate</DialogTitle>
          <p>{TEXT}</p>
          <Button>Kept warmer</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const { warmer, layer } = panelParts();
    const box = warmer.getBoundingClientRect();
    const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    expect(reach(warmer, layer, at)).toEqual({ focused: true, hit: true, found: true });

    setOpen(false);
    await settle();
    expect(layer.hasAttribute("data-dormant")).toBe(true);
    beside.focus();
    expect(reach(warmer, layer, at)).toEqual({ focused: false, hit: false, found: false });
    beside.focus();
    await userEvent.keyboard("{Tab}");
    expect(layer.contains(document.activeElement)).toBe(false);
  });
});
