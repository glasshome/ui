/* The switch's whole job is to say on or off at a glance, and the track surface
 * carries all of it from state rather than from a stylesheet a caller can
 * inspect, so it gets asserted here along with the knob staying one material. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { CONTROL_ON, FIELD_CHROME } from "../../src/lib/input-classes.js";
import { Switch } from "../../src/solid/switch.js";

function parts(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('[data-slot="switch"]');
  const thumb = container.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
  if (!root || !thumb) throw new Error("switch did not render its parts");
  return { root, thumb };
}

describe("Switch", () => {
  it("dims the knob when off and gives it the material's knob when on", () => {
    const off = render(() => <Switch checked={false} />);
    const on = render(() => <Switch checked />);
    expect(parts(off.container).thumb.style.background).toBe("var(--thumb-face-off)");
    expect(parts(on.container).thumb.style.background).toBe("var(--material-control-knob)");
  });

  // The bug this file exists for: an off knob that competes with the on one.
  // The accent track carries "on", so the off knob stays neutral metal.
  it("keeps the off knob neutral in both themes", () => {
    const css = readFileSync(
      path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../src/styles/theme.css"),
      "utf-8",
    );
    const chromas = [...css.matchAll(/--thumb-face-off:\s*oklch\([0-9.]+\s+([0-9.]+)/g)].map((m) =>
      Number.parseFloat(m[1] ?? ""),
    );
    expect(chromas).toHaveLength(2);
    for (const chroma of chromas) expect(chroma).toBeLessThan(0.05);
  });

  it("wears the empty-well chrome when off and the material's accent when on", () => {
    const off = render(() => <Switch checked={false} />);
    const offClass = parts(off.container).root.className;
    for (const token of FIELD_CHROME.split(" ")) expect(offClass, token).toContain(token);
    expect(offClass).not.toContain("glass-tint");

    const on = render(() => <Switch checked />);
    const onClass = parts(on.container).root.className;
    for (const token of CONTROL_ON.split(" ")) expect(onClass, token).toContain(token);
    expect(CONTROL_ON).toContain("[--glass-tone:var(--material-accent)]");
  });

  it("moves the thumb and reports state through aria-checked", () => {
    const off = render(() => <Switch checked={false} />);
    expect(parts(off.container).root.getAttribute("aria-checked")).toBe("false");
    expect(parts(off.container).root.hasAttribute("data-checked")).toBe(false);

    const on = render(() => <Switch checked />);
    expect(parts(on.container).root.getAttribute("aria-checked")).toBe("true");
    // The thumb travels one thumb width, driven by the track's data-checked.
    expect(parts(on.container).root.hasAttribute("data-checked")).toBe(true);
    expect(parts(on.container).thumb.className).toContain(
      "group-data-[checked]/switch:translate-x-full",
    );
  });

  it("carries an accessible name through to the role=switch element", () => {
    const labelled = render(() => <Switch checked aria-label="Away mode" />);
    expect(parts(labelled.container).root.getAttribute("aria-label")).toBe("Away mode");

    const described = render(() => <Switch checked aria-labelledby="away-mode-title" />);
    expect(parts(described.container).root.getAttribute("aria-labelledby")).toBe("away-mode-title");
  });

  it("repaints track and knob together when the controlled value flips", () => {
    const [checked, setChecked] = createSignal(false);
    const { container } = render(() => (
      <Switch checked={checked()} onChange={(next) => setChecked(next)} />
    ));
    expect(parts(container).thumb.style.background).toBe("var(--thumb-face-off)");
    expect(parts(container).root.className).not.toContain("glass-tint");

    fireEvent.click(parts(container).root);
    expect(checked()).toBe(true);
    expect(parts(container).root.className).toContain("glass-tint");
    expect(parts(container).thumb.style.background).toBe("var(--material-control-knob)");
  });
});
