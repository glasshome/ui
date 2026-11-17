import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { layerStack } from "../../src/lib/behavior/layer-stack.js";
import { MOTION_EXIT_MS } from "../../src/lib/motion-classes.js";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../src/solid/index.js";
import { useFakeTime } from "../../src/testing/index.js";
import { input } from "../harness/input.js";
import { settle } from "../harness/mount.js";

afterEach(cleanup);

const OPEN_DELAY_MS = 700;
const CLOSE_DELAY_MS = 300;

describe("HoverCard layer", () => {
  it("leaves nothing on the layer stack once it has closed", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const view = render(() => (
      <HoverCard>
        <HoverCardTrigger href="#who">Who</HoverCardTrigger>
        <HoverCardContent>Card</HoverCardContent>
      </HoverCard>
    ));
    const trigger = view.getByText("Who");
    await input.hover(trigger);
    await vi.advanceTimersByTimeAsync(OPEN_DELAY_MS);
    await settle();
    expect(document.body.textContent).toContain("Card");
    expect(layerStack.layers()).toHaveLength(1);

    await input.hover(document.body);
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS + MOTION_EXIT_MS.overlay);
    await settle();
    expect(document.body.textContent).not.toContain("Card");
    expect(layerStack.layers()).toHaveLength(0);
  });
});
