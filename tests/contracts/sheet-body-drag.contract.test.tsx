import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetPortal,
} from "../../src/solid";

afterEach(cleanup);

const tallSheet = () => {
  const [open, setOpen] = createSignal(true);
  render(() => (
    <BottomSheet open={open()} onOpenChange={setOpen}>
      <BottomSheetPortal>
        <BottomSheetContent ariaLabel="Sheet">
          <BottomSheetBody>
            <div style={{ height: "3000px", flex: "none" }}>tall</div>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  ));
  const body = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-body"]');
  const sheet = document.querySelector<HTMLElement>("[data-sheet-content]");
  if (!body || !sheet) throw new Error("sheet not rendered");
  return { body, sheet, open };
};

const drag = async (x: number, from: number, to: number) => {
  await commands.mouse("down", x, from);
  for (let step = 1; step <= 8; step++)
    await commands.mouse("move", x, from + ((to - from) * step) / 8);
  await commands.mouse("up", x, to);
};

// WebKit drops pan-down, so there the sheet scrolls its unscrolled body itself; an engine with pan-down leaves the body to the browser.
const sheetScrollsBody = !CSS.supports("touch-action", "pan-down");

describe("a sheet body dragged by its content", () => {
  it("scrolls under the pointer where the engine drops pan-down, and stays put elsewhere", async () => {
    const { body, sheet, open } = tallSheet();
    await vi.waitFor(() => expect(sheet.dataset.state).toBe("open"));
    const box = body.getBoundingClientRect();
    await drag(box.left + box.width / 2, box.top + 300, box.top + 100);
    await vi.waitFor(() => expect(body.scrollTop >= 200).toBe(sheetScrollsBody));
    expect(open()).toBe(true);
  });

  it("drags the sheet shut from a body at its top", async () => {
    const { body, sheet, open } = tallSheet();
    await vi.waitFor(() => expect(sheet.dataset.state).toBe("open"));
    const box = body.getBoundingClientRect();
    await drag(box.left + box.width / 2, box.top + 100, box.top + 500);
    await vi.waitFor(() => expect(open()).toBe(false));
    expect(body.scrollTop).toBe(0);
  });
});
