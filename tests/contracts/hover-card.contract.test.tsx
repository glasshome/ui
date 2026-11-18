import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { OUTSIDE } from "../../dev/components/popover/scenarios";
import { MOTION_EXIT_MS } from "../../src/lib/motion-classes";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../src/solid";
import { useFakeTime } from "../../src/testing";
import { expectGap } from "../harness/gap";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const OPEN_DELAY_MS = 700;
const CLOSE_DELAY_MS = 300;
const TRIGGER = { role: "link", name: "12 creators" };
const HOVER: Step = { hover: TRIGGER };

async function mount(id: string) {
  const { scope } = await mountScenario("HoverCard", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const trigger = () => findTarget(scope(), TRIGGER);
  const cards = () =>
    scope().flatMap((root) => [
      ...root.querySelectorAll<HTMLElement>('[data-slot="hover-card-content"]'),
    ]);
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const expectOpen = () => vi.waitFor(() => expect(cards()).toHaveLength(1));
  const expectClosed = () => vi.waitFor(() => expect(cards()).toHaveLength(0));
  return { trigger, cards, run, expectOpen, expectClosed };
}

describe("HoverCard contract", () => {
  it("HC1 mounted, a button trigger reads as a focusable link and no card exists", async () => {
    const { trigger, cards } = await mount("open");
    expect(trigger().getAttribute("data-slot")).toBe("hover-card-trigger");
    expect(trigger().tabIndex).toBe(0);
    expect(cards()).toHaveLength(0);
  });

  it("HC2 the pointer resting on the trigger opens the card after the open delay", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    render(() => (
      <p style={{ "margin-top": "120px", "margin-left": "40px" }}>
        <HoverCard>
          <HoverCardTrigger as="button" type="button">
            12 creators
          </HoverCardTrigger>
          <HoverCardContent>Widget creators</HoverCardContent>
        </HoverCard>
      </p>
    ));
    await settle();
    const { trigger, cards } = helpers(scenarioScope);
    const before = focusedElement();
    await input.hover(trigger());
    await vi.advanceTimersByTimeAsync(OPEN_DELAY_MS - 50);
    expect(cards()).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(50);
    await settle();
    expect(cards()).toHaveLength(1);
    expect(cards()[0]?.hasAttribute("data-expanded")).toBe(true);
    expect(focusedElement()).toBe(before);
  });

  it("HC3 keyboard focus on the trigger opens the card and keeps focus on the trigger", async () => {
    const { trigger, run, expectOpen } = await mount("focus");
    await run({ key: "Tab" });
    await expectOpen();
    expect(focusedElement()).toBe(trigger());
  });

  it("HC4 the pointer moving onto the card keeps it open", async () => {
    const { cards, run, expectOpen } = await mount("open");
    await run(HOVER);
    await expectOpen();
    const card = cards()[0];
    if (!card) throw new Error("no card");
    await input.hover(card);
    await new Promise((resolve) => setTimeout(resolve, CLOSE_DELAY_MS + MOTION_EXIT_MS.overlay));
    expect(cards()).toHaveLength(1);
  });

  it("HC5 the pointer moving to another control closes the card", async () => {
    const { run, expectOpen, expectClosed } = await mount("open");
    await run(HOVER);
    await expectOpen();
    await run({ hover: { role: "button", name: "Other" } });
    await expectClosed();
  });

  it("HC6 Tab off the trigger closes the card", async () => {
    const { run, expectOpen, expectClosed } = await mount("focus");
    await run({ key: "Tab" });
    await expectOpen();
    await run({ key: "Tab" });
    await expectClosed();
  });

  it("HC7 a touch on the trigger opens no card", async () => {
    const { cards, run } = await mount("touch");
    await run({ touch: TRIGGER });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await settle();
    await expectGap(
      () => expect(cards(), "cards after a touch").toHaveLength(0),
      "cards after a touch: expected [ <div",
    );
  });

  it("HC8 Escape closes the card", async () => {
    const { run, expectOpen, expectClosed } = await mount("escape");
    await run(HOVER);
    await expectOpen();
    await run({ key: "Escape" });
    await expectClosed();
  });

  it("HC9 a press outside closes the card", async () => {
    const { run, expectOpen, expectClosed } = await mount("outside-press");
    await run(HOVER);
    await expectOpen();
    await run({ pressAt: OUTSIDE });
    await expectClosed();
  });

  it("HC10 inside a expectClosed shadow root the card opens in the same root", async () => {
    const { scope } = await mountScenario("HoverCard", "in-shadow-root");
    const { cards, run, expectOpen } = helpers(scope);
    await run(HOVER);
    await expectOpen();
    expect(cards()[0]?.getRootNode()).toBeInstanceOf(ShadowRoot);
  });

  it("HC11 the card sits below the trigger, inside the viewport", async () => {
    const { trigger, cards, run, expectOpen } = await mount("open");
    await run(HOVER);
    await expectOpen();
    await settle();
    const box = cards()[0]?.getBoundingClientRect();
    const anchor = trigger().getBoundingClientRect();
    if (!box) throw new Error("no card");
    expect(box.top).toBeGreaterThanOrEqual(anchor.bottom - 1);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  });
});
