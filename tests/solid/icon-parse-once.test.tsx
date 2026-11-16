/* An icon body is parsed once and every Icon showing it gets its own copy of the nodes. */
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Icon, provideIcons } from "../../src/solid/icon.js";
import { createBodyParseCache } from "../../src/solid/icon-nodes.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const pathBody = (n: number) => `<path d="M${n} 0h1"></path>`;
const icon = (n: number) => ({ body: pathBody(n), width: 24, height: 24 });

function countingParse() {
  const parsed: string[] = [];
  const parse = (body: string) => {
    parsed.push(body);
    const holder = document.createElementNS(SVG_NAMESPACE, "svg");
    holder.innerHTML = body;
    return holder;
  };
  return { parsed, parse };
}

const markup = (nodes: Node[]) =>
  nodes.map((node) => (node instanceof Element ? node.outerHTML : (node.textContent ?? "")));

afterEach(() => {
  cleanup();
  provideIcons({ bundled: {} });
});

describe("Icon nodes", () => {
  it("gives two instances of one icon the same markup in separate nodes", () => {
    provideIcons({ bundled: { "t:one": icon(1) } });
    const { container } = render(() => (
      <>
        <Icon icon="t:one" />
        <Icon icon="t:one" />
      </>
    ));
    const [first, second] = [...container.querySelectorAll("svg")];
    expect(first?.innerHTML).toBe(pathBody(1));
    expect(second?.innerHTML).toBe(pathBody(1));
    expect(first?.firstChild).not.toBe(second?.firstChild);
    expect(first?.firstElementChild?.namespaceURI).toBe(SVG_NAMESPACE);
  });

  it("leaves the other instances alone when one instance's nodes change", () => {
    provideIcons({ bundled: { "t:one": icon(1) } });
    const { container } = render(() => (
      <>
        <Icon icon="t:one" />
        <Icon icon="t:one" />
      </>
    ));
    const [first, second] = [...container.querySelectorAll("svg")];
    const mutated = first?.firstElementChild;
    mutated?.setAttribute("d", "M9 9");
    mutated?.setAttribute("data-touched", "yes");
    first?.firstChild?.remove();
    expect(first?.innerHTML).toBe("");
    expect(second?.innerHTML).toBe(pathBody(1));

    const { container: later } = render(() => <Icon icon="t:one" />);
    expect(later.querySelector("svg")?.innerHTML).toBe(pathBody(1));
  });

  it("swaps the nodes when the icon prop changes", () => {
    provideIcons({ bundled: { "t:one": icon(1), "t:two": icon(2) } });
    const [name, setName] = createSignal("t:one");
    const { container } = render(() => <Icon icon={name()} />);
    const svg = container.querySelector("svg");
    expect(svg?.innerHTML).toBe(pathBody(1));
    setName("t:two");
    expect(svg?.innerHTML).toBe(pathBody(2));
    expect(container.querySelector("svg")).toBe(svg);
    setName("t:one");
    expect(svg?.innerHTML).toBe(pathBody(1));
  });

  it("keeps every body correct across more distinct icons than the cache holds", () => {
    const count = 1200;
    const bundled = Object.fromEntries(
      Array.from({ length: count }, (_, n) => [`t:${n}`, icon(n)]),
    );
    provideIcons({ bundled });
    const { container } = render(() => (
      <>
        {Array.from({ length: count }, (_, n) => (
          <Icon icon={`t:${n}`} />
        ))}
      </>
    ));
    const bodies = [...container.querySelectorAll("svg")].map((svg) => svg.innerHTML);
    expect(bodies).toEqual(Array.from({ length: count }, (_, n) => pathBody(n)));

    const { container: again } = render(() => <Icon icon="t:0" />);
    expect(again.querySelector("svg")?.innerHTML).toBe(pathBody(0));
  });
});

describe("createBodyParseCache", () => {
  it("parses each distinct body once", () => {
    const { parsed, parse } = countingParse();
    const cache = createBodyParseCache(4, parse);
    cache.nodes(pathBody(1));
    cache.nodes(pathBody(1));
    cache.nodes(pathBody(2));
    cache.nodes(pathBody(1));
    expect(parsed).toEqual([pathBody(1), pathBody(2)]);
  });

  it("hands out a fresh copy on every call", () => {
    const cache = createBodyParseCache(4, countingParse().parse);
    const [first] = cache.nodes(pathBody(1));
    const [second] = cache.nodes(pathBody(1));
    expect(first).not.toBe(second);
    expect(markup([first as Node])).toEqual(markup([second as Node]));
    (first as Element).setAttribute("d", "M0 0");
    expect(markup(cache.nodes(pathBody(1)))).toEqual([pathBody(1)]);
  });

  it("returns nothing for an empty body and parses nothing", () => {
    const { parsed, parse } = countingParse();
    const cache = createBodyParseCache(4, parse);
    expect(cache.nodes("")).toEqual([]);
    expect(parsed).toEqual([]);
  });

  it("keeps text between elements", () => {
    const body = `<g>a</g> <g>b</g>`;
    const cache = createBodyParseCache(4, countingParse().parse);
    expect(markup(cache.nodes(body))).toEqual(["<g>a</g>", " ", "<g>b</g>"]);
  });

  it("holds no more than its limit and drops the oldest first", () => {
    const { parsed, parse } = countingParse();
    const cache = createBodyParseCache(3, parse);
    for (const n of [1, 2, 3, 4, 5]) cache.nodes(pathBody(n));
    expect(parsed).toHaveLength(5);

    cache.nodes(pathBody(5));
    cache.nodes(pathBody(4));
    cache.nodes(pathBody(3));
    expect(parsed).toHaveLength(5);

    expect(markup(cache.nodes(pathBody(1)))).toEqual([pathBody(1)]);
    expect(parsed).toHaveLength(6);
    expect(parsed.at(-1)).toBe(pathBody(1));

    cache.nodes(pathBody(4));
    cache.nodes(pathBody(5));
    expect(parsed).toHaveLength(6);

    cache.nodes(pathBody(2));
    expect(parsed).toHaveLength(7);
    cache.nodes(pathBody(4));
    expect(parsed).toHaveLength(8);
  });

  it("caches nothing for a body whose parse fails", () => {
    let failing = true;
    const attempts: string[] = [];
    const cache = createBodyParseCache(4, (body) => {
      attempts.push(body);
      if (failing) throw new Error("rejected");
      const holder = document.createElementNS(SVG_NAMESPACE, "svg");
      holder.innerHTML = body;
      return holder;
    });
    expect(() => cache.nodes(pathBody(1))).toThrow("rejected");
    failing = false;
    expect(markup(cache.nodes(pathBody(1)))).toEqual([pathBody(1)]);
    expect(attempts).toEqual([pathBody(1), pathBody(1)]);
  });
});
