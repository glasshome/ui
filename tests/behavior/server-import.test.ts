import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dir = resolve(import.meta.dirname, "../../src/lib/behavior");
const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f));

describe("server render", () => {
  // test-change-ok cold transforms of every module, run while the browser projects launch and transform beside it
  it("imports every lib/behavior module without a document", { timeout: 30_000 }, async () => {
    expect(typeof document).toBe("undefined");
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) await import(/* @vite-ignore */ join(dir, file));
  });
});
