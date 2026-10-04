import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HOLD_GRACE_MS, HOLD_MS } from "../../src/lib/hold.js";

const here = dirname(fileURLToPath(import.meta.url));
const theme = readFileSync(resolve(here, "../../src/styles/theme.css"), "utf8");

describe("the hold fill", () => {
  it("completes as the hold fires", () => {
    const declared = /--duration-hold:\s*(\d+)ms;/.exec(theme)?.[1];
    expect(Number(declared)).toBe(HOLD_MS - HOLD_GRACE_MS);
  });
});
