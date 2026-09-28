import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "../../src/solid/password-input.js";

function parts(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>("input");
  const toggle = container.querySelector<HTMLButtonElement>('[data-slot="password-input-toggle"]');
  if (!input || !toggle) throw new Error("password input did not render its parts");
  return { input, toggle };
}

describe("PasswordInput", () => {
  it("starts masked and reveals on toggle without swapping the button for something else", () => {
    const { container } = render(() => <PasswordInput aria-label="Password" />);
    const { input, toggle } = parts(container);

    expect(input.type).toBe("password");
    expect(toggle.getAttribute("aria-label")).toBe("Show password");

    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(toggle.getAttribute("aria-label")).toBe("Hide password");

    fireEvent.click(toggle);
    expect(input.type).toBe("password");
    expect(toggle.getAttribute("aria-label")).toBe("Show password");
  });

  it("is a real button, so it never submits the surrounding form", () => {
    const { container } = render(() => <PasswordInput aria-label="Password" />);
    expect(parts(container).toggle.type).toBe("button");
  });

  it("reserves right padding for the toggle regardless of visibility state", () => {
    const { container } = render(() => <PasswordInput aria-label="Password" />);
    const { input, toggle } = parts(container);
    expect(input.className).toContain("pr-10");
    fireEvent.click(toggle);
    expect(input.className).toContain("pr-10");
  });

  it("only pads for a leading icon when one is given", () => {
    const bare = render(() => <PasswordInput aria-label="Password" />);
    expect(parts(bare.container).input.className).not.toContain("pl-10");

    const withLeading = render(() => (
      <PasswordInput aria-label="Password" leading={<span data-testid="lock" />} />
    ));
    expect(parts(withLeading.container).input.className).toContain("pl-10");
    expect(withLeading.getByTestId("lock")).toBeTruthy();
  });

  it("accepts custom reveal labels", () => {
    const { container } = render(() => (
      <PasswordInput aria-label="Password" showLabel="Reveal" hideLabel="Conceal" />
    ));
    const { toggle } = parts(container);
    expect(toggle.getAttribute("aria-label")).toBe("Reveal");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-label")).toBe("Conceal");
  });
});
