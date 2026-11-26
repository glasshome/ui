import { render } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { describe, expect, it } from "vitest";
import { Polymorphic } from "../../src/lib/behavior/polymorphic.js";

describe("Polymorphic", () => {
  it("a button defaults to type button, and a caller's type wins", () => {
    const { container } = render(() => (
      <>
        <Polymorphic defaultAs="button">plain</Polymorphic>
        <Polymorphic defaultAs="button" type="submit">
          send
        </Polymorphic>
        <Polymorphic defaultAs="button" as="a" href="#x">
          link
        </Polymorphic>
      </>
    ));
    const [plain, send] = container.querySelectorAll("button");
    expect(plain?.getAttribute("type")).toBe("button");
    expect(send?.getAttribute("type")).toBe("submit");
    expect(container.querySelector("a")?.hasAttribute("type")).toBe(false);
  });

  it("a reactive as swaps the element and its default type", () => {
    const [tag, setTag] = createSignal<"a" | "button">("a");
    const { container } = render(() => (
      <Polymorphic defaultAs="div" as={tag()} class="part">
        x
      </Polymorphic>
    ));
    expect(container.querySelector("a.part")?.hasAttribute("type")).toBe(false);
    setTag("button");
    flush();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("button.part")?.getAttribute("type")).toBe("button");
  });
});
