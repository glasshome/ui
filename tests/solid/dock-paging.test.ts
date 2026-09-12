import { describe, expect, it } from "vitest";
import { pageCount, pageOf, pageOffset, stripWidth } from "../../src/solid/dock-paging.js";

describe("dock paging", () => {
	it("one page while everything fits", () => {
		expect(pageCount(400, 400)).toBe(1);
		expect(pageCount(320, 400)).toBe(1);
	});

	it("counts a page per viewport of strip, the last one part-full", () => {
		expect(pageCount(800, 400)).toBe(2);
		expect(pageCount(900, 400)).toBe(3);
	});

	it("an unmeasured strip has a single page", () => {
		expect(pageCount(0, 0)).toBe(1);
		expect(pageCount(800, 0)).toBe(1);
	});

	it("reads the page from where the strip is scrolled", () => {
		expect(pageOf(0, 400)).toBe(0);
		expect(pageOf(180, 400)).toBe(0);
		expect(pageOf(240, 400)).toBe(1);
		expect(pageOf(800, 400)).toBe(2);
	});

	it("scrolls to the start of a page, never past the end", () => {
		expect(pageOffset(0, 400, 900)).toBe(0);
		expect(pageOffset(1, 400, 900)).toBe(400);
		expect(pageOffset(2, 400, 900)).toBe(500);
		expect(pageOffset(9, 400, 900)).toBe(500);
	});

	it("trims the strip to the last whole item", () => {
		expect(stripWidth(222, 40, 2)).toBe(208);
		expect(stripWidth(208, 40, 2)).toBe(208);
	});

	it("keeps one item when not even one fits", () => {
		expect(stripWidth(30, 40, 2)).toBe(30);
	});

	it("leaves an unmeasured strip alone", () => {
		expect(stripWidth(222, 0, 2)).toBe(222);
		expect(stripWidth(0, 40, 2)).toBe(0);
	});
});
