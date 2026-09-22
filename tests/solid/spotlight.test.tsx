import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
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

	it("marks the target with a ring when there is no veil", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim={false}>
				Drag it
			</Spotlight>
		));
		const ring = document.querySelector<HTMLElement>('[data-slot="spotlight-ring"]');
		expect(ring).not.toBeNull();
		expect(ring?.classList.contains("ring-primary")).toBe(true);
		expect(ring?.style.translate).toBe("92px 192px");
		expect(ring?.style.width).toBe("316px");
		expect(ring?.style.height).toBe("66px");
	});

	it("draws no ring when the veil is on", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim>
				Step
			</Spotlight>
		));
		expect(document.querySelector('[data-slot="spotlight-ring"]')).toBeNull();
	});

	it("draws no ring without a measured target", () => {
		render(() => (
			<Spotlight target={undefined} scrim={false}>
				Step
			</Spotlight>
		));
		expect(document.querySelector('[data-slot="spotlight-ring"]')).toBeNull();
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
		expect(bubble?.style.translate).toBe("406px 451px");
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

	it("live keeps following a target that moves after the settle window ends", () => {
		vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
		const el = document.createElement("button");
		document.body.append(el);
		const before = { x: 100, y: 200, width: 300, height: 50 };
		const after = { x: 100, y: 260, width: 300, height: 50 };
		let moved = false;
		el.getBoundingClientRect = () => {
			const r = moved ? after : before;
			return { ...r, left: r.x, top: r.y, right: r.x + r.width, bottom: r.y + r.height } as DOMRect;
		};
		render(() => (
			<Spotlight target={el} scrim live>
				Step
			</Spotlight>
		));
		const scrim = () => document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		for (let i = 0; i < 45; i++) vi.advanceTimersToNextFrame();
		expect(scrim()?.style.clipPath).toContain("M104 192");

		moved = true;
		for (let i = 0; i < 8; i++) vi.advanceTimersToNextFrame();
		expect(scrim()?.style.clipPath).toContain("M104 252");

		vi.useRealTimers();
	});

	it("without live, requests no more frames once the settle window ends", () => {
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

	it("turning live off stops the per-frame follow", () => {
		vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
		const el = targetAt(100, 200, 300, 50);
		const [live, setLive] = createSignal(true);
		render(() => (
			<Spotlight target={el} scrim live={live()}>
				Step
			</Spotlight>
		));
		for (let i = 0; i < 45; i++) vi.advanceTimersToNextFrame();
		setLive(false);
		const rafSpy = vi.spyOn(window, "requestAnimationFrame");
		for (let i = 0; i < 10; i++) vi.advanceTimersToNextFrame();
		expect(rafSpy.mock.calls.length).toBe(0);
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

	it("drops the travel transition while live, so the hole stays on a dragged target", () => {
		const el = targetAt(100, 200, 300, 50);
		render(() => (
			<Spotlight target={el} scrim live>
				Step
			</Spotlight>
		));
		const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
		for (const token of TRAVEL_MOTION.split(" ")) {
			expect(scrim?.classList.contains(token)).toBe(false);
		}
	});

	it("keeps the travel transition when not live", () => {
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
});
