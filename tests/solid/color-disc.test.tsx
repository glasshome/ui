import { parseColor } from "@kobalte/core/colors";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { ColorDisc, TemperatureBar } from "../../src/solid/color-disc.js";

afterEach(cleanup);

describe("ColorDisc", () => {
  it("turns the hue with left and right and the saturation with up and down", async () => {
    const seen: string[] = [];
    render(() => (
      <ColorDisc
        value={parseColor("hsb(100, 50%, 100%)")}
        onChange={(c) => seen.push(c.toString("hsb"))}
      />
    ));
    const thumb = screen.getByRole("slider", { name: "Colour" });

    thumb.focus();
    await userEvent.keyboard("{Shift>}{ArrowRight}{ArrowUp}{/Shift}");

    expect(seen[0]).toMatch(/hsb\(110,? 50%/);
    expect(seen[1]).toMatch(/hsb\(100,? 60%/);
  });
});

describe("TemperatureBar", () => {
  it("steps its Kelvin from the keyboard", async () => {
    const onChange = vi.fn();
    render(() => <TemperatureBar value={2700} onChange={onChange} />);

    screen.getByRole("slider", { name: "White" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith(2800);
  });
});
