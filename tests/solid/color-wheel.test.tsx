/* Kobalte reads ColorWheel's `thickness` as a percentage of the radius and
 * turns it into the track's mask radius; the default is derived from the px
 * thumb riding the ring, so a small wheel can ask for more than the range
 * holds. */
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { ColorWheel } from "../../src/solid/color-wheel.js";

afterEach(cleanup);

function maskInnerStop(container: HTMLElement) {
	const track = container.querySelector<HTMLElement>('[data-slot="color-wheel-track"]');
	if (!track) throw new Error("color wheel track did not render");
	const mask = track.getAttribute("style")?.match(/mask:\s*radial-gradient\(#0000\s+(-?[\d.]+)%/);
	if (!mask?.[1]) throw new Error(`no mask radius in: ${track.getAttribute("style")}`);
	return Number(mask[1]);
}

describe("ColorWheel ring", () => {
	it("leaves a hole at the default size", () => {
		const { container } = render(() => <ColorWheel />);
		expect(maskInnerStop(container)).toBeGreaterThan(0);
	});

	it("still leaves a hole on a wheel too small for a full-width thumb", () => {
		const { container } = render(() => <ColorWheel size={40} />);
		expect(maskInnerStop(container)).toBeGreaterThanOrEqual(0);
	});

	it("takes a caller's own thickness untouched", () => {
		const { container } = render(() => <ColorWheel size={40} thickness={20} />);
		expect(maskInnerStop(container)).toBeCloseTo(70 - 14, 5);
	});
});
