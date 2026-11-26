import { flush } from "solid-js";
import { describe, expect, it } from "vitest";
import { createSlot } from "../../src/lib/behavior/slot.js";

describe("createSlot", () => {
  it("keeps the new holder when the old one releases in the same tick", () => {
    const [value, set, release] = createSlot<string>();
    set("old");
    flush();
    set("new");
    release("old");
    flush();
    expect(value()).toBe("new");
  });

  it("clears when its holder releases", () => {
    const [value, set, release] = createSlot<string>();
    set("only");
    release("only");
    flush();
    expect(value()).toBeUndefined();
  });
});
