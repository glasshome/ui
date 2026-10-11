import { afterEach, describe, expect, it } from "vitest";
import { ignoreOpeningRelease } from "../../src/lib/opening-release.js";

const pointer = (type: string) => new PointerEvent(type, { bubbles: true, cancelable: true });

function panelWithRow() {
  const panel = document.createElement("div");
  const row = document.createElement("button");
  panel.append(row);
  document.body.append(panel);
  const released: EventTarget[] = [];
  const onUp = (e: Event) => released.push(e.target as EventTarget);
  document.addEventListener("pointerup", onUp);
  const stop = ignoreOpeningRelease(panel);
  return {
    row,
    released,
    stop,
    dispose: () => {
      stop();
      document.removeEventListener("pointerup", onUp);
      panel.remove();
    },
  };
}

let dispose = () => {};
afterEach(() => dispose());

describe("ignoreOpeningRelease", () => {
  it("drops the release of the press that opened the panel", () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    panel.row.dispatchEvent(pointer("pointerup"));
    expect(panel.released).toEqual([]);
  });

  it("lets a press that starts inside the panel act", () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    panel.row.dispatchEvent(pointer("pointerup"));
    panel.row.dispatchEvent(pointer("pointerdown"));
    panel.row.dispatchEvent(pointer("pointerup"));
    expect(panel.released).toEqual([panel.row]);
  });

  it("needs a new press inside for every release", () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    panel.row.dispatchEvent(pointer("pointerdown"));
    panel.row.dispatchEvent(pointer("pointerup"));
    panel.row.dispatchEvent(pointer("pointerup"));
    expect(panel.released).toEqual([panel.row]);
  });

  it("stops listening once stopped", () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    panel.stop();
    panel.row.dispatchEvent(pointer("pointerup"));
    expect(panel.released).toEqual([panel.row]);
  });
});
