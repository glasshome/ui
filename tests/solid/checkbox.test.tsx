import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";

import { Checkbox } from "../../src/solid/checkbox.js";

afterEach(cleanup);

function parts(root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-slot="checkbox-box"]');
  if (!box) throw new Error("checkbox did not render");
  const glyph = box.querySelector<HTMLElement>('svg[data-slot="icon"]');
  if (!glyph) throw new Error("check glyph did not render");
  return { box, glyph };
}

describe("Checkbox size", () => {
  it("defaults to the standalone touch target", () => {
    const { container } = render(() => <Checkbox />);
    const { box, glyph } = parts(container);
    expect(box.dataset.size).toBe("default");
    expect(box.className).toContain("size-7");
    expect(glyph.className).toContain("size-5");
  });

  it("shrinks the box and the glyph together for a row-embedded control", () => {
    const { container } = render(() => <Checkbox size="sm" />);
    const { box, glyph } = parts(container);
    expect(box.dataset.size).toBe("sm");
    expect(box.className).toContain("size-5");
    expect(box.className).not.toContain("size-7");
    expect(glyph.className).toContain("size-3.5");
  });

  it("rounds the box below the theme's smallest radius token", () => {
    const { container } = render(() => <Checkbox />);
    expect(parts(container).box.className).toContain("rounded-xs");
  });
});
