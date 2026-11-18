import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { OptionCard, OptionCardGroup, OptionChoice } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("OptionCard", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const radio = (name: string) => findTarget(scope(), { role: "radio", name }) as HTMLInputElement;
  const card = (name: string) => radio(name).closest("[data-slot=option-card]");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const pick = async (name: string) => {
    const title = card(name)?.querySelector("[data-slot=option-card-title]");
    if (!title) throw new Error(`no card ${name}`);
    await input.press(title);
    await settle();
  };
  const picked = () =>
    findAll(scope(), { role: "radio" })
      .filter((el) => (el as HTMLInputElement).checked)
      .map(
        (el) =>
          el.closest("[data-slot=option-card]")?.querySelector("[data-slot=option-card-title]")
            ?.textContent,
      );
  return { radio, card, run, pick, picked };
}

const INVITE = "Send an invite They pick a password.";
const press = (name: string): Step => ({ press: { role: "radio", name } });

function Picker(props: { onPick: (value: string) => void; busy?: boolean }) {
  const [value, setValue] = createSignal<string | null>("a");
  return (
    <OptionCardGroup value={value()} onChange={setValue} aria-label="Way in">
      <OptionCard value="a" title="Alpha" busy={props.busy} onPick={() => props.onPick("a")} />
      <OptionCard value="b" title="Beta" busy={props.busy} onPick={() => props.onPick("b")} />
    </OptionCardGroup>
  );
}

describe("OptionCard contract", () => {
  it("OC1 one named radiogroup holds a radio per card, the picked card marked", async () => {
    const { card, picked } = await mount();
    expect(findAll(scenarioScope(), { role: "radiogroup", name: "How they sign in" })).toHaveLength(
      1,
    );
    expect(findAll(scenarioScope(), { role: "radio" })).toHaveLength(3);
    expect(picked()).toEqual(["Send an invite"]);
    expect(card(INVITE)?.hasAttribute("data-checked")).toBe(true);
    expect(card("Share a code")?.hasAttribute("data-checked")).toBe(false);
    expect(card("Later")?.hasAttribute("data-disabled")).toBe(true);
  });

  it("OC2 a press picks the card", async () => {
    const { card, pick, picked } = await mount();
    await pick("Share a code");
    expect(picked()).toEqual(["Share a code"]);
    expect(card("Share a code")?.hasAttribute("data-checked")).toBe(true);
    expect(card(INVITE)?.hasAttribute("data-checked")).toBe(false);
  });

  it("OC3 ArrowDown picks the next enabled card, skipping a disabled one and wrapping", async () => {
    const { radio, run, picked } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(radio(INVITE));
    await run({ key: "ArrowDown" });
    expect(picked()).toEqual(["Share a code"]);
    await run({ key: "ArrowDown" });
    expect(picked()).toEqual(["Send an invite"]);
    expect(focusedElement()).toBe(radio(INVITE));
  });

  it("OC4 onPick runs once per press, the picked card included", async () => {
    const picks: string[] = [];
    render(() => <Picker onPick={(v) => picks.push(v)} />);
    await settle();
    const { pick } = helpers(scenarioScope);
    await pick("Alpha");
    expect(picks).toEqual(["a"]);
    await pick("Beta");
    expect(picks).toEqual(["a", "b"]);
  });

  it("OC5 busy, a press changes nothing and runs no onPick", async () => {
    const picks: string[] = [];
    render(() => <Picker busy onPick={(v) => picks.push(v)} />);
    await settle();
    const { pick, picked } = helpers(scenarioScope);
    await pick("Beta");
    expect(picked()).toEqual(["Alpha"]);
    expect(picks).toEqual([]);
  });

  it("OC6 the picked card's sub-options are a named radiogroup that reports the new one", async () => {
    const subs: string[] = [];
    const [sub, setSub] = createSignal("6");
    render(() => (
      <OptionCardGroup value="code" onChange={() => {}} aria-label="Way in">
        <OptionCard
          value="code"
          title="Share a code"
          subValue={sub()}
          onSubChange={(v) => {
            subs.push(v);
            setSub(v);
          }}
        >
          <OptionChoice value="6" label="Six digits" />
          <OptionChoice value="8" label="Eight digits" />
        </OptionCard>
      </OptionCardGroup>
    ));
    await settle();
    const scope = scenarioScope;
    expect(findAll(scope(), { role: "radiogroup", name: "Share a code options" })).toHaveLength(1);
    const choice = (name: string) => findTarget(scope(), { role: "radio", name });
    expect(choice("Six digits").getAttribute("aria-checked")).toBe("true");
    expect(choice("Eight digits").getAttribute("aria-checked")).toBe("false");
    await runSteps(scope, [press("Eight digits")], input, settle);
    expect(subs).toEqual(["8"]);
    expect(choice("Eight digits").getAttribute("aria-checked")).toBe("true");
  });

  it("OC7 a press picks the card inside a closed shadow root", async () => {
    const { pick, picked } = await mount("in-shadow-root");
    await pick("Share a code");
    expect(picked()).toEqual(["Share a code"]);
  });

  it("OC8 an arrow key picks the next card without onPick; Space on a card runs it", async () => {
    const picks: string[] = [];
    render(() => <Picker onPick={(v) => picks.push(v)} />);
    await settle();
    const { run, picked } = helpers(scenarioScope);
    await run({ key: "Tab" }, { key: "ArrowDown" });
    expect(picked()).toEqual(["Beta"]);
    expect(picks).toEqual([]);
    await run({ key: " " });
    expect(picks).toEqual(["b"]);
  });

  it("OC9 a group whose value returns to null shows no card picked", async () => {
    const [value, setValue] = createSignal<string | null>(null);
    render(() => (
      <OptionCardGroup value={value()} onChange={setValue} aria-label="Way in">
        <OptionCard value="a" title="Alpha" />
        <OptionCard value="b" title="Beta" />
      </OptionCardGroup>
    ));
    await settle();
    const { pick, picked, card } = helpers(scenarioScope);
    await pick("Beta");
    expect(picked()).toEqual(["Beta"]);
    setValue(null);
    await settle();
    expect(picked()).toEqual([]);
    expect(card("Beta")?.hasAttribute("data-checked")).toBe(false);
  });
});
