/* The switch's whole job is to say on or off at a glance, and the track surface
 * carries all of it from state rather than from a stylesheet a caller can
 * inspect, so it gets asserted here along with the knob staying one material. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { FIELD_CHROME } from "../../src/lib/input-classes.js";
import { THUMB_FACE_ON } from "../../src/lib/thumb-classes.js";
import { Switch } from "../../src/solid/switch.js";

function parts(container: HTMLElement) {
	const root = container.querySelector<HTMLElement>('[data-slot="switch"]');
	const thumb = container.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
	if (!root || !thumb) throw new Error("switch did not render its parts");
	return { root, thumb };
}

describe("Switch", () => {
	it("dims the knob when off and lights it when on", () => {
		const off = render(() => <Switch checked={false} />);
		const on = render(() => <Switch checked />);
		expect(parts(off.container).thumb.style.background).toBe("var(--thumb-face-off)");
		expect(parts(on.container).thumb.style.background).toBe("var(--thumb-face-on)");
	});

	it("re-declares the lit face on the knob itself, from --primary, so a re-scoped theme reaches it", () => {
		const { thumb } = parts(render(() => <Switch checked />).container);
		expect(thumb.style.getPropertyValue("--thumb-face-on")).toBe(THUMB_FACE_ON);
		expect(THUMB_FACE_ON).toContain("from var(--primary)");
	});

	// The bug this file exists for: an off knob that competes with the on knob.
	// Lightness cannot express it in both themes (light reads lit by going
	// darker, dark by going lighter), so the invariant is the hue: on carries
	// --primary's chroma, off stays neutral metal.
	// Lightness cannot say on/off in both themes (light reads lit by going
	// darker, dark by going lighter), so the invariant is the hue: on carries
	// --primary's chroma up to a cap, off stays neutral metal.
	it("gives the on knob a depth and a chroma cap per theme, and keeps the off knob neutral", () => {
		const css = readFileSync(
			path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../src/styles/theme.css"),
			"utf-8",
		);
		const number = (block: string, token: string) => {
			const match = block.match(new RegExp(`${token}:\\s*([0-9.]+);`));
			if (!match?.[1]) throw new Error(`no ${token} in block`);
			return Number.parseFloat(match[1]);
		};
		const offChroma = (block: string) => {
			const match = block.match(/--thumb-face-off:\s*oklch\([0-9.]+\s+([0-9.]+)/);
			if (!match?.[1]) throw new Error("no --thumb-face-off in block");
			return Number.parseFloat(match[1]);
		};
		const darkStart = css.indexOf(".dark {");
		const [light, dark] = [css.slice(0, darkStart), css.slice(darkStart)];
		for (const block of [light, dark]) {
			expect(number(block, "--thumb-on-c")).toBeGreaterThan(0.05);
			expect(offChroma(block)).toBeLessThan(0.05);
		}
		expect(number(light, "--thumb-on-l")).toBeLessThan(number(dark, "--thumb-on-l"));
	});

	it("declares --thumb-face-on at page scope as the very expression the knob uses", () => {
		const css = readFileSync(
			path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../src/styles/theme.css"),
			"utf-8",
		);
		const declared = [...css.matchAll(/--thumb-face-on:\s*([^;]+);/g)].map((m) => m[1]);
		expect(declared).toEqual([THUMB_FACE_ON, THUMB_FACE_ON]);
	});

	it("wears the empty-well chrome when off and the tinted glass when on", () => {
		const off = render(() => <Switch checked={false} />);
		const offClass = parts(off.container).root.className;
		for (const token of FIELD_CHROME.split(" ")) expect(offClass, token).toContain(token);
		expect(offClass).not.toContain("glass-tint");

		const on = render(() => <Switch checked />);
		expect(parts(on.container).root.className).toContain("glass-tint");
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
		expect(parts(container).thumb.style.background).toBe("var(--thumb-face-on)");
	});
});
