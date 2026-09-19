import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";

import { CARD_INTERACTIVE, CARD_SURFACE_BASE } from "../../src/lib/card-classes.js";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../../src/solid/empty.js";
import { HeroAction } from "../../src/solid/hero-action.js";
import { PageHeader } from "../../src/solid/page-header.js";
import {
	FactRow,
	SectionCard,
	SectionIcon,
	SectionLabel,
	SectionRow,
	SectionRowSkeletons,
	SectionTitle,
} from "../../src/solid/section-card.js";
import { WidgetCard } from "../../src/solid/widget-card.js";
import type { WidgetSummary } from "../../src/solid/widget-identity.js";

afterEach(cleanup);

const full = () =>
	render(() => (
		<SectionCard
			icon="lucide:layout-grid"
			title="Section title"
			subtitle="Muted meta line"
			count={3}
			action={<span data-testid="action-child">act</span>}
			toolbar={<span data-testid="toolbar-child">bar</span>}
		>
			<span data-testid="body-child">rows</span>
		</SectionCard>
	));

const slot = (root: HTMLElement, name: string) => {
	const el = root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
	if (!el) throw new Error(`no [data-slot="${name}"]`);
	return el;
};

describe("SectionCard spacing owner", () => {
	it("stacks its parts with a gap on the section itself", () => {
		const { container } = full();
		const section = slot(container, "section-card");
		expect(section.className).toContain("flex-col");
		expect(section.className).toMatch(/\bgap-3\b/);
		expect(section.className).toMatch(/\bp-3\b/);
	});

	it("gives no part a margin or a padding aimed at its sibling", () => {
		const { container } = full();
		for (const name of ["section-card-header", "section-card-toolbar", "section-card-body"]) {
			const cls = slot(container, name).className;
			expect(cls, name).not.toMatch(/(^|\s)-?m[trblxy]?-/);
			expect(cls, name).not.toMatch(/(^|\s)pb-/);
			expect(cls, name).not.toContain("pt-0");
			expect(cls, name).not.toMatch(/(^|\s)space-y-/);
		}
	});

	it("renders no body slot when the card has only a header", () => {
		const withBody = render(() => <SectionCard title="t">rows</SectionCard>);
		expect(slot(withBody.container, "section-card-body").textContent).toBe("rows");
		cleanup();

		const headerOnly = render(() => <SectionCard title="t" />);
		expect(headerOnly.container.querySelector('[data-slot="section-card-body"]')).toBeNull();
	});

	it("keeps the toolbar rule only when a header sits above it", () => {
		const withHeader = render(() => (
			<SectionCard title="t" toolbar={<span>bar</span>}>
				body
			</SectionCard>
		));
		expect(slot(withHeader.container, "section-card-toolbar").className).toContain("border-t");

		const bare = render(() => <SectionCard toolbar={<span>bar</span>}>body</SectionCard>);
		expect(slot(bare.container, "section-card-toolbar").className).not.toContain("border-t");
	});

	it("names every part it renders with a data-slot", () => {
		const { container } = full();
		const section = slot(container, "section-card");
		const caller = Array.from(section.querySelectorAll("[data-testid], svg[data-slot=icon]"));
		const own = Array.from(section.querySelectorAll<HTMLElement>("*")).filter(
			(el) => !caller.some((c) => c === el || c.contains(el)),
		);
		expect(own.length).toBeGreaterThan(5);
		for (const el of own) {
			expect(el.getAttribute("data-slot"), el.outerHTML.slice(0, 80)).toBeTruthy();
		}
	});

	it("leaves the hover sheen to the interactive card recipe", () => {
		expect(CARD_INTERACTIVE).toContain("hover:[--glass-light:");
		const { container } = full();
		expect(slot(container, "section-card").className).not.toContain("hover:");
	});

	it("steps the title at exactly one breakpoint", () => {
		const { container } = render(() => <SectionTitle>t</SectionTitle>);
		const title = slot(container, "section-title");
		const steps = title.className.split(/\s+/).filter((t) => /^(sm|md|lg|xl):/.test(t));
		expect(steps).toEqual(["sm:text-xl"]);
	});
});

