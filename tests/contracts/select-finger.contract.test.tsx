import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { settle } from "../harness/mount";
import { mount, TRIGGER } from "./select-parts";

afterEach(cleanup);

describe("Select contract, finger", () => {
  it("S16 a touch that moves past the slop picks nothing, a still tap picks", async () => {
    const { trigger, option, listboxes, run, closed } = await mount();
    await run({ press: TRIGGER });
    const banana = option("Banana").getBoundingClientRect();
    const x = banana.x + banana.width / 2;
    const y = banana.y + banana.height / 2;
    await commands.touch("down", x, y);
    await commands.touch("move", x, y + 12);
    await commands.touch("move", x, y + 24);
    await commands.touch("up", x, y + 24);
    await settle();
    expect(listboxes(), "list still open after the moved press").toHaveLength(1);
    expect(trigger().textContent).toContain("Pick one");

    await commands.touch("down", x, y);
    await commands.touch("up", x, y);
    await closed();
    expect(trigger().textContent).toContain("Banana");
  });
});
