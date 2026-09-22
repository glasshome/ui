import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Toggle } from "../../src/solid/toggle.js";
import { ToggleGroup, ToggleGroupItem } from "../../src/solid/toggle-group.js";

afterEach(cleanup);

type Rect = { left: number; top: number; width: number; height: number };

function stubRect(el: HTMLElement, rect: Rect) {
	el.getBoundingClientRect = () =>
		({
			...rect,
			right: rect.left + rect.width,
			bottom: rect.top + rect.height,
			x: rect.left,
			y: rect.top,
			toJSON: () => rect,
		}) as DOMRect;
}

async function flush() {
	await Promise.resolve();
	await Promise.resolve();
}

describe("ToggleGroup", () => {
	it("leaves the hover fill to the standalone Toggle, so no square paints behind the indicator", () => {
		const standalone = render(() => <Toggle>Notify</Toggle>);
		expect(
			standalone.container.querySelector<HTMLElement>('[data-slot="toggle"]')?.className,
		).toContain("not-data-[pressed]:hover:bg-muted");
		cleanup();

		const { container } = render(() => (
			<ToggleGroup value="left">
				<ToggleGroupItem value="left">Left</ToggleGroupItem>
				<ToggleGroupItem value="right">Right</ToggleGroupItem>
			</ToggleGroup>
		));
		const items = container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
		expect(items).toHaveLength(2);
		for (const item of items) {
			// `:not([data-pressed]):hover` (0,3,0) outranks the group's own
			// `hover:bg-transparent` (0,2,0), so the fill must never reach an item.
			expect(item.className).not.toContain("hover:bg-muted");
			expect(item.className).toContain("hover:text-primary");
		}
	});

	it("gives a multi-select segment hover feedback without a fill", () => {
		const { container } = render(() => (
			<ToggleGroup multiple value={["left"]}>
				<ToggleGroupItem value="left">Left</ToggleGroupItem>
				<ToggleGroupItem value="right">Right</ToggleGroupItem>
			</ToggleGroup>
		));
		// No sliding indicator paints this group, so each pressed segment keeps its
		// own fill, and the unpressed ones still have to answer the pointer.
		expect(container.querySelector("[data-sliding-indicator]")).toBeNull();
		for (const item of container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]')) {
			expect(item.className).toContain("not-data-[pressed]:hover:text-primary");
			expect(item.className).not.toContain("hover:bg-muted");
			expect(item.className).toContain("data-[pressed]:bg-muted");
		}
	});

	it("paints the sliding indicator in the group's tone", async () => {
		const { container } = render(() => (
			<ToggleGroup value="left" tone="oklch(0.66 0.2 30)">
				<ToggleGroupItem value="left">Left</ToggleGroupItem>
				<ToggleGroupItem value="right">Right</ToggleGroupItem>
			</ToggleGroup>
		));
		const items = container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
		const root = items[0]?.parentElement;
		if (!root) throw new Error("no root");
		stubRect(root, { left: 0, top: 0, width: 160, height: 32 });
		stubRect(items[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 32 });
		stubRect(items[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
		await flush();

		const indicator = container.querySelector<HTMLElement>("[data-sliding-indicator]");
		expect(indicator?.style.getPropertyValue("--glass-tone")).toBe("oklch(0.66 0.2 30)");
	});

	it("matches the item radius on the sliding indicator", async () => {
		const { container } = render(() => (
			<ToggleGroup value="left">
				<ToggleGroupItem value="left">Left</ToggleGroupItem>
				<ToggleGroupItem value="right">Right</ToggleGroupItem>
			</ToggleGroup>
		));
		const items = container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
		// The sliding indicator measures against its OWN wrapper div, one level
		// inside the ToggleGroupPrimitive root, not the root itself.
		const root = items[0]?.parentElement;
		if (!root) throw new Error("no root");
		stubRect(root, { left: 0, top: 0, width: 160, height: 32 });
		stubRect(items[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 32 });
		stubRect(items[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
		Object.defineProperty(root, "clientWidth", { value: 160, configurable: true });
		Object.defineProperty(root, "clientHeight", { value: 32, configurable: true });
		await flush();

		const indicator = container.querySelector<HTMLElement>("[data-sliding-indicator]");
		expect(indicator?.className).toContain("rounded-md");
	});
});
