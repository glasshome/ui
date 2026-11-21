import "../real-time-animations";
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "../../src/solid/dialog.js";

afterEach(cleanup);

describe("Dialog scrim, finger", () => {
  it("only dims the page on a touch screen, where a blur over moving widgets re-blurs every frame", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    const el = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
    if (!el) throw new Error("no dialog scrim rendered");
    expect(getComputedStyle(el).backdropFilter).toBe("none");
  });
});