describe("section kit material", () => {
	it("SectionRow is glass, not a flat card fill", () => {
		const { container } = render(() => <SectionRow>row</SectionRow>);
		const row = slot(container, "section-row");
		expect(row.className).toContain("glass");
		expect(row.className).not.toMatch(/(^|\s)bg-/);
		expect(row.className).not.toMatch(/(^|\s)border(\s|$)/);
	});

	it("skeleton rows compose the row surface and stack with a gap", () => {
		const { container } = render(() => <SectionRowSkeletons count={2} />);
		const list = slot(container, "section-row-skeletons");
		expect(list.className).not.toMatch(/(^|\s)space-y-/);
		expect(list.className).toMatch(/\bgap-2\b/);
		const rows = container.querySelectorAll('[data-slot="section-row-skeleton"]');
		expect(rows.length).toBe(2);
		expect(rows[0]?.className).toContain("glass");
	});

	it("SectionIcon defaults to the neutral glass well", () => {
		const { container } = render(() => <SectionIcon icon="lucide:cloud" />);
		const icon = slot(container, "section-icon");
		expect(icon.className).toContain("glass");
		expect(icon.className).not.toMatch(/(^|\s)bg-/);
		expect(icon.getAttribute("style") ?? "").not.toContain("--glass-tone");
	});

	it("SectionIcon takes a CSS color tone and still maps the old enum", () => {
		const css = render(() => <SectionIcon icon="a" tone="var(--warning)" />);
		expect(slot(css.container, "section-icon").getAttribute("style")).toContain("var(--warning)");

		const legacy = render(() => <SectionIcon icon="a" tone="primary" />);
		const el = slot(legacy.container, "section-icon");
		expect(el.getAttribute("style")).toContain("var(--primary)");
		expect(el.className).toContain("glass-tint");
	});

	it("SectionLabel renders the SectionMeta line, bolded", () => {
		const { container } = render(() => <SectionLabel>Devices</SectionLabel>);
		const label = slot(container, "section-meta");
		const tokens = label.className.split(/\s+/);
		expect(tokens).toEqual(
			expect.arrayContaining(["text-muted-foreground", "text-xs", "font-medium"]),
		);
	});
});

describe("Empty", () => {
	it("draws no frame of its own, so the surface under it owns the chrome", () => {
		const { container } = render(() => (
			<Empty>
				<EmptyHeader>
					<EmptyMedia media="icon">
						<span />
					</EmptyMedia>
					<EmptyTitle>No devices yet</EmptyTitle>
				</EmptyHeader>
			</Empty>
		));
		const root = slot(container, "empty");
		expect(root.className).not.toMatch(/(^|\s)border(\s|$)/);
		expect(root.className).not.toContain("border-dashed");
	});

	it("lets the header own the gap under the media pill", () => {
		const { container } = render(() => (
			<EmptyMedia media="icon">
				<span />
			</EmptyMedia>
		));
		const media = slot(container, "empty-media");
		expect(media.className).not.toMatch(/(^|\s)mb-/);
		expect(media.className).toContain("glass");
	});

	it("names the media kind on both attributes, like ItemMedia", () => {
		const iconed = render(() => <EmptyMedia media="icon" />);
		const media = slot(iconed.container, "empty-media");
		expect(media.dataset.media).toBe("icon");
		expect(media.dataset.variant).toBe("icon");
		cleanup();

		const plain = render(() => <EmptyMedia />);
		expect(slot(plain.container, "empty-media").dataset.variant).toBe("default");
	});
});

describe("HeroAction and PageHeader stop carrying app chrome", () => {
	it("HeroAction wears no app class", () => {
		const { container } = render(() => (
			<HeroAction
				icon="lucide:home"
				title="Home Assistant"
				description="Connect the hub"
				accentVar="var(--primary)"
				onClick={() => {}}
			/>
		));
		const root = slot(container, "hero-action");
		expect(root.className).toMatch(/(^|\s)glass(\s|$)/);
		expect(root.className).toMatch(/\bp-4\b/);
	});

	it("PageHeader wears the card surface and leaves its outer spacing to the caller", () => {
		const { container } = render(() => <PageHeader title="Widgets" count={12} />);
		const root = slot(container, "page-header");
		expect(root.className).toContain(CARD_SURFACE_BASE);
		expect(root.className).not.toMatch(/(^|\s)-?m[trblxy]?-/);
		expect(root.className).not.toContain("white");
	});
});

describe("WidgetCard tile", () => {
	const widget: WidgetSummary = {
		scope: "glasshome",
		name: "energy-flow",
		displayName: "Energy Flow",
		description: "Live power flow in one animated card.",
		latestVersion: "1.2.0",
		downloadCount: 4820,
	};

	const parts = (root: HTMLElement) => {
		const card = root.querySelector<HTMLElement>('[data-slot="card"]');
		if (!card) throw new Error("no card");
		return {
			body: card.querySelector<HTMLElement>('[data-slot="widget-card-body"]'),
			last: card.lastElementChild,
			meta: card.querySelector<HTMLElement>('[data-slot="widget-meta"]'),
		};
	};

	it("pins the meta footer whether or not a description renders", () => {
		for (const props of [
			{ widget },
			{ widget, showDescription: false },
			{ widget: { ...widget, description: null } },
		]) {
			const { container, unmount } = render(() => <WidgetCard layout="tile" {...props} />);
			const { body, last, meta } = parts(container);
			expect(body?.className).toContain("flex-1");
			expect(meta).not.toBeNull();
			expect(last).toBe(meta);
			expect(meta?.className).not.toMatch(/(^|\s)-?m[trblxy]?-/);
			unmount();
		}
	});
});

describe("FactRow", () => {
	it("puts the label and the value in one row, value to the right", () => {
		const { container } = render(() => <FactRow label="Owner">Maya Chen</FactRow>);
		const row = container.querySelector("[data-slot='fact-row']");
		expect(row?.textContent).toBe("OwnerMaya Chen");
		expect(row?.lastElementChild?.className).toContain("text-right");
	});
});
