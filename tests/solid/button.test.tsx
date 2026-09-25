import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { buttonVariants } from "../../src/lib/button-variants.js";
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

describe("filled buttons are lit", () => {
	it.each([
		"default",
		"secondary",
		"destructive",
	] as const)("%s carries its tone at strength and full-contrast text", (variant) => {
		const cls = buttonVariants({ variant });
		expect(cls).toContain("[--glass-text:0%]");
		expect(cls).toContain("[--glass-wash:55%]");
		expect(cls).toContain("dark:[--glass-wash:62%]");
		expect(cls).not.toMatch(/text-white|shadow-\[/);
	});

	it("leaves outline and ghost quiet", () => {
		expect(buttonVariants({ variant: "outline" })).not.toContain("--glass-wash:55%");
		expect(buttonVariants({ variant: "ghost" })).not.toContain("--glass-wash");
	});
});
