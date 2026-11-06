import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buttonVariants } from "../../src/lib/button-variants.js";
import { Button, ButtonWell } from "../../src/solid/button.js";

afterEach(cleanup);

describe("Button xl", () => {
  it("is a tall pill that lays out a well and two text lines", () => {
    const view = render(() => (
      <Button size="xl">
        <ButtonWell icon="lucide:download" />
        <span>Install GlassHome</span>
      </Button>
    ));
    const cls = view.getByRole("button").className;
    expect(cls).toContain("h-[72px]");
    expect(cls).toContain("rounded-full");
    expect(cls).toContain("text-left");
  });

  it("renders the well as its own slot", () => {
    const { container } = render(() => (
      <Button size="xl">
        <ButtonWell icon="lucide:download" />
        Go
      </Button>
    ));
    const well = container.querySelector('[data-slot="button-well"]');
    expect(well).not.toBeNull();
    expect(well?.className).toContain("rounded-full");
  });
});

describe("filled buttons are lit", () => {
  it.each(["default", "secondary", "destructive"] as const)(
    "%s carries its tone at strength and full-contrast text",
    (variant) => {
      const cls = buttonVariants({ variant });
      expect(cls).toContain("[--glass-text:0%]");
      expect(cls).toContain("[--glass-wash:55%]");
      expect(cls).toContain("dark:[--glass-wash:62%]");
      expect(cls).not.toMatch(/text-white|shadow-\[/);
    },
  );

  it("leaves outline and ghost quiet", () => {
    expect(buttonVariants({ variant: "outline" })).not.toContain("--glass-wash:55%");
    expect(buttonVariants({ variant: "ghost" })).not.toContain("--glass-wash");
  });
});

describe("Button busy", () => {
  it("keeps the focus it holds when its work starts", async () => {
    const [busy, setBusy] = createSignal(false);
    const view = render(() => <Button busy={busy()}>Upload</Button>);
    const button = view.getByRole("button");
    button.focus();
    setBusy(true);
    await Promise.resolve();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  it("ignores a press while busy and answers one after", () => {
    const [busy, setBusy] = createSignal(true);
    const onClick = vi.fn();
    const view = render(() => (
      <Button busy={busy()} onClick={onClick}>
        Save
      </Button>
    ));
    view.getByRole("button").click();
    expect(onClick).not.toHaveBeenCalled();
    setBusy(false);
    view.getByRole("button").click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not submit its form while busy", () => {
    const onSubmit = vi.fn((e: SubmitEvent) => e.preventDefault());
    const view = render(() => (
      <form onSubmit={onSubmit}>
        <Button type="submit" busy>
          Save
        </Button>
      </form>
    ));
    view.getByRole("button").click();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
