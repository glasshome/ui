import { parseColor } from "@kobalte/core/colors";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorDisc, TemperatureBar } from "../../src/solid/color-disc.js";

afterEach(cleanup);

describe("ColorDisc", () => {
	it("hands back the pin tapped, so a preset is one tap", () => {
		const onPin = vi.fn();
		render(() => (
			<ColorDisc
				value={parseColor("hsb(330, 60%, 100%)")}
				pins={[{ id: "pink", color: "#ec5aa0", label: "Pink", hue: 330, saturation: 62 }]}
				onPin={onPin}
			/>
		));

		fireEvent.click(screen.getByRole("button", { name: "Pink" }));

		expect(onPin).toHaveBeenCalledWith("pink");
	});

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
	it("hands back a white pin tapped, and steps its Kelvin from the keyboard", () => {
		const onPin = vi.fn();
		const onChange = vi.fn();
		render(() => (
			<TemperatureBar
				value={2700}
				pins={[{ id: "warm", color: "#ffb35a", label: "Warm white", kelvin: 2200 }]}
				onPin={onPin}
				onChange={onChange}
			/>
		));

		fireEvent.click(screen.getByRole("button", { name: "Warm white" }));
		fireEvent.keyDown(screen.getByRole("slider", { name: "White" }), { key: "ArrowRight" });

		expect(onPin).toHaveBeenCalledWith("warm");
		expect(onChange).toHaveBeenCalledWith(2800);
	});
});
