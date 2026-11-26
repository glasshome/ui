import { createEffect, createSignal, For, onSettled, Show } from "solid-js";
import { type JSX } from "@solidjs/web";
import {
  Button,
  FactRow,
  SectionCard,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../src/solid";
import { MATERIAL_PRESETS } from "../../src/tokens";
import type { RunReport, StepReport } from "../drive/types";
import { STAGE_WIDTHS, type StageWidth, WidthPicker } from "../Stage";
import { contractRows, findComponent, kebab, scenarioPath } from "./registry";
import type { Scenario, Step } from "./types";

const NO_MATERIAL = "None";
const MATERIALS = [NO_MATERIAL, ...Object.keys(MATERIAL_PRESETS)];
const THEMES = ["light", "dark"] as const;
const MIN_CELL_HEIGHT = 96;

/** Backtick spans become code; nothing else of markdown appears in a contract cell. */
const Inline = (props: { text: string }) => (
  <For each={props.text.split("`")}>
    {(part, i) => (i() % 2 === 1 ? <code class="font-mono text-xs">{part}</code> : part)}
  </For>
);

const describeStep = (step: Step | null) => {
  if (step === null) return "Mounted";
  const [verb, arg] = Object.entries(step)[0] ?? ["", ""];
  if (typeof arg === "string") return `${verb} ${arg}`;
  if ("role" in arg) return `${verb} ${arg.name ?? arg.role}`;
  return `${verb} ${arg.x},${arg.y}`;
};

/** An iframe of the stage route, scaled to its column; a page scenario is as tall as its content. */
function Cell(props: { href: string; label: string; width: StageWidth; fullHeight: boolean }) {
  const [hostWidth, setHostWidth] = createSignal(0);
  const [contentHeight, setContentHeight] = createSignal(MIN_CELL_HEIGHT);
  let host: HTMLDivElement | undefined;
  let iframe: HTMLIFrameElement | undefined;
  let watching: ResizeObserver | undefined;

  onSettled(() => {
    const observer = new ResizeObserver((entries) => {
      const first = entries[0];
      if (first) setHostWidth(first.contentRect.width);
    });
    if (host) observer.observe(host);
    return () => {
      observer.disconnect();
      watching?.disconnect();
    };
  });

  const measure = () => {
    watching?.disconnect();
    const frame = iframe?.contentWindow as (Window & typeof globalThis) | null | undefined;
    const scenario = frame?.document.querySelector("[data-scenario]");
    if (!frame || !scenario) return;
    watching = new frame.ResizeObserver(() =>
      setContentHeight(Math.max(MIN_CELL_HEIGHT, scenario.getBoundingClientRect().height)),
    );
    watching.observe(scenario);
  };

  const scale = () => Math.min(1, (hostWidth() || props.width.width) / props.width.width);
  const height = () => (props.fullHeight ? props.width.height : contentHeight());

  return (
    <div class="flex min-w-0 flex-col gap-2">
      <div ref={host} class="w-full overflow-hidden" style={{ height: `${height() * scale()}px` }}>
        <iframe
          ref={iframe}
          title={props.label}
          src={props.href}
          onLoad={measure}
          class="border-border/60 bg-background rounded-xl border"
          style={{
            width: `${props.width.width}px`,
            height: `${height()}px`,
            transform: `scale(${scale()})`,
            "transform-origin": "top left",
          }}
        />
      </div>
      <Button as="a" href={props.href} target="_blank" variant="ghost" size="sm" class="self-start">
        Open alone
      </Button>
    </div>
  );
}

function StepView(props: { report: RunReport; step: StepReport; slug: string; id: string }) {
  const run = () => props.report.dir.split("-").at(-1) ?? "";
  const perf = () => Object.entries(props.step.perf);
  return (
    <div class="grid gap-4 lg:grid-cols-2">
      <img
        src={`/__drive/${props.slug}/${props.id}/step-${props.step.index}.png?run=${run()}`}
        alt={`What the driver saw after: ${describeStep(props.step.step)}`}
        class="border-border/60 w-full rounded-lg border"
      />
      <div class="flex min-w-0 flex-col gap-3">
        <div class="flex flex-col gap-1">
          <FactRow label="Settled">
            {props.step.settled ? `in ${props.step.settleMs} ms` : "no, still moving"}
          </FactRow>
          <FactRow label="Focus">{props.step.focus.join(" › ") || "page"}</FactRow>
          <For each={perf()}>{([k, v]) => <FactRow label={k}>{v ?? "-"}</FactRow>}</For>
        </div>
        <pre class="bg-muted/40 max-h-64 overflow-auto rounded-lg p-3 font-mono text-xs">
          {props.step.ax}
        </pre>
        <pre class="bg-muted/40 max-h-48 overflow-auto rounded-lg p-3 font-mono text-xs">
          {props.step.markers.map((m) => [m.part, ...Object.keys(m.attrs)].join(" ")).join("\n")}
        </pre>
      </div>
    </div>
  );
}

async function fetchReport(source: { slug: string; id: string }): Promise<RunReport | null> {
  const res = await fetch(`/__drive/${source.slug}/${source.id}/latest.json`);
  return res.ok ? res.json() : null;
}

/** The driver's newest run of this scenario, refetched when the window regains focus. */
function ReportPanel(props: { slug: string; id: string }) {
  const [report, setReport] = createSignal<RunReport | null>(null);
  const [focusCount, setFocusCount] = createSignal(0);
  createEffect(
    () => ({ slug: props.slug, id: props.id, focus: focusCount() }),
    (source) => {
      let live = true;
      void fetchReport(source).then((next) => live && setReport(next));
      return () => {
        live = false;
      };
    },
  );
  onSettled(() => {
    const onFocus = () => setFocusCount((count) => count + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  });
  return (
    <Show
      when={report()}
      fallback={
        <p class="text-muted-foreground text-sm">
          No driver run yet:{" "}
          <code class="font-mono text-xs">
            bun run drive {props.slug} {props.id}
          </code>
        </p>
      }
    >
      {(r) => (
        <div class="flex flex-col gap-3">
          <p class="text-muted-foreground text-sm">
            Driver run of {r().build} at {r().cpuRate}x, {r().width}, {r().theme}
            {r().errors.length > 0 ? `, ${r().errors.length} page errors` : ""}
          </p>
          <Tabs defaultValue="0">
            <TabsList>
              <For each={r().steps}>
                {(s) => (
                  <TabsTrigger value={String(s.index)}>
                    {s.index} {describeStep(s.step)}
                  </TabsTrigger>
                )}
              </For>
            </TabsList>
            <For each={r().steps}>
              {(s) => (
                <TabsContent value={String(s.index)} class="pt-3">
                  <StepView report={r()} step={s} slug={props.slug} id={props.id} />
                </TabsContent>
              )}
            </For>
          </Tabs>
        </div>
      )}
    </Show>
  );
}

function ScenarioRow(props: {
  slug: string;
  scenario: Scenario;
  width: StageWidth;
  material: string;
}): JSX.Element {
  const fullHeight = () => props.scenario.within === "dialog" || props.scenario.within === "sheet";
  const href = (theme: (typeof THEMES)[number]) =>
    `/stage.html${scenarioPath(props.slug, props.scenario.id, {
      theme,
      material: props.material === NO_MATERIAL ? undefined : props.material,
    })}`;
  return (
    <SectionCard title={props.scenario.title} subtitle={props.scenario.id}>
      <div class="grid gap-4 md:grid-cols-2">
        <For each={THEMES}>
          {(theme) => (
            <Cell
              href={href(theme)}
              label={`${props.scenario.title}, ${theme}`}
              width={props.width}
              fullHeight={fullHeight()}
            />
          )}
        </For>
      </div>
      <ReportPanel slug={props.slug} id={props.scenario.id} />
    </SectionCard>
  );
}

export function ComponentPage(props: { component: string }) {
  const entry = () => findComponent(props.component);
  const slug = () => kebab(props.component);
  const [width, setWidth] = createSignal(STAGE_WIDTHS[0] as StageWidth);
  const [material, setMaterial] = createSignal(NO_MATERIAL);

  return (
    <div class="flex flex-col gap-6">
      <SectionCard
        title={props.component}
        subtitle={`${entry()?.scenarios.length ?? 0} scenarios, light and dark`}
        toolbar={
          <div class="flex flex-wrap items-center gap-3">
            <WidthPicker value={width()} onChange={setWidth} />
            <Select
              value={material()}
              onChange={(v) => setMaterial(v ?? NO_MATERIAL)}
              options={MATERIALS}
              itemComponent={(item) => (
                <SelectItem item={item.item}>{item.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger aria-label="Material" class="w-40">
                <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>id</TableHead>
              <TableHead>when</TableHead>
              <TableHead>then</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={contractRows(slug())}>
              {(row) => (
                <TableRow>
                  <For each={row}>
                    {(cell) => (
                      <TableCell class="align-top text-sm whitespace-normal">
                        <Inline text={cell} />
                      </TableCell>
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </SectionCard>
      <For each={entry()?.scenarios ?? []}>
        {(scenario) => (
          <ScenarioRow slug={slug()} scenario={scenario} width={width()} material={material()} />
        )}
      </For>
    </div>
  );
}
