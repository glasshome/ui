import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/solid/tabs.js";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("Tabs", id);
  const tab = (name: string) => findTarget(scope(), { role: "tab", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const panel = () => findTarget(scope(), { role: "tabpanel" });
  return { scope, tab, run, panel };
}

describe("Tabs contract", () => {
  it("T1 one tablist holds a tab per trigger, the default selected", async () => {
    const { scope, tab } = await mount();
    expect(findAll(scope(), { role: "tablist" })).toHaveLength(1);
    expect(findAll(scope(), { role: "tab" })).toHaveLength(3);
    expect(tab("Lights").getAttribute("aria-selected")).toBe("true");
    expect(tab("Lights").hasAttribute("data-selected")).toBe(true);
    expect(tab("Climate").getAttribute("aria-selected")).toBe("false");
    expect(tab("Media").getAttribute("aria-selected")).toBe("false");
  });

  it("T2 only the selected tab is in the tab order", async () => {
    const { tab } = await mount();
    expect(tab("Lights").getAttribute("tabindex")).toBe("0");
    expect(tab("Media").getAttribute("tabindex")).toBe("-1");
  });

  it("T3 the selected panel is named by its tab and the only one rendered", async () => {
    const { scope, tab, panel } = await mount();
    expect(findAll(scope(), { role: "tabpanel" })).toHaveLength(1);
    expect(tab("Lights").getAttribute("aria-controls")).toBe(panel().id);
    expect(panel().textContent).toBe("Three lights are on.");
    expect(panel().getAttribute("aria-labelledby"), "panel named by its tab").toBe(
      tab("Lights").id,
    );
  });

  it("T4 a disabled tab says so and ignores a press", async () => {
    const { tab, run, panel } = await mount();
    expect(tab("Climate").getAttribute("aria-disabled")).toBe("true");
    expect(tab("Climate").hasAttribute("data-disabled")).toBe(true);
    await run({ press: { role: "tab", name: "Climate" } });
    expect(tab("Lights").getAttribute("aria-selected")).toBe("true");
    expect(panel().textContent).toBe("Three lights are on.");
  });

  it("T5 pressing a tab selects and focuses it and swaps the panel", async () => {
    const { tab, run, panel } = await mount();
    await run({ press: { role: "tab", name: "Media" } });
    expect(tab("Media").getAttribute("aria-selected")).toBe("true");
    expect(focusedElement()).toBe(tab("Media"));
    expect(panel().textContent).toBe("Nothing playing.");
  });

  it("T6 ArrowRight moves to the next enabled tab", async () => {
    const { tab, run } = await mount();
    await run({ press: { role: "tab", name: "Lights" } }, { key: "ArrowRight" });
    expect(focusedElement()).toBe(tab("Media"));
    expect(tab("Media").getAttribute("aria-selected")).toBe("true");
  });

  it("T7 ArrowRight on the last tab wraps to the first", async () => {
    const { tab, run } = await mount();
    await run({ press: { role: "tab", name: "Media" } }, { key: "ArrowRight" });
    expect(focusedElement()).toBe(tab("Lights"));
    expect(tab("Lights").getAttribute("aria-selected")).toBe("true");
  });

  it("T8 Home and End reach the first and last enabled tab", async () => {
    const { tab, run } = await mount();
    await run({ press: { role: "tab", name: "Lights" } }, { key: "End" });
    expect(focusedElement()).toBe(tab("Media"));
    expect(tab("Media").getAttribute("aria-selected")).toBe("true");
    await run({ key: "Home" });
    expect(focusedElement()).toBe(tab("Lights"));
    expect(tab("Lights").getAttribute("aria-selected")).toBe("true");
  });

  it("T9 Tab lands on the selected tab, a second Tab leaves the tablist", async () => {
    const { tab, run, panel } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(tab("Lights"));
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(panel());
  });

  it("T10 pressing a tab works inside a dialog and a closed shadow root", async () => {
    const pressMedia = async (id: string) => {
      const { tab, run, panel } = await mount(id);
      await run({ press: { role: "tab", name: "Media" } });
      expect(tab("Media").getAttribute("aria-selected"), `${id}: Media selected`).toBe("true");
      expect(focusedElement(), id).toBe(tab("Media"));
      expect(panel().textContent, id).toBe("Nothing playing.");
    };
    await pressMedia("in-dialog");
    cleanup();
    await pressMedia("in-shadow-root");
  });

  it("T11 with no tab matching the value the first enabled tab shows and onChange stays quiet", async () => {
    const onChange = vi.fn();
    const [value, setValue] = createSignal<string | undefined>(undefined);
    render(() => (
      <Tabs value={value()} onChange={onChange}>
        <TabsList>
          <TabsTrigger value="off" disabled>
            Off
          </TabsTrigger>
          <TabsTrigger value="lights">Lights</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <TabsContent value="lights">Lights panel</TabsContent>
        <TabsContent value="media">Media panel</TabsContent>
      </Tabs>
    ));
    await settle();
    const tab = (name: string) => screen.getByRole("tab", { name });
    expect(tab("Lights").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Lights panel");
    setValue("gone");
    flush();
    expect(tab("Lights").getAttribute("aria-selected")).toBe("true");
    expect(onChange).not.toHaveBeenCalled();
    await input.press(tab("Media"));
    expect(onChange).toHaveBeenCalledWith("media");
  });
});
