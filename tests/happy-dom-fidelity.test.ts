import { afterEach, describe, expect, it } from "vitest";
import { installHappyDomFidelity, shadowOf } from "../src/testing/index.js";

installHappyDomFidelity();

afterEach(() => {
  document.body.replaceChildren();
});

function rootWith(mode: ShadowRootMode) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = host.attachShadow({ mode });
  const button = document.createElement("button");
  root.appendChild(button);
  return { host, root, button };
}

function seenAt(at: EventTarget, dispatch: () => void) {
  const seen: { target: EventTarget | null; path: EventTarget[] }[] = [];
  const listen = (e: Event) => seen.push({ target: e.target, path: e.composedPath() });
  at.addEventListener("click", listen);
  dispatch();
  at.removeEventListener("click", listen);
  return seen;
}

const click = () => new MouseEvent("click", { bubbles: true, composed: true });

describe.each(["open", "closed"] as const)("a %s shadow root", (mode) => {
  it("shows a listener on the document the host as the target", () => {
    const { host, button } = rootWith(mode);
    const [seen] = seenAt(document, () => button.dispatchEvent(click()));
    expect(seen?.target).toBe(host);
  });

  it("shows a listener inside the root the inner target", () => {
    const { root, button } = rootWith(mode);
    const [seen] = seenAt(root, () => button.dispatchEvent(click()));
    expect(seen?.target).toBe(button);
    expect(seen?.path[0]).toBe(button);
  });

  it("leaves the host as the target once a composed event is dispatched", () => {
    const { host, button } = rootWith(mode);
    const event = click();
    button.dispatchEvent(event);
    expect(event.target).toBe(host);
    expect(event.composedPath()).toEqual([]);
  });

  it("clears the target of an uncomposed event once it is dispatched", () => {
    const { button } = rootWith(mode);
    const event = new Event("ping", { bubbles: true });
    button.dispatchEvent(event);
    expect(event.target).toBeNull();
  });

  it("retargets the document's active element to the host", () => {
    const { host, root, button } = rootWith(mode);
    button.focus();
    expect(document.activeElement).toBe(host);
    expect(root.activeElement).toBe(button);
  });

  it("records the root without changing its mode", () => {
    const { host, root } = rootWith(mode);
    expect(shadowOf(host)).toBe(root);
    expect(root.mode).toBe(mode);
    expect(host.shadowRoot).toBe(mode === "open" ? root : null);
  });
});

it("hides a closed root's nodes from the document's composed path", () => {
  const { host, root, button } = rootWith("closed");
  const [seen] = seenAt(document, () => button.dispatchEvent(click()));
  expect(seen?.path).not.toContain(button);
  expect(seen?.path).not.toContain(root);
  expect(seen?.path[0]).toBe(host);
});

it("shows an open root's nodes on the document's composed path", () => {
  const { root, button } = rootWith("open");
  const [seen] = seenAt(document, () => button.dispatchEvent(click()));
  expect(seen?.path.slice(0, 2)).toEqual([button, root]);
});

it("shows a listener in an outer closed root the nested host, never the inner node", () => {
  const outer = rootWith("closed");
  const innerHost = document.createElement("div");
  outer.root.appendChild(innerHost);
  const inner = innerHost.attachShadow({ mode: "closed" });
  const button = document.createElement("button");
  inner.appendChild(button);
  const [seen] = seenAt(outer.root, () => button.dispatchEvent(click()));
  expect(seen?.target).toBe(innerHost);
  expect(seen?.path).not.toContain(button);
  expect(seen?.path).toContain(innerHost);
});
