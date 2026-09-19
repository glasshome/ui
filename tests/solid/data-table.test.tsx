/* data-table.tsx's empty/loading states used to hand-roll their own markup
 * (a second Empty, a third Skeleton family with inline widths); these pin
 * that they now compose the package's own Empty/Skeleton, and that the
 * scroll recipe caps no height of its own (real hub call sites pass it bare,
 * inside a page that already scrolls) while keeping the shared scrollbar. */
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import {
	DataTableHead,
	DataTableRow,
	TABLE_HEAD_LABEL_CLASS,
	TABLE_SCROLL_CLASS,
	TableEmpty,
	TableSkeleton,
} from "../../src/solid/data-table.js";
import { TABLE_HEAD_CELL_CLASS } from "../../src/solid/table.js";

afterEach(cleanup);

describe("TableSkeleton", () => {
	it("composes Skeleton rows with no inline widths", () => {
		const { container } = render(() => <TableSkeleton count={2} />);
		const skeletons = container.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');
		expect(skeletons.length).toBeGreaterThan(0);
		for (const el of Array.from(skeletons)) {
			expect(el.getAttribute("style") ?? "").not.toContain("width");
		}
	});
});

describe("TableEmpty", () => {
	it("composes Empty", () => {
		const { container } = render(() => <TableEmpty message="No rows" />);
		expect(container.querySelector('[data-slot="empty"]')).not.toBeNull();
	});

	it("asks for the icon pill through the current prop", () => {
		const { container } = render(() => <TableEmpty icon="lucide:inbox" message="No rows" />);
		const media = container.querySelector<HTMLElement>('[data-slot="empty-media"]');
		expect(media?.dataset.media).toBe("icon");
	});
});

describe("TABLE_SCROLL_CLASS", () => {
	it("carries the shared scrollbar and caps no height of its own", () => {
		expect(TABLE_SCROLL_CLASS).toContain("gh-scroll");
		expect(TABLE_SCROLL_CLASS).not.toMatch(/max-h-/);
	});
});

describe("TABLE_HEAD_LABEL_CLASS", () => {
	it("is the head-cell typography without the <table> family's cell inset", () => {
		const tokens = TABLE_HEAD_LABEL_CLASS.split(/\s+/);
		expect(tokens).toContain("font-medium");
		expect(tokens).toContain("text-muted-foreground");
		expect(tokens).toContain("text-xs");
		expect(tokens.some((t) => /^p[xytblr]?-/.test(t))).toBe(false);
		expect(tokens).not.toContain("text-left");
	});

	it("is the part TABLE_HEAD_CELL_CLASS adds its inset to", () => {
		for (const token of TABLE_HEAD_LABEL_CLASS.split(/\s+/)) {
			expect(TABLE_HEAD_CELL_CLASS.split(/\s+/)).toContain(token);
		}
	});
});

describe("DataTableRow", () => {
	it("activates the whole row from the keyboard, not just the pointer", () => {
		let opened = 0;
		const { getByRole } = render(() => (
			<DataTableRow onOpen={() => opened++} openLabel="Open Clock">
				<span>Clock</span>
			</DataTableRow>
		));
		const opener = getByRole("button", { name: "Open Clock" });
		opener.focus();
		expect(document.activeElement).toBe(opener);
		opener.click();
		expect(opened).toBe(1);
	});

	it("leaves a row with no opener inert", () => {
		const { queryByRole } = render(() => (
			<DataTableRow>
				<span>Clock</span>
			</DataTableRow>
		));
		expect(queryByRole("button")).toBeNull();
		expect(queryByRole("link")).toBeNull();
	});

	it("renders a link row as a link, so middle-click and copy-address work", () => {
		const { getByRole } = render(() => (
			<DataTableRow href="/admin#widgets/w_clock" openLabel="Open Clock">
				<span>Clock</span>
			</DataTableRow>
		));
		expect(getByRole("link", { name: "Open Clock" }).getAttribute("href")).toBe(
			"/admin#widgets/w_clock",
		);
	});

	it("stacks actions above the row opener so their own click still lands", () => {
		let opened = 0;
		let retried = 0;
		const { getByRole } = render(() => (
			<DataTableRow
				onOpen={() => opened++}
				openLabel="Open Aurora"
				actions={
					<button type="button" onClick={() => retried++}>
						Retry
					</button>
				}
			>
				<span>Aurora</span>
			</DataTableRow>
		));
		getByRole("button", { name: "Retry" }).click();
		expect(retried).toBe(1);
		expect(opened).toBe(0);
	});
});

describe("DataTableHead", () => {
	it("sticks only when asked", () => {
		const plain = render(() => <DataTableHead>{<span>Name</span>}</DataTableHead>);
		expect(plain.container.firstElementChild?.className).not.toContain("sticky");
		cleanup();
		const stuck = render(() => <DataTableHead sticky>{<span>Name</span>}</DataTableHead>);
		expect(stuck.container.firstElementChild?.className).toContain("sticky");
	});
});
