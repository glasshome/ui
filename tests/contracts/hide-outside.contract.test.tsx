import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { createHideOutside } from "../../src/lib/behavior/hide-outside";
import { registerLayer } from "../../src/lib/behavior/layer-stack";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const press = (name: string): Step => ({ press: { role: "button", name } });
const PAGE_ACTION = 'button "Page action"';

async function mount(id: string) {
  const { scope } = await mountScenario("hide-outside", id);
  return (...steps: Step[]) => runSteps(scope, steps, input, settle);
}

const ariaHidden = () =>
  Array.from(document.body.children).map((child) => [child, child.getAttribute("aria-hidden")]);

describe("hide-outside contract", () => {
  it("HO1 an open modal leaves page content out of the AX tree", async () => {
    const run = await mount("modal");
    expect(await commands.axTree()).toContain(PAGE_ACTION);
    await run(press("Open Modal"));
    const tree = await commands.axTree();
    expect(tree).not.toContain(PAGE_ACTION);
    expect(tree).not.toContain("Living room");
    expect(tree).toContain('dialog "Modal"');
  });

  it("HO2 a list opened above the modal and its options are in the AX tree", async () => {
    const run = await mount("modal");
    await run(press("Open Modal"), press("Toggle list"));
    const tree = await commands.axTree();
    expect(tree).toContain('listbox "Fruit"');
    expect(tree).toContain('option "Apple"');
    expect(tree).not.toContain(PAGE_ACTION);
  });

  it("HO3 closing restores every child's aria-hidden, an already hidden one included", async () => {
    const hidden = document.body.appendChild(document.createElement("div"));
    hidden.setAttribute("aria-hidden", "true");
    const shown = document.body.appendChild(document.createElement("div"));
    shown.setAttribute("aria-hidden", "false");
    const run = await mount("modal");
    const before = ariaHidden();
    await run(press("Open Modal"));
    expect(hidden.getAttribute("aria-hidden")).toBe("true");
    expect(shown.getAttribute("aria-hidden")).toBe("true");
    await run(press("Close Modal"));
    expect(ariaHidden().filter(([child]) => before.some(([kept]) => kept === child))).toEqual(
      before,
    );
    expect(await commands.axTree()).toContain(PAGE_ACTION);
  });

  it("HO3 layers that close out of order leave the prior values in place", async () => {
    const [outerOpen, setOuter] = createSignal(true);
    const [innerOpen, setInner] = createSignal(true);
    const page = document.body.appendChild(document.createElement("div"));
    const outer = document.body.appendChild(document.createElement("div"));
    const inner = document.body.appendChild(document.createElement("div"));
    render(() => {
      for (const [element, open] of [
        [outer, outerOpen],
        [inner, innerOpen],
      ] as const) {
        const handle = registerLayer({
          element: () => element,
          open,
          kind: "modal",
          escape: () => true,
        });
        createHideOutside({ layer: handle, active: open });
      }
      return <></>;
    });
    await settle();
    expect(page.getAttribute("aria-hidden")).toBe("true");
    setOuter(false);
    await settle();
    expect(page.getAttribute("aria-hidden")).toBe("true");
    setInner(false);
    await settle();
    expect(page.getAttribute("aria-hidden")).toBeNull();
  });

  it("HO4 an inner modal hides the outer, and the outer is visible again when it closes", async () => {
    const run = await mount("handoff");
    await run(press("Open Outer"));
    expect(await commands.axTree()).toContain('dialog "Outer"');
    await run(press("Open Inner"));
    const during = await commands.axTree();
    expect(during).not.toContain('dialog "Outer"');
    expect(during).toContain('dialog "Inner"');
    expect(during).not.toContain(PAGE_ACTION);
    await run(press("Close Inner"));
    const after = await commands.axTree();
    expect(after).toContain('dialog "Outer"');
    expect(after).not.toContain('dialog "Inner"');
    expect(after).not.toContain(PAGE_ACTION);
  });

  it("HO5 open and close write nothing on html or body and use no inert", async () => {
    const run = await mount("modal");
    const writes: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records)
        writes.push(`${record.target.nodeName}:${record.attributeName}`);
    });
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });
    await run(press("Open Modal"));
    expect(document.querySelector("[inert]")).toBeNull();
    await run(press("Close Modal"));
    expect(document.querySelector("[inert]")).toBeNull();
    expect(observer.takeRecords().map((r) => r.attributeName)).toEqual([]);
    expect(writes).toEqual([]);
    observer.disconnect();
  });

  it("HO6 a toast outside the modal stays in the AX tree and an announcement made then is in it", async () => {
    const run = await mount("modal");
    await run(press("Open Modal"));
    expect(await commands.axTree()).toContain('status "Toast"');
    await run(press("Announce"));
    expect(await commands.axTree()).toContain("Saved Modal");
  });
});
