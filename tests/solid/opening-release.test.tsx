import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { ignoreOpeningRelease } from "../../src/lib/opening-release.js";

function panelWithRow() {
  const trigger = document.createElement("button");
  trigger.textContent = "Open";
  const panel = document.createElement("div");
  const row = document.createElement("button");
  row.textContent = "Kitchen";
  panel.append(row);
  document.body.append(trigger, panel);
  const released: EventTarget[] = [];
  const onUp = (e: Event) => released.push(e.target as EventTarget);
  document.addEventListener("pointerup", onUp);
  const stop = ignoreOpeningRelease(panel);
  return {
    row,
    released,
    stop,
    releaseOnRow: () => userEvent.dragAndDrop(trigger, row),
    dispose: () => {
      stop();
      document.removeEventListener("pointerup", onUp);
      trigger.remove();
      panel.remove();
    },
  };
}

let dispose = () => {};
afterEach(() => dispose());

describe("ignoreOpeningRelease", () => {
  it("drops the release of the press that opened the panel", async () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    await panel.releaseOnRow();
    expect(panel.released).toEqual([]);
  });

  it("lets a press that starts inside the panel act", async () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    await panel.releaseOnRow();
    await userEvent.click(panel.row);
    expect(panel.released).toEqual([panel.row]);
  });

  it("needs a new press inside for every release", async () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    await userEvent.click(panel.row);
    await panel.releaseOnRow();
    expect(panel.released).toEqual([panel.row]);
  });

  it("stops listening once stopped", async () => {
    const panel = panelWithRow();
    dispose = panel.dispose;
    panel.stop();
    await panel.releaseOnRow();
    expect(panel.released).toEqual([panel.row]);
  });
});
