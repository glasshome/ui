import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, it } from "vitest";
import { HeroAction } from "../../src/solid/hero-action.js";

afterEach(cleanup);

it("HeroAction carries its tone on the surface, not only the title", () => {
	const { container } = render(() => (
		<HeroAction
			icon="lucide:play"
			title="Demo"
			description="No setup"
			accentVar="oklch(0.7 0.14 300)"
			onClick={() => {}}
		/>
	));
	const cls = container.querySelector('[data-slot="hero-action"]')?.className ?? "";
	expect(cls).toContain("[--glass-wash:20%]");
	expect(cls).toContain("hover:[--glass-wash:30%]");
	expect(cls).not.toMatch(/shadow-\[/);
});
