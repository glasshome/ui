import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Z_CLASS } from "../../src/lib/layers.js";
import { TRAVEL_MOTION } from "../../src/lib/motion-classes.js";
import { SCRIM_CLASS } from "../../src/lib/overlay-classes.js";
import { Spotlight } from "../../src/solid/spotlight.js";

function targetAt(x: number, y: number, width: number, height: number) {
	const el = document.createElement("button");
	el.getBoundingClientRect = () =>
		({ x, y, width, height, left: x, top: y, right: x + width, bottom: y + height }) as DOMRect;
	document.body.append(el);
	return el;
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("Spotlight", () => {
	it("cuts the hole over the target's rect", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Hold the dock
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.style.clipPath).toContain("M104 192");
	});

	it("draws no scrim when scrim is off, and still draws the bubble", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim={false}>
				Drag it
			</Spotlight>
		));
		expect(document.querySelector('[data-slot="spotlight-scrim"]')).toBeNull();
		expect(document.querySelector('[data-slot="spotlight-bubble"]')?.textContent).toContain(
			"Drag it",
		);
	});

	it("re-measures the bubble one frame later, so content that grows after the target changes is placed from the grown height", () => {
		let rafCallback: FrameRequestCallback | undefined;
		const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
			rafCallback = cb;
			return 0;
		});
		const a = targetAt(100, 200, 300, 50);
		const b = targetAt(500, 600, 100, 40);
		const [target, setTarget] = createSignal<Element>(a);
		render(() => (
			<Spotlight target={target()} scrim={false}>
				Step
			</Spotlight>
		));
		const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
		let height = 116;
		Object.defineProperty(bubble, "offsetHeight", { get: () => height, configurable: true });
		Object.defineProperty(bubble, "offsetWidth", { get: () => 288, configurable: true });
		setTarget(b);
		height = 137;
		rafCallback?.(0);
		/* The tail's half-diagonal (6√2) grows the gap below BUBBLE_GAP=12. */
		const gap = 12 + 6 * Math.SQRT2;
		const [x, y] = (bubble?.style.translate ?? "").split(" ");
		expect(x).toBe("406px");
		expect(Number.parseFloat(y ?? "")).toBeCloseTo(600 - gap - 137, 5);
		rafSpy.mockRestore();
	});

	it("keeps re-measuring for the full window even when the target's motion starts late", () => {
		vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
		const rafSpy = vi.spyOn(window, "requestAnimationFrame");
		const el = document.createElement("button");
		document.body.append(el);
		const before = { x: 100, y: 220, width: 300, height: 50 };
		const after = { x: 100, y: 200, width: 300, height: 50 };
		/* Mimics a grid tile whose transition starts a few frames after mount: rect
		 * only starts moving on frame 5, and has landed by frame 12. */
		let call = 0;
		el.getBoundingClientRect = () => {
			const r = call < 5 ? before : call < 12 ? { ...before, y: before.y - (call - 4) * 3 } : after;
			call++;
			return {
				...r,
				left: r.x,
				top: r.y,
				right: r.x + r.width,
				bottom: r.y + r.height,
			} as DOMRect;
		};
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		const scrim = () => document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim()?.style.clipPath).toContain("M104 212");

		for (let i = 0; i < 40; i++) vi.advanceTimersToNextFrame();
		expect(scrim()?.style.clipPath).toContain("M104 192");

		const callsInWindow = rafSpy.mock.calls.length;
		expect(callsInWindow).toBeGreaterThan(20);

		vi.advanceTimersToNextFrame();
		expect(rafSpy.mock.calls.length).toBe(callsInWindow);

		rafSpy.mockRestore();
		vi.useRealTimers();
	});

	it("follows a new target", () => {
		const a = targetAt(100, 200, 300, 50);
		const b = targetAt(500, 600, 100, 40);
		const [target, setTarget] = createSignal<Element>(a);
		render(() => (
			<Spotlight target={target()} scrim>
				Step
			</Spotlight>
		));
		setTarget(b);
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.style.clipPath).toContain("M504 592");
	});

	it("requests no more frames once the settle window ends", () => {
		vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
		const rafSpy = vi.spyOn(window, "requestAnimationFrame");
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		for (let i = 0; i < 45; i++) vi.advanceTimersToNextFrame();
		const settled = rafSpy.mock.calls.length;
		for (let i = 0; i < 10; i++) vi.advanceTimersToNextFrame();
		expect(rafSpy.mock.calls.length).toBe(settled);
		rafSpy.mockRestore();
		vi.useRealTimers();
	});

	it("calls onSkip on Escape", () => {
		const onSkip = vi.fn();
		render(() => (
			<Spotlight target={undefined} scrim onSkip={onSkip}>
				Step
			</Spotlight>
		));
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		expect(onSkip).toHaveBeenCalledOnce();
	});

	it("blocks no presses when the target is unmeasured", () => {
		render(() => (
			<Spotlight target={undefined} scrim>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.classList.contains("pointer-events-none")).toBe(true);
	});

	it("blocks presses outside a measured target", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.classList.contains("pointer-events-none")).toBe(false);
	});

	it("blocks presses on an unmeasured target when blocking", () => {
		render(() => (
			<Spotlight target={undefined} scrim blocking>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.classList.contains("pointer-events-none")).toBe(false);
	});

	it("keeps blocking presses off when no blocking is set", () => {
		render(() => (
			<Spotlight target={undefined} scrim>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.classList.contains("pointer-events-none")).toBe(true);
	});

	it("leaves a measured target unaffected by blocking", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim blocking>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.classList.contains("pointer-events-none")).toBe(false);
	});

	it("observes the bubble element too, so its own size change re-places it", () => {
		const observe = vi.fn();
		const Original = globalThis.ResizeObserver;
		globalThis.ResizeObserver = class {
			observe = observe;
			unobserve() {}
			disconnect() {}
		} as unknown as typeof ResizeObserver;
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		const bubble = document.querySelector('[data-slot="spotlight-bubble"]');
		expect(observe.mock.calls.map((c) => c[0])).toContain(bubble);
		globalThis.ResizeObserver = Original;
	});

	it("skips the scrim style write when a remeasure finds the same rect", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
		setProperty.mockClear();
		window.dispatchEvent(new Event("scroll"));
		expect(setProperty).not.toHaveBeenCalled();
		setProperty.mockRestore();
	});

	it("wears the modal scrim recipe", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		for (const token of SCRIM_CLASS.split(" ")) {
			expect(scrim?.classList.contains(token)).toBe(true);
		}
	});

	it("keeps the travel transition", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		for (const token of TRAVEL_MOTION.split(" ")) {
			expect(scrim?.classList.contains(token)).toBe(true);
		}
	});

	it("cuts the hole with a custom pad", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim pad={0}>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.style.clipPath).toContain("M112 200");
	});

	it("leaves no listener or observer behind", () => {
		const disconnect = vi.fn();
		const Original = globalThis.ResizeObserver;
		globalThis.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect = disconnect;
		} as unknown as typeof ResizeObserver;
		const remove = vi.spyOn(window, "removeEventListener");
		const el = targetAt(0, 0, 10, 10);
		const { unmount } = render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		unmount();
		expect(disconnect).toHaveBeenCalled();
		expect(remove.mock.calls.map((c) => c[0])).toEqual(
			expect.arrayContaining(["resize", "scroll"]),
		);
		globalThis.ResizeObserver = Original;
	});

	it("points the tail at the target on a below-placed bubble", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim={false}>
				Step
			</Spotlight>
		));
		expect(bubbleSide()).toBe("below");
		const tail = document.querySelector<HTMLElement>('[data-slot="spotlight-tail"]');
		expect(tail?.getAttribute("data-side")).toBe("below");
		expect(tail?.style.left).toBe(`${144 - 6}px`);
	});

	it("points the tail at the target on an above-placed bubble", () => {
		const el = targetAt(400, 700, 200, 60);
		render(() => (
			<Spotlight target={el} scrim={false}>
				Step
			</Spotlight>
		));
		expect(bubbleSide()).toBe("above");
		const tail = document.querySelector<HTMLElement>('[data-slot="spotlight-tail"]');
		expect(tail?.getAttribute("data-side")).toBe("above");
	});

	it("paints the panel over the tail's inner half, so only the outer half shows", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim={false}>
				Step
			</Spotlight>
		));
		const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
		const tail = bubble?.querySelector('[data-slot="spotlight-tail"]');
		const panel = bubble?.querySelector('[data-slot="spotlight-panel"]');
		expect(tail).toBeTruthy();
		expect(panel).toBeTruthy();
		expect(tail?.compareDocumentPosition(panel as Node) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(
			true,
		);
		expect(panel?.classList.contains("relative")).toBe(true);
	});

	it("carries the overlay layer on the positioner, so the panel never outranks the scrim", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim={false}>
				Step
			</Spotlight>
		));
		const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
		const panel = document.querySelector<HTMLElement>('[data-slot="spotlight-panel"]');
		expect(bubble?.classList.contains(Z_CLASS.overlay)).toBe(true);
		expect(panel?.classList.contains(Z_CLASS.overlay)).toBe(false);
	});

	it("draws no tail when the bubble is centred with no target", () => {
		render(() => (
			<Spotlight target={undefined} scrim={false}>
				Step
			</Spotlight>
		));
		expect(bubbleSide()).toBe("center");
		expect(document.querySelector('[data-slot="spotlight-tail"]')).toBeNull();
	});

	it("anchors the bubble and its tail to a different element than the target's hole", () => {
		const target = targetAt(100, 200, 300, 50);
		const anchor = targetAt(500, 200, 60, 30);
		render(() => (
			<Spotlight target={target} anchor={anchor} scrim>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		expect(scrim?.style.clipPath).toContain("M104 192");
		const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
		const gap = 12 + 6 * Math.SQRT2;
		const [x, y] = (bubble?.style.translate ?? "").split(" ");
		expect(x).toBe("386px");
		expect(Number.parseFloat(y ?? "")).toBeCloseTo(200 + 30 + gap, 5);
	});
});

function bubbleSide() {
	return document.querySelector('[data-slot="spotlight-bubble"]')?.getAttribute("data-side");
}
