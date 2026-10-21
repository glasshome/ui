import { cleanup, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { copyImage, copyText } from "../../src/lib/clipboard.js";
import { CopyButton } from "../../src/solid/copy-button.js";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "../../src/solid/dialog.js";

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

// A plain-http page: no Clipboard API at all. Chromium serves the test page from localhost, a secure context.
function onPlainHttp() {
  setClipboard(undefined);
}

async function fromClick<T>(act: () => Promise<T>): Promise<T> {
  const button = document.body.appendChild(document.createElement("button"));
  button.textContent = "Copy";
  let result: Promise<T> | undefined;
  button.addEventListener("click", () => (result = act()), { once: true });
  await userEvent.click(button);
  button.remove();
  if (!result) throw new Error("the click never reached the button");
  return result;
}

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(document, "execCommand");
});

describe("copyText", () => {
  it("writes through the Clipboard API where there is one", async () => {
    expect(await fromClick(() => copyText("hello"))).toBe(true);
    expect(await navigator.clipboard.readText()).toBe("hello");
  });

  it("copies a selection on plain http, where the API is missing", async () => {
    onPlainHttp();
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
    onPlainHttp();
    setClipboard({ writeText: vi.fn(async () => Promise.reject(new Error("denied"))) });
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    expect(await copyText("x")).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("reports a failed selection copy", async () => {
    onPlainHttp();
    document.execCommand = vi.fn(() => false);
    expect(await copyText("x")).toBe(false);
  });

  it("copies from inside an open dialog and gives focus back", async () => {
    onPlainHttp();
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
  it("hands the pending text to a ClipboardItem so the write keeps the gesture", async () => {
    expect(await fromClick(() => copyText(Promise.resolve("page markdown")))).toBe(true);
    expect(await navigator.clipboard.readText()).toBe("page markdown");
  });

  it("waits for the text and copies a selection where there is no ClipboardItem", async () => {
    onPlainHttp();
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    expect(await copyText(Promise.resolve("late"))).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("reports text that never arrived", async () => {
    const exec = vi.spyOn(document, "execCommand");

    expect(await fromClick(() => copyText(Promise.reject(new Error("offline"))))).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });
});

describe("copyImage", () => {
  it("says no where there is no image clipboard", async () => {
    onPlainHttp();
    expect(await copyImage(Promise.resolve(new Blob()))).toBe(false);
  });
});

describe("CopyButton", () => {
  it("shows the check only once the copy landed", async () => {
    render(() => <CopyButton text="code" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy());
    expect(await navigator.clipboard.readText()).toBe("code");
  });

  it("stays a copy button when the copy failed", async () => {
    onPlainHttp();
    const exec = vi.fn(() => false);
    document.execCommand = exec;
    render(() => <CopyButton text="code" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    await waitFor(() => expect(exec).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeTruthy();
  });
});
