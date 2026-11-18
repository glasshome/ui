import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { OUTSIDE } from "../../dev/components/popover/scenarios";
import { Term } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const WORD = { role: "button", name: "Hub account" };
const OPEN: Step = { press: WORD };

async function mount(id: string) {
  const { scope } = await mountScenario("Term", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const word = (name = "Hub account") => findTarget(scope(), { role: "button", name });
  const dialogs = () => findAll(scope(), { role: "dialog" });
  const panels = () => dialogs().filter((el) => el.getAttribute("data-slot") === "popover-content");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const expectClosed = () => vi.waitFor(() => expect(panels()).toHaveLength(0));
  return { word, dialogs, panels, run, expectClosed };
}

describe("Term contract", () => {
  it("TM1 mounted, the word is a collapsed dialog button named by the title", async () => {
    const { word, dialogs } = await mount("open");
    const el = word();
    expect(el.getAttribute("data-slot")).toBe("term");
    expect(el.getAttribute("aria-haspopup")).toBe("dialog");
    expect(el.getAttribute("aria-expanded")).toBe("false");
    expect(dialogs()).toHaveLength(0);
  });

  it("TM2 children replace the title as the word", async () => {
    render(() => (
      <p>
        Your <Term term={{ icon: "lucide:cloud", title: "Hub account", line: "x" }}>account</Term>
      </p>
    ));
    await settle();
    const { word } = helpers(scenarioScope);
    expect(word("account").getAttribute("data-slot")).toBe("term");
  });

  it("TM3 a press opens one dialog with the title, the line and a link to the page", async () => {
    const { word, panels, run } = await mount("open");
    await run(OPEN);
    const [panel] = panels();
    expect(panels()).toHaveLength(1);
    expect(panel?.textContent).toContain("Hub account");
    expect(panel?.textContent).toContain("Your account on glasshome.app.");
    const [link] = findAll(scenarioScope(), { role: "link", name: "Learn more" });
    expect(link?.getAttribute("href")).toBe("https://glasshome.app/docs/hub/faq");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(word().getAttribute("aria-controls")).toBe(panel?.id);
  });

  it("TM4 focus moves to Learn more", async () => {
    const { run } = await mount("open");
    await run(OPEN);
    expect(focusedElement()).toBe(
      findTarget(scenarioScope(), { role: "link", name: "Learn more" }),
    );
  });

  it("TM5 without a page the panel takes focus itself", async () => {
    render(() => (
      <p style={{ "margin-top": "120px" }}>
        Your <Term term={{ icon: "lucide:cloud", title: "Hub account", line: "x" }} />
      </p>
    ));
    await settle();
    const { panels, run } = helpers(scenarioScope);
    await run(OPEN);
    const [panel] = panels();
    expect(panel?.querySelector("a")).toBeNull();
    expect(focusedElement()).toBe(panel);
  });

  it("TM6 Escape closes it and focus returns to the word", async () => {
    const { word, run, expectClosed } = await mount("escape");
    await run(OPEN, { key: "Escape" });
    await expectClosed();
    await vi.waitFor(() => expect(focusedElement()).toBe(word()));
  });

  it("TM7 a press outside closes it", async () => {
    const { run, expectClosed } = await mount("outside-press");
    await run(OPEN, { pressAt: OUTSIDE });
    await expectClosed();
  });

  it("TM8 inside a dialog, Escape closes only the panel", async () => {
    const { word, dialogs, run, expectClosed } = await mount("in-dialog");
    await run(OPEN, { key: "Escape" });
    await expectClosed();
    expect(dialogs()).toHaveLength(1);
    await vi.waitFor(() => expect(focusedElement()).toBe(word()));
  });

  it("TM9 the panel's top edge sits on the word's, inside the viewport", async () => {
    const { word, panels, run } = await mount("open");
    await run(OPEN);
    const box = panels()[0]?.getBoundingClientRect();
    const anchor = word().getBoundingClientRect();
    if (!box) throw new Error("no panel");
    expect(Math.abs(box.top - anchor.top)).toBeLessThanOrEqual(1);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  });

  it("TM10 the panel follows its word as the page scrolls", async () => {
    const { word, panels, run } = await mount("scroll-follows");
    await run(OPEN);
    const gap = () =>
      (panels()[0]?.getBoundingClientRect().top ?? Number.NaN) - word().getBoundingClientRect().top;
    const before = gap();
    window.scrollBy(0, 60);
    await settle();
    await vi.waitFor(() => expect(Math.abs(gap() - before)).toBeLessThanOrEqual(1));
    window.scrollTo(0, 0);
  });
});
