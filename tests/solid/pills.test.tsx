import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";

import { ICON_BUTTON_CLASS } from "../../src/lib/button-variants.js";
import { CARD_SURFACE } from "../../src/lib/card-classes.js";
import { FIELD_CHROME } from "../../src/lib/input-classes.js";
import { FLOATING_PANEL } from "../../src/lib/overlay-classes.js";
import { CHIP, ICON_PILL } from "../../src/lib/pill-classes.js";
import { cn } from "../../src/lib/utils.js";
import { Badge } from "../../src/solid/badge.js";
import { CopyButton } from "../../src/solid/copy-button.js";
import { CountPill } from "../../src/solid/count-pill.js";
import { Dock } from "../../src/solid/dock.js";
import { ItemMedia } from "../../src/solid/item.js";
import { Kbd } from "../../src/solid/kbd.js";
import { Progress } from "../../src/solid/progress.js";
import { ScopeIndicator } from "../../src/solid/scope-indicator.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../src/solid/tooltip.js";

afterEach(() => {
	cleanup();
	document.body.innerHTML = "";
});

/* twMerge drops whatever a caller overrides, so a customised chip never carries
 * CHIP verbatim; the material it must keep is the assertion. */
const expectChipMaterial = (el: HTMLElement) => {
	expect(el.className).toContain("glass glass-tint");
	expect(el.className).toContain("rounded-full");
};

const slot = (root: ParentNode, name: string) => {
	const el = root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
	if (!el) throw new Error(`no [data-slot="${name}"]`);
	return el;
};

describe("one tinted material", () => {
	it("Badge is the CHIP recipe", () => {
		const { container } = render(() => <Badge>Live</Badge>);
		expect(slot(container, "badge").className).toContain(CHIP);
	});

	it("CountPill is a neutral Badge with steady figures", () => {
		const { container } = render(() => <CountPill>3</CountPill>);
		const pill = slot(container, "badge");
		expectChipMaterial(pill);
		expect(pill.className).toContain("tabular-nums");
		expect(pill.getAttribute("style")).toContain("var(--muted-foreground)");
	});

	it("ScopeIndicator is a mono Badge", () => {
		const { container } = render(() => <ScopeIndicator scope="ihsen" type="personal" />);
		const pill = slot(container, "badge");
		expectChipMaterial(pill);
		expect(pill.className).toContain("font-mono");
		expect(pill.textContent).toContain("@ihsen");
	});

	it("ItemMedia takes the icon well from a media prop and still accepts the old variant", () => {
		const byMedia = render(() => <ItemMedia media="icon" />);
		const media = slot(byMedia.container, "item-media");
		expect(media.className).toContain(ICON_PILL);
		expect(media.getAttribute("data-media")).toBe("icon");

		const byVariant = render(() => <ItemMedia variant="icon" />);
		expect(slot(byVariant.container, "item-media").className).toContain(ICON_PILL);
	});

	it("Progress rides a recessed rail with a tinted glass fill", () => {
		const { container } = render(() => <Progress value={60} tone="var(--success)" />);
		const track = slot(container, "progress");
		expect(track.className).toContain(FIELD_CHROME);
		expect(track.getAttribute("style") ?? "").not.toContain("box-shadow");

		const fill = slot(container, "progress-indicator");
		expect(fill.className).toContain("glass glass-tint");
		expect(fill.getAttribute("style")).toContain("var(--success)");
	});
});

describe("Tooltip", () => {
	it("wears the floating glass panel, not an opaque primary plate", () => {
		render(() => (
			<Tooltip open>
				<TooltipTrigger>trigger</TooltipTrigger>
				<TooltipContent>Turn off lights</TooltipContent>
			</Tooltip>
		));
		const content = slot(document, "tooltip-content");
		expect(content.className).toContain(FLOATING_PANEL);
		expect(content.className).toContain("px-3 py-1.5");
	});

	it("keeps Kobalte's namespace on the root", () => {
		expect(typeof Tooltip).toBe("function");
		for (const member of ["Trigger", "Content", "Portal", "Arrow"] as const) {
			expect(typeof Tooltip[member], member).toBe("function");
		}
	});

	it("Kbd wears one recipe, wherever it renders", () => {
		const { container } = render(() => <Kbd>Esc</Kbd>);
		const tokens = slot(container, "kbd").className.split(/\s+/);
		expect(tokens).toEqual(
			expect.arrayContaining(["bg-muted", "text-muted-foreground", "rounded-sm"]),
		);
	});
});

describe("Dock", () => {
	const items = [
		{ id: "home", icon: <span />, label: "Home", isActive: true },
		{ id: "inbox", icon: <span />, label: "Inbox", badge: 12 },
	];

	it("counts pending work with a Badge", () => {
		const { container } = render(() => <Dock items={items} />);
		const badge = slot(container, "badge");
		expect(badge.textContent).toBe("9+");
		expect(badge.getAttribute("aria-label")).toBe("12 pending");
		expectChipMaterial(badge);
		expect(badge.getAttribute("style")).toContain("var(--primary)");
	});

	it("hands its label to Tooltip instead of an always-mounted span", () => {
		const { container } = render(() => <Dock items={items} />);
		expect(container.textContent).not.toContain("Inbox");
		const button = container.querySelector<HTMLElement>('button[aria-label="Inbox"]');
		expect(button).not.toBeNull();
	});

	it("wears the shared card surface", () => {
		const { container } = render(() => <Dock items={items} />);
		const surface = slot(container, "dock-surface");
		expect(surface.className).toContain(cn(CARD_SURFACE, "[--glass-lift:0.55]"));
	});
});

describe("CopyButton", () => {
	it("wears the shared icon button and lets the caller place it", () => {
		const { container } = render(() => <CopyButton text="npm run build" />);
		const button = slot(container, "copy-button");
		expect(button.className).toContain(ICON_BUTTON_CLASS);
		expect(button.className).not.toContain("absolute");
	});
});
