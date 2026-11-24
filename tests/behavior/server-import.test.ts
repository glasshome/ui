import { describe, expect, it } from "vitest";

// Eager glob loads at collection, which has no timeout, so a loaded machine slows the suite without failing it.
const modules = import.meta.glob("../../src/lib/behavior/*.{ts,tsx}", { eager: true });

describe("server render", () => {
  it("every module in src/lib/behavior imports without a document", () => {
    expect(typeof document).toBe("undefined");
    expect(Object.keys(modules).length).toBeGreaterThan(0);
  });
});
