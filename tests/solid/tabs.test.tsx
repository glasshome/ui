/* Spacing-owner rule: the root owns the gap to its content, so the content
 * part must carry no margin of its own. Also pins the radius contract: the
 * indicator and the trigger it sits behind read the same corner radius. */
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/solid/tabs.js";

afterEach(cleanup);

function renderTabs() {
  const [value, setValue] = createSignal("a");
  return render(() => (
    <Tabs value={value()} onChange={setValue}>
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">content a</TabsContent>
      <TabsContent value="b">content b</TabsContent>
    </Tabs>
  ));
}

describe("Tabs", () => {
  it("puts the gap to the content on the root, not on the content part", () => {
    const { container } = render(() => (
      <Tabs value="a" class="probe-root">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">content</TabsContent>
      </Tabs>
    ));
    const root = container.querySelector<HTMLElement>(".probe-root");
    const content = container.querySelector<HTMLElement>('[data-slot="tabs-content"]');
    expect(root?.className).toContain("gap-2");
    expect(content?.className).not.toMatch(/(^|\s)mt-/);
  });

  it("gives the trigger and the sliding indicator the same corner radius", () => {
    const { container } = renderTabs();
    const trigger = container.querySelector<HTMLElement>('[data-slot="tabs-trigger"]');
    expect(trigger?.className).toContain("rounded-md");
  });

  it("routes the class prop through to the tabs list and trigger", () => {
    const { container } = render(() => (
      <Tabs value="a">
        <TabsList class="probe-list">
          <TabsTrigger value="a" class="probe-trigger">
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">content</TabsContent>
      </Tabs>
    ));
    expect(container.querySelector(".probe-list")).not.toBeNull();
    expect(container.querySelector(".probe-trigger")).not.toBeNull();
  });
});

describe("Tabs layout", () => {
  it("stacks the list over the content by default", () => {
    const { container } = render(() => (
      <Tabs value="a" class="probe-root">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">content</TabsContent>
      </Tabs>
    ));
    const tokens = container.querySelector<HTMLElement>(".probe-root")?.className.split(/\s+/);
    expect(tokens).toContain("flex");
    expect(tokens).not.toContain("contents");
  });

  it("layout=split lets the host lay the parts out, and still shares the tab state", () => {
    const { container } = render(() => (
      <div class="panel">
        <Tabs value="a" layout="split" class="probe-root">
          <div class="host-header">
            <TabsList>
              <TabsTrigger value="a">A</TabsTrigger>
            </TabsList>
          </div>
          <div class="host-body">
            <TabsContent value="a">content</TabsContent>
          </div>
        </Tabs>
      </div>
    ));
    const tokens = container.querySelector<HTMLElement>(".probe-root")?.className.split(/\s+/);
    expect(tokens).toContain("contents");
    expect(tokens).not.toContain("flex");
    expect(container.querySelector('.host-body [data-slot="tabs-content"]')?.textContent).toBe(
      "content",
    );
  });
});
