import { describe, expect, it } from "vitest";
import { hasNoDragAncestor, shouldDrag } from "../../src/solid/bottom-sheet/arbitration.js";

function sheet(inner = ""): { root: HTMLElement; target: (sel: string) => Element } {
	const root = document.createElement("div");
	root.innerHTML = inner;
	document.body.appendChild(root);
	return {
		root,
		target: (sel: string) => {
			const el = root.querySelector(sel);
			if (!el) throw new Error(`no element for ${sel}`);
			return el;
		},
	};
}

function makeScrollable(
	el: Element,
	opts: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
	(el as HTMLElement).style.overflowY = "auto";
	Object.defineProperty(el, "scrollTop", { value: opts.scrollTop, configurable: true });
	Object.defineProperty(el, "scrollHeight", { value: opts.scrollHeight, configurable: true });
	Object.defineProperty(el, "clientHeight", { value: opts.clientHeight, configurable: true });
}

describe("hasNoDragAncestor", () => {
	it("finds the marker on the target itself", () => {
		const { root, target } = sheet(`<div data-sheet-no-drag id="x"></div>`);
		expect(hasNoDragAncestor(target("#x"), root)).toBe(true);
	});

	it("finds the marker on an ancestor", () => {
		const { root, target } = sheet(`<div data-sheet-no-drag><span id="x"></span></div>`);
		expect(hasNoDragAncestor(target("#x"), root)).toBe(true);
	});

	it("returns false without a marker", () => {
		const { root, target } = sheet(`<div><span id="x"></span></div>`);
		expect(hasNoDragAncestor(target("#x"), root)).toBe(false);
	});
});

describe("shouldDrag", () => {
	it("yields to horizontal gestures", () => {
		const { root, target } = sheet(`<div id="x"></div>`);
		expect(shouldDrag(target("#x"), root, 5, 20)).toBe(false);
	});

	it("drags on a plain target", () => {
		const { root, target } = sheet(`<div id="x"></div>`);
		expect(shouldDrag(target("#x"), root, 20, 2)).toBe(true);
	});

	it("respects data-sheet-no-drag", () => {
		const { root, target } = sheet(`<div data-sheet-no-drag id="x"></div>`);
		expect(shouldDrag(target("#x"), root, 20, 0)).toBe(false);
	});

	it("yields to a scrolled-down list when dragging down", () => {
		const { root, target } = sheet(`<div id="list"><span id="x"></span></div>`);
		makeScrollable(target("#list"), { scrollTop: 50, scrollHeight: 300, clientHeight: 100 });
		expect(shouldDrag(target("#x"), root, 20, 0)).toBe(false);
	});

	it("drags down when the list is already at its top", () => {
		const { root, target } = sheet(`<div id="list"><span id="x"></span></div>`);
		makeScrollable(target("#list"), { scrollTop: 0, scrollHeight: 300, clientHeight: 100 });
		expect(shouldDrag(target("#x"), root, 20, 0)).toBe(true);
	});

	it("yields upward drags to a list that can still scroll down", () => {
		const { root, target } = sheet(`<div id="list"><span id="x"></span></div>`);
		makeScrollable(target("#list"), { scrollTop: 0, scrollHeight: 300, clientHeight: 100 });
		expect(shouldDrag(target("#x"), root, -20, 0)).toBe(false);
	});

	it("drags up once the list is scrolled to its bottom", () => {
		const { root, target } = sheet(`<div id="list"><span id="x"></span></div>`);
		makeScrollable(target("#list"), { scrollTop: 200, scrollHeight: 300, clientHeight: 100 });
		expect(shouldDrag(target("#x"), root, -20, 0)).toBe(true);
	});

	it("treats data-sheet-scroll as scrollable regardless of computed style", () => {
		const { root, target } = sheet(`<div data-sheet-scroll id="list"><span id="x"></span></div>`);
		Object.defineProperty(target("#list"), "scrollTop", { value: 50, configurable: true });
		expect(shouldDrag(target("#x"), root, 20, 0)).toBe(false);
	});
});
