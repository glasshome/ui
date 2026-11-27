import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { InputOTP, InputOTPSlot } from "../../src/solid/input-otp.js";

afterEach(cleanup);

function slots(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-slot="input-otp-slot"]')].map(
    (slot) => slot.textContent ?? "",
  );
}

describe("InputOTP", () => {
  it("follows a controlled value without an untracked read", () => {
    const [code, setCode] = createSignal("12");
    const { container } = render(() => (
      <InputOTP maxLength={3} value={code()}>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTP>
    ));
    expect(slots(container)).toEqual(["1", "2", ""]);
    setCode("345");
    flush();
    expect(slots(container)).toEqual(["3", "4", "5"]);
  });

  it("keeps what is typed when it is uncontrolled", async () => {
    const onComplete = vi.fn();
    const { container } = render(() => (
      <InputOTP maxLength={2} onComplete={onComplete}>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTP>
    ));
    const input = container.querySelector("input");
    if (!input) throw new Error("no input");
    input.focus();
    await userEvent.keyboard("78");
    flush();
    expect(slots(container)).toEqual(["7", "8"]);
    expect(onComplete).toHaveBeenCalledWith("78");
  });
});
