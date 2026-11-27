import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { GlassToast } from "../../src/solid/sonner.js";

afterEach(cleanup);

type Kind = "loading" | "success" | "error";

function mount(first: Kind) {
  const [kind, setKind] = createSignal<Kind>(first);
  render(() => <GlassToast kind={kind()} title="Saving the board" />);
  const toast = () =>
    screen.getByText("Saving the board").closest<HTMLElement>("[data-slot=toast]");
  return { setKind, toast };
}

describe("GlassToast", () => {
  it("takes the tone of a kind that changes after it mounts", () => {
    const { setKind, toast } = mount("loading");
    expect(toast()?.style.getPropertyValue("--glass-tone")).toBe("");

    setKind("success");
    flush();
    expect(toast()?.style.getPropertyValue("--glass-tone")).toBe("var(--success)");
    expect(toast()?.querySelector("[aria-hidden=true] svg")).not.toBeNull();

    setKind("error");
    flush();
    expect(toast()?.style.getPropertyValue("--glass-tone")).toBe("var(--destructive)");
  });
});
