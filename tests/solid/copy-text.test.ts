import { afterEach, describe, expect, it, vi } from "vitest";

import { copyText } from "../../src/lib/copy-text.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("copyText", () => {
  it("uses the async clipboard where the page is a secure context", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyText("abc")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("abc");
  });

  it("falls back to a selection copy on plain http, where navigator.clipboard is undefined", async () => {
    vi.stubGlobal("navigator", {});
    const exec = vi.fn(() => true);
    document.execCommand = exec;
    expect(await copyText("abc")).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
