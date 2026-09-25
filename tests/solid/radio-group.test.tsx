import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "../../src/solid/radio-group.js";

afterEach(cleanup);

it("the picked radio is a filled tone with a centre dot", () => {
	const { container } = render(() => (
		<RadioGroup value="a" onChange={() => {}}>
			<RadioGroupItem value="a">Comfortable</RadioGroupItem>
			<RadioGroupItem value="b">Compact</RadioGroupItem>
		</RadioGroup>
	));
	const indicator = container.querySelector('[data-slot="radio-group-item-indicator"]');
	expect(indicator?.className).toContain("[--glass-wash:90%]");
	expect(indicator?.querySelector('[data-slot="radio-group-item-dot"]')).not.toBeNull();
});

it("renders no dot when the control is hidden", () => {
	const { container } = render(() => (
		<RadioGroup value="a" onChange={() => {}}>
			<RadioGroupItem value="a" showControl={false}>
				Card
			</RadioGroupItem>
		</RadioGroup>
	));
	expect(container.querySelector('[data-slot="radio-group-item-dot"]')).toBeNull();
});
