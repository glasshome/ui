import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { OUTLINE_SURFACE } from "../../src/lib/button-variants.js";
import { Toggle } from "../../src/solid/toggle.js";

afterEach(cleanup);

function toggleEl(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>('[data-slot="toggle"]');
  if (!el) throw new Error("toggle did not render");
  return el;
}

describe("Toggle", () => {
  it("wears the shared outline material for the outline variant", () => {
    const { container } = render(() => <Toggle variant="outline">Search</Toggle>);
    const el = toggleEl(container);
    const tokens = el.className.split(/\s+/);
    for (const token of OUTLINE_SURFACE.split(" ")) expect(tokens).toContain(token);
  });

  it("still applies the default variant without glass at rest", () => {
    const { container } = render(() => <Toggle>Notify</Toggle>);
    const el = toggleEl(container);
    expect(el.className).not.toMatch(/(^|\s)glass(\s|$)/);
  });
  it("keeps a pressed default toggle's hover off bg-* (scoped to unpressed only)", () => {
    const { container } = render(() => <Toggle pressed>Notify</Toggle>);
    const el = toggleEl(container);
    const tokens = el.className.split(/\s+/);
    // No bare, unconditional hover:bg-* token: that's exactly what went dead
    // the moment data-[pressed]:glass engaged. The unpressed hover is scoped
    // off the pressed state instead, and the pressed hover bumps a glass knob.
    expect(tokens.some((t) => /^hover:bg-/.test(t))).toBe(false);
    expect(tokens).toContain("not-data-[pressed]:hover:bg-muted");
    expect(tokens).toContain("data-[pressed]:hover:[--glass-wash:40%]");
  });
});
