import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../../src/solid/input.js";
import { Switch } from "../../src/solid/switch.js";
import { press } from "../press.js";

afterEach(cleanup);

describe("Switch busy", () => {
  it("ignores a press and stays focusable while its own work runs", async () => {
    const onChange = vi.fn();
    const view = render(() => <Switch checked busy onChange={onChange} />);
    const el = view.getByRole("switch");
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    expect((el as HTMLButtonElement).disabled).toBe(false);
    el.focus();
    await press(el, { force: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(el.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(el);
  });

  it("toggles as usual when not busy", async () => {
    const onChange = vi.fn();
    const view = render(() => <Switch busy={false} onChange={onChange} />);
    const el = view.getByRole("switch");
    expect(el.hasAttribute("aria-busy")).toBe(false);
    await press(el);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("Input busy", () => {
  it("keeps focus and refuses edits while its own work runs", () => {
    const view = render(() => <Input busy value="kitchen" />);
    const el = view.getByRole("textbox") as HTMLInputElement;
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.readOnly).toBe(true);
    expect(el.disabled).toBe(false);
    el.focus();
    expect(document.activeElement).toBe(el);
  });

  it("is editable when not busy", () => {
    const view = render(() => <Input busy={false} />);
    const el = view.getByRole("textbox") as HTMLInputElement;
    expect(el.readOnly).toBe(false);
    expect(el.hasAttribute("aria-busy")).toBe(false);
  });

  it("keeps a caller's readOnly when not busy", () => {
    const view = render(() => <Input readOnly />);
    expect((view.getByRole("textbox") as HTMLInputElement).readOnly).toBe(true);
  });
});
