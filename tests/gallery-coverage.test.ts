import { describe, expect, it } from "vitest";
import { ALLOW } from "../dev/coverage-allow";
import { galleryReport, type Inventory, judge } from "../scripts/check-gallery";

const inventory: Inventory = {
	exports: ["Card", "CardTitle", "CountPill", "Logo", "cardVariants"],
	components: [
		{ name: "Card", module: "card.tsx" },
		{ name: "CardTitle", module: "card.tsx" },
		{ name: "CountPill", module: "count-pill.tsx" },
		{ name: "Logo", module: "logo.tsx" },
	],
	specimens: [
		{ name: "Card", renders: ["CardTitle", "CountPill"] },
		{ name: "cardVariants", renders: [] },
	],
};

describe("judge", () => {
	it("counts a part rendered inside its own module's specimen as covered", () => {
		expect(judge(inventory, []).uncovered).not.toContain("CardTitle");
	});

	it("reports a component rendered only inside another module's specimen", () => {
		expect(judge(inventory, []).uncovered).toEqual(["CountPill", "Logo"]);
	});

	it("reports a specimen name that is not an export", () => {
		const report = judge(
			{ ...inventory, specimens: [...inventory.specimens, { name: "DataTable", renders: [] }] },
			[],
		);
		expect(report.unknownSpecimens).toEqual(["DataTable"]);
	});

	it("filters an allowed name out of both lists", () => {
		const report = judge(
			{ ...inventory, specimens: [...inventory.specimens, { name: "DataTable", renders: [] }] },
			[
				["Logo", "no asset"],
				["DataTable", "composite"],
			],
		);
		expect(report.uncovered).toEqual(["CountPill"]);
		expect(report.unknownSpecimens).toEqual([]);
	});

	it("reports an allow entry with an empty reason", () => {
		expect(judge(inventory, [["Logo", "  "]]).emptyReasons).toEqual(["Logo"]);
	});

	it("reports an allow entry that names something covered", () => {
		expect(judge(inventory, [["CardTitle", "was missing"]]).staleAllows).toEqual(["CardTitle"]);
	});
});

describe("gallery coverage", () => {
	it("every component export has a specimen and every allow entry still holds", async () => {
		expect(await galleryReport(ALLOW)).toEqual({
			uncovered: [],
			unknownSpecimens: [],
			emptyReasons: [],
			staleAllows: [],
		});
	}, 60_000);
});
