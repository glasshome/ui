import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Button, ButtonWell } from "../../src/solid/button.js";

afterEach(cleanup);

describe("Button xl", () => {
	it("is a tall pill that lays out a well and two text lines", () => {
		const { getByRole } = render(() => (
			<Button size="xl">
				<ButtonWell icon="lucide:download" />
				<span>Install GlassHome</span>
			</Button>
		));
		const cls = getByRole("button").className;
		expect(cls).toContain("h-[72px]");
		expect(cls).toContain("rounded-full");
		expect(cls).toContain("text-left");
	});

	it("renders the well as its own slot", () => {
		const { container } = render(() => (
			<Button size="xl">
				<ButtonWell icon="lucide:download" />
				Go
			</Button>
		));
		const well = container.querySelector('[data-slot="button-well"]');
		expect(well).not.toBeNull();
		expect(well?.className).toContain("rounded-full");
	});
});
