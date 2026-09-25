import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Dock } from "../../src/solid/dock.js";

describe("Dock paging", () => {
	const items = (n: number) =>
		Array.from({ length: n }, (_, i) => ({
			id: `d${i}`,
			icon: <span />,
			label: `Dashboard ${i}`,
			onClick: () => {},
		}));

	function measured(scrollWidth: number, clientWidth: number) {
		Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
			configurable: true,
			get() {
				return this.getAttribute("data-slot") === "dock-bar" ? scrollWidth : 0;
			},
		});
		Object.defineProperty(HTMLElement.prototype, "clientWidth", {
			configurable: true,
			get() {
				return this.getAttribute("data-slot") === "dock-bar" ? clientWidth : 400;
			},
		});
	}

	afterEach(() => {
		// @ts-expect-error restoring the prototype the measurement stub replaced
		delete HTMLElement.prototype.scrollWidth;
		// @ts-expect-error restoring the prototype the measurement stub replaced
		delete HTMLElement.prototype.clientWidth;
	});

	it("shows no page dots while every item fits", async () => {
		measured(300, 400);
		const { container } = render(() => <Dock items={items(3)} />);
		await new Promise((r) => setTimeout(r, 150));

		expect(container.querySelector('[data-slot="dock-pages"]')).toBeNull();
	});

	it("takes the room it has from the box the app gave it, not from its own surface", async () => {
		// The surface hugs the strip; only the outer box knows what the app allowed.
		Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
			configurable: true,
			get() {
				return this.getAttribute("data-slot") === "dock-bar" ? 900 : 0;
			},
		});
		Object.defineProperty(HTMLElement.prototype, "clientWidth", {
			configurable: true,
			get() {
				const slot = this.getAttribute("data-slot");
				if (slot === "dock") return 1200;
				if (slot === "dock-surface") return 600;
				return 900;
			},
		});
		const { container } = render(() => <Dock items={items(10)} />);
		await new Promise((r) => setTimeout(r, 150));

		expect(container.querySelector('[data-slot="dock-pages"]')).toBeNull();
		expect(container.querySelector<HTMLElement>('[data-slot="dock-bar"]')?.style.width).toBe("");
	});

	it("shows a dot per page once the strip overflows, the first one current", async () => {
		measured(1000, 400);
		const { container } = render(() => <Dock items={items(12)} />);
		await new Promise((r) => setTimeout(r, 150));

		const dots = container.querySelectorAll('[data-slot="dock-pages"] button');
		expect(dots).toHaveLength(3);
		expect(dots[0]?.getAttribute("aria-current")).toBe("true");
		expect(dots[1]?.getAttribute("aria-current")).toBeNull();
	});

	it("snaps the strip instead of free-scrolling it", async () => {
		measured(1000, 400);
		const { container } = render(() => <Dock items={items(12)} />);
		await new Promise((r) => setTimeout(r, 150));

		const bar = container.querySelector('[data-slot="dock-bar"]');
		expect(bar?.className).toContain("snap-x");
		expect(container.querySelector('[data-slot="dock-item"]')?.className).toContain("snap-start");
	});
});

describe("Dock hold", () => {
	const two = [
		{ id: "a", icon: <span />, label: "A", onClick: () => {} },
		{ id: "b", icon: <span />, label: "B", onClick: () => {} },
	];

	it("grows the flood while held, dissolves it once fired, and drains where it grew", () => {
		const [hold, setHold] = createSignal<{ x: number; y: number; fired: boolean } | null>(null);
		const { container } = render(() => <Dock items={two} hold={hold()} />);
		const flood = () => container.querySelector('[data-slot="dock-flood"]') as HTMLElement;

		expect(flood().hasAttribute("data-hold")).toBe(false);
		setHold({ x: 12, y: 8, fired: false });
		expect(flood().hasAttribute("data-hold")).toBe(true);
		expect(flood().style.left).toBe("12px");
		expect(flood().style.width).toMatch(/px$/);
		setHold({ x: 12, y: 8, fired: true });
		expect(flood().hasAttribute("data-fired")).toBe(true);
		expect(flood().hasAttribute("data-hold")).toBe(false);
		setHold(null);
		expect(flood().hasAttribute("data-fired")).toBe(false);
		expect(flood().style.left).toBe("12px");
	});
});

describe("Dock mode rim", () => {
	const two = [
		{ id: "a", icon: <span />, label: "A", onClick: () => {} },
		{ id: "b", icon: <span />, label: "B", onClick: () => {} },
	];

	it("orbits the rim only while a mode is on", () => {
		const [on, setOn] = createSignal(false);
		const { container } = render(() => <Dock items={two} glow={on()} />);
		expect(container.querySelector('[data-slot="dock-glow"]')).toBeNull();
		setOn(true);
		expect(container.querySelector('[data-slot="dock-glow"]')).not.toBeNull();
	});
});

describe("Dock drop target", () => {
	it("names each item and marks the one a drag would land on", () => {
		const [target, setTarget] = createSignal<string | null>(null);
		const { container, unmount } = render(() => (
			<Dock
				items={["a", "b"].map((id) => ({
					id,
					icon: <span />,
					label: id,
					isDropTarget: id === target(),
				}))}
			/>
		));
		const marked = () =>
			[...container.querySelectorAll("[data-drop-target]")].map((e) =>
				e.getAttribute("data-dock-id"),
			);
		expect(marked()).toEqual([]);
		setTarget("b");
		expect(marked()).toEqual(["b"]);
		// Unmounting clears the dock's overflow timer, which would otherwise fire after teardown.
		unmount();
	});
});
