import { cleanup, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyImage, copyText } from "../../src/lib/clipboard.js";
import { CopyButton } from "../../src/solid/copy-button.js";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "../../src/solid/dialog.js";

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

beforeEach(() => {
  // A plain-http page: no Clipboard API at all.
  setClipboard(undefined);
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(document, "execCommand");
});

describe("copyText", () => {
  it("writes through the Clipboard API where there is one", async () => {
    const writeText = vi.fn(async () => {});
    setClipboard({ writeText });

    expect(await copyText("hello")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("copies a selection on plain http, where the API is missing", async () => {
    let selected = "";
    document.execCommand = vi.fn(() => {
      const area = document.activeElement as HTMLTextAreaElement;
      selected = area.value;
      return true;
    });

    expect(await copyText("from http")).toBe(true);
    expect(selected).toBe("from http");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("falls back to the selection when the API refuses", async () => {
    setClipboard({ writeText: vi.fn(async () => Promise.reject(new Error("denied"))) });
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    expect(await copyText("x")).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("reports a failed selection copy", async () => {
    document.execCommand = vi.fn(() => false);
    expect(await copyText("x")).toBe(false);
  });

  it("copies from inside an open dialog and gives focus back", async () => {
    let focusedInDialog = false;
    document.execCommand = vi.fn(() => {
      focusedInDialog = Boolean(document.activeElement?.closest('[data-slot="dialog-content"]'));
      return true;
    });
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Report</DialogTitle>
          <DialogBody>
            <button type="button">Inside</button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    ));
    const inside = screen.getByRole("button", { name: "Inside" });
    inside.focus();

    expect(await copyText("trapped")).toBe(true);
    expect(focusedInDialog).toBe(true);
    expect(document.activeElement).toBe(inside);
  });
});

describe("copyText with text still loading", () => {
  class FakeClipboardItem {
    constructor(readonly items: Record<string, Promise<Blob>>) {}
  }

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "ClipboardItem");
  });

  it("hands the pending text to a ClipboardItem so the write keeps the gesture", async () => {
    Object.defineProperty(globalThis, "ClipboardItem", {
      value: FakeClipboardItem,
      configurable: true,
    });
    let written: Blob | undefined;
    const write = vi.fn(async (items: FakeClipboardItem[]) => {
      written = await items[0]?.items["text/plain"];
    });
    setClipboard({ write });

    expect(await copyText(Promise.resolve("page markdown"))).toBe(true);
    expect(await written?.text()).toBe("page markdown");
  });

  it("waits for the text and copies a selection where there is no ClipboardItem", async () => {
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    expect(await copyText(Promise.resolve("late"))).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("reports text that never arrived", async () => {
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    expect(await copyText(Promise.reject(new Error("offline")))).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });
});

describe("copyImage", () => {
  it("says no where there is no image clipboard", async () => {
    expect(await copyImage(Promise.resolve(new Blob()))).toBe(false);
  });
});

describe("CopyButton", () => {
  it("shows the check only once the copy landed", async () => {
    document.execCommand = vi.fn(() => true);
    render(() => <CopyButton text="code" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy());
  });

  it("stays a copy button when the copy failed", async () => {
    const exec = vi.fn(() => false);
    document.execCommand = exec;
    render(() => <CopyButton text="code" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    await waitFor(() => expect(exec).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeTruthy();
  });
});
