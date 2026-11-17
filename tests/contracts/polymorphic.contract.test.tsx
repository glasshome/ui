import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Polymorphic } from "../../src/lib/behavior/polymorphic";
import { mountScenario } from "../harness/mount";

afterEach(cleanup);

describe("polymorphic contract", () => {
  it("AS1 without as it renders defaultAs with every other prop", async () => {
    const { root } = await mountScenario("polymorphic", "default");
    const part = root.querySelector("[data-slot=part]");
    expect(part?.tagName).toBe("BUTTON");
    expect(part?.textContent).toBe("Open");

    const { container } = render(() => (
      <Polymorphic defaultAs="section" class="x" aria-label="area" />
    ));
    const section = container.firstElementChild;
    expect(section?.tagName).toBe("SECTION");
    expect(section?.getAttribute("class")).toBe("x");
    expect(section?.getAttribute("aria-label")).toBe("area");
  });

  it("AS2 as swaps a tag or a component and neither prop reaches the DOM", async () => {
    const { root } = await mountScenario("polymorphic", "as-link");
    const link = root.querySelector("[data-slot=part]");
    expect(link?.tagName).toBe("A");
    expect(link?.hasAttribute("type")).toBe(false);
    expect(link?.hasAttribute("as")).toBe(false);
    expect(link?.hasAttribute("defaultas")).toBe(false);

    const Card = (props: { title?: string }) => <article data-title={props.title} />;
    const { container } = render(() => <Polymorphic defaultAs="div" as={Card} title="hello" />);
    const article = container.firstElementChild;
    expect(article?.tagName).toBe("ARTICLE");
    expect(article?.getAttribute("data-title")).toBe("hello");
    expect(article?.hasAttribute("as")).toBe(false);
    expect(article?.hasAttribute("defaultas")).toBe(false);
  });

  it("AS3 a button gets type=button, any other element gets none", () => {
    const { container } = render(() => (
      <>
        <Polymorphic defaultAs="button" />
        <Polymorphic defaultAs="button" type="submit" />
        <Polymorphic defaultAs="button" as="a" href="#x" />
        <Polymorphic defaultAs="div" />
      </>
    ));
    const [plain, submit, link, div] = Array.from(container.children);
    expect(plain?.getAttribute("type")).toBe("button");
    expect(submit?.getAttribute("type")).toBe("submit");
    expect(link?.hasAttribute("type")).toBe(false);
    expect(div?.hasAttribute("type")).toBe(false);
  });

  it("AS4 a ref receives the rendered element", () => {
    let seen: HTMLElement | undefined;
    const { container } = render(() => (
      <Polymorphic defaultAs="button" ref={(el: HTMLElement) => (seen = el)} />
    ));
    expect(seen).toBe(container.firstElementChild);
    expect(seen?.tagName).toBe("BUTTON");
  });
});
