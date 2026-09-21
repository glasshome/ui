import { describe, expect, it } from "vitest";
import { CONTROL_H, FIELD_TEXT, FOCUS_RING, INPUT_CLASS } from "../../src/lib/input-classes.js";
import { Z, Z_CLASS } from "../../src/lib/layers.js";
import {
	MENU_ITEM,
	MENU_ITEM_BASE,
	MENU_ITEM_X,
	MENU_LABEL,
	MENU_SEPARATOR,
} from "../../src/lib/menu-classes.js";
import {
	FIELD_MOTION,
	MODAL_MOTION,
	MORPH_MOTION,
	OVERLAY_MOTION,
	PRESS_DIP,
	SCRIM_MOTION,
	SETTLE_MOTION,
	STAGGER,
} from "../../src/lib/motion-classes.js";
import {
	anchorToTriggerTop,
	FLOATING_PANEL,
	FLOATING_PANEL_SURFACE,
	OVERLAY_SURFACE,
} from "../../src/lib/overlay-classes.js";
import { CHIP, ICON_PILL } from "../../src/lib/pill-classes.js";
import { SECTION_INNER_RADIUS, SECTION_PADDING } from "../../src/lib/section-tokens.js";
import { MOBILE_BREAKPOINT } from "../../src/lib/use-is-mobile.js";

describe("field recipes compose from named parts", () => {
	it("INPUT_CLASS is built from FOCUS_RING, CONTROL_H.default and FIELD_TEXT", () => {
		expect(INPUT_CLASS).toContain(FOCUS_RING);
		expect(INPUT_CLASS).toContain(CONTROL_H.default);
		expect(INPUT_CLASS).toContain(FIELD_TEXT);
	});

	it("FOCUS_RING focuses the glass edge knob, not a border utility", () => {
		expect(FOCUS_RING).toContain("focus-visible:ring-[3px]");
		expect(FOCUS_RING).toContain("focus-visible:[--glass-edge:var(--ring)]");
		expect(FOCUS_RING).not.toContain("border-ring");
	});

	it("CONTROL_H has the three heights every control shares", () => {
		expect(CONTROL_H).toEqual({ sm: "h-8", default: "h-9", lg: "h-10" });
	});
});

describe("floating panel recipe", () => {
	it("wears the overlay surface, the overlay z layer, and no padding", () => {
		expect(FLOATING_PANEL).toContain(OVERLAY_SURFACE);
		expect(FLOATING_PANEL).toContain(Z_CLASS.overlay);
		expect(FLOATING_PANEL).not.toMatch(/\bp-\d/);
	});

	it("FLOATING_PANEL_SURFACE is FLOATING_PANEL without the relative token", () => {
		expect(FLOATING_PANEL_SURFACE).toBe(
			FLOATING_PANEL.split(" ")
				.filter((t) => t !== "relative")
				.join(" "),
		);
	});

	it("motion strings are exported once", () => {
		expect(OVERLAY_MOTION).toContain("data-[expanded]:animate-in");
		expect(FIELD_MOTION).toContain("data-[expanded]:animate-select-in");
	});
});

describe("motion vocabulary", () => {
	it("arrives by growing, leaves faster, on theme tokens only", () => {
		expect(OVERLAY_MOTION).toContain("origin-(--kb-popper-content-transform-origin)");
		expect(OVERLAY_MOTION).toContain("data-[expanded]:zoom-in-90");
		expect(MODAL_MOTION).toContain("data-[expanded]:zoom-in-[0.94]");
		expect(MODAL_MOTION).toContain("data-[expanded]:slide-in-from-bottom-2");
		expect(SETTLE_MOTION).toContain("animate-in");
		for (const recipe of [OVERLAY_MOTION, MODAL_MOTION, SCRIM_MOTION, SETTLE_MOTION]) {
			expect(recipe).not.toMatch(/duration-\d/);
			expect(recipe).toContain("duration-(--duration-");
		}
		expect(MORPH_MOTION).toContain("data-[expanded]:animate-morph-in");
		expect(STAGGER).toBe("gh-stagger");
		expect(PRESS_DIP).toBe("active:scale-[0.97]");
	});

	it("anchorToTriggerTop returns a zero-height rect on the trigger's top edge", () => {
		expect(anchorToTriggerTop(undefined)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
		const fake = {
			getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 36 }),
		} as unknown as HTMLElement;
		expect(anchorToTriggerTop(fake)).toEqual({ x: 10, y: 20, width: 200, height: 0 });
	});
});

describe("pill recipes are glass, not flat fills", () => {
	it("ICON_PILL is a neutral glass well with no bg utility", () => {
		expect(ICON_PILL).toContain("glass");
		expect(ICON_PILL).not.toMatch(/\bbg-/);
		expect(ICON_PILL).not.toMatch(/\bborder\b/);
	});

	it("CHIP is the Badge material", () => {
		expect(CHIP).toContain("glass glass-tint");
		expect(CHIP).toContain("rounded-lg");
		expect(CHIP).not.toMatch(/\bborder\b/);
		expect(CHIP).not.toMatch(/\bbg-/);
	});
});

describe("menu recipes", () => {
	it("one item, one label, one separator", () => {
		expect(MENU_ITEM).toContain("rounded-sm");
		expect(MENU_ITEM).toContain("py-1.5");
		expect(MENU_ITEM).toContain("text-sm");
		expect(MENU_LABEL).toContain("px-2 py-1.5");
		expect(MENU_SEPARATOR).toBe("-mx-1 my-1 h-px bg-border");
	});

	it("the row's horizontal padding is its own term, so an indented row can drop it", () => {
		expect(MENU_ITEM_X).toBe("px-2");
		expect(MENU_ITEM).toBe(`${MENU_ITEM_BASE} ${MENU_ITEM_X}`);
		expect(MENU_ITEM_BASE).not.toMatch(/(^|\s)p[xlr]-/);
	});
});

describe("layers and breakpoints", () => {
	it("sheet stacks under overlay", () => {
		expect(Z.sheet).toBeLessThan(Z.overlay);
		expect(Z_CLASS.overlay).toBe(`z-${Z.overlay}`);
		expect(Z_CLASS.sheet).toBe(`z-${Z.sheet}`);
	});

	it("one mobile breakpoint, matching Tailwind sm", () => {
		expect(MOBILE_BREAKPOINT).toBe(640);
	});
});

describe("section tokens", () => {
	it("inner radius subtracts the same number of units SECTION_PADDING spends", () => {
		expect(SECTION_PADDING).toBe("p-3");
		expect(SECTION_INNER_RADIUS).toContain("var(--spacing)*3");
	});
});
