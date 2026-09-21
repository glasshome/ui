import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
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
