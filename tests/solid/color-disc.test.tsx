import { parseColor } from "@kobalte/core/colors";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorDisc, TemperatureBar } from "../../src/solid/color-disc.js";

afterEach(cleanup);

describe("ColorDisc", () => {
	it("turns the hue with left and right and the saturation with up and down", () => {
		const seen: string[] = [];
		render(() => (
			<ColorDisc
				value={parseColor("hsb(100, 50%, 100%)")}
				onChange={(c) => seen.push(c.toString("hsb"))}
			/>
		));
		const thumb = screen.getByRole("slider", { name: "Colour" });

		fireEvent.keyDown(thumb, { key: "ArrowRight", shiftKey: true });
		fireEvent.keyDown(thumb, { key: "ArrowUp", shiftKey: true });

		expect(seen[0]).toMatch(/hsb\(110,? 50%/);
		expect(seen[1]).toMatch(/hsb\(100,? 60%/);
	});
});

describe("TemperatureBar", () => {
	it("steps its Kelvin from the keyboard", () => {
		const onChange = vi.fn();
		render(() => <TemperatureBar value={2700} onChange={onChange} />);

		fireEvent.keyDown(screen.getByRole("slider", { name: "White" }), { key: "ArrowRight" });

		expect(onChange).toHaveBeenCalledWith(2800);
	});
});
