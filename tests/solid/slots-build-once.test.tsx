import { parseColor } from "@kobalte/core/colors";
import { cleanup, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { type EntityDataAdapter, EntityDataContext } from "../../src/solid/entity-data.js";
import * as ui from "../../src/solid/index.js";

afterEach(cleanup);

// A slot read twice builds its JSX twice; under SSR hydration the first build claims
// keys the server never emitted, and a Dynamic inside it throws.

const SOURCES = import.meta.glob<string>("../../src/solid/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});
const sourceKey = (file: string) => `../../src/solid/${file}`;
const read = (file: string) => SOURCES[sourceKey(file)] ?? "";
const moduleFile = (base: string) =>
  [`${base}.tsx`, `${base}.ts`].find((file) => sourceKey(file) in SOURCES) ?? `${base}.tsx`;

/** A module's source with every barrel it re-exports from inlined. */
function sourceOf(file: string): string {
  const source = read(file);
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : ".";
  const reexported = [...source.matchAll(/from\s*"\.\/([^"]+)\.js"/g)].map(([, base]) =>
    sourceOf(moduleFile(dir === "." ? (base ?? "") : `${dir}/${base ?? ""}`)),
  );
  return [source, ...reexported].join("\n");
}

/** Export name to the source file index.ts re-exports it from. */
function exportFiles(): Map<string, string> {
  const files = new Map<string, string>();
  for (const block of read("index.ts").matchAll(
    /export\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"\.\/([^"]+)\.js"/g,
  )) {
    const [, names = "", file = ""] = block;
    for (const entry of names.split(",")) {
      const name = entry
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .pop();
      if (name) files.set(name, moduleFile(file));
    }
  }
  return files;
}

/** Prop names a source file types as JSX (directly or through a local alias of JSX.Element). */
function jsxPropNames(file: string): Set<string> {
  const source = sourceOf(file);
  const jsx = ["JSX\\.Element"];
  for (const [, alias] of source.matchAll(/type\s+(\w+)\s*=\s*[^;]*JSX\.Element[^;]*;/g)) {
    if (alias) jsx.push(`\\b${alias}\\b`);
  }
  const typed = new RegExp(`^\\s*(\\w+)\\??:\\s*[^;\\n]*(?:${jsx.join("|")})`, "gm");
  return new Set([...source.matchAll(typed)].map(([, name]) => name ?? ""));
}

type Fixture = {
  props?: Record<string, unknown>;
  wrap?: (child: () => JSX.Element) => JSX.Element;
  /** Names the file types as JSX elsewhere but this component takes as data. */
  notSlots?: Record<string, string>;
};

const noop = () => {};
const adapter: EntityDataAdapter = {
  entityIdsByDomain: () => ({}),
  useEntities: () => () => [],
  getEntityView: () => undefined,
  useAreas: () => () => [],
};

const inside =
  (Root: (p: Record<string, unknown>) => JSX.Element, props: Record<string, unknown> = {}) =>
  (child: () => JSX.Element) => <Root {...props}>{child()}</Root>;

const inDialog = inside(ui.Dialog as never, { open: true });
const inAlertDialog = inside(ui.AlertDialog as never, { open: true });
const inSheet = inside(ui.Sheet as never, { open: true });
const inResponsive = inside(ui.ResponsiveDialog as never, { open: true });
const inBottomSheet = inside(ui.BottomSheet as never, { open: true });
const inPopover = inside(ui.Popover as never, { open: true });
const inHoverCard = inside(ui.HoverCard as never, { open: true });
const inTooltip = inside(ui.Tooltip as never, { open: true });
const inCollapsible = inside(ui.Collapsible as never, { open: true });
const inCarousel = inside(ui.Carousel as never);
const inAvatar = inside(ui.Avatar as never);
const inTabs = inside(ui.Tabs as never, { value: "a" });
const inToggleGroup = inside(ui.ToggleGroup as never, { value: "a" });
const inRadioGroup = inside(ui.RadioGroup as never, { value: "a" });
const inOptionGroup = inside(ui.OptionCardGroup as never, { value: "a", onChange: noop });
const inEntityData = (child: () => JSX.Element) => (
  <EntityDataContext.Provider value={adapter}>{child()}</EntityDataContext.Provider>
);
const inAccordionItem = (child: () => JSX.Element) => (
  <ui.Accordion defaultValue={["a"]}>
    <ui.AccordionItem value="a">{child()}</ui.AccordionItem>
  </ui.Accordion>
);
const inDropdown = inside(ui.DropdownMenu as never, { open: true });
const inDropdownContent = (child: () => JSX.Element) => (
  <ui.DropdownMenu open>
    <ui.DropdownMenuContent>{child()}</ui.DropdownMenuContent>
  </ui.DropdownMenu>
);
const inDropdownGroup = (child: () => JSX.Element) =>
  inDropdownContent(() => <ui.DropdownMenuGroup>{child()}</ui.DropdownMenuGroup>);
const inDropdownRadio = (child: () => JSX.Element) =>
  inDropdownContent(() => (
    <ui.DropdownMenuRadioGroup value="a">{child()}</ui.DropdownMenuRadioGroup>
  ));
const inDropdownSub = (child: () => JSX.Element) =>
  inDropdownContent(() => <ui.DropdownMenuSub open>{child()}</ui.DropdownMenuSub>);
const inContextMenu = inside(ui.ContextMenu as never);
const inContextContent = (child: () => JSX.Element) => (
  <ui.ContextMenu>
    <ui.ContextMenuContent>{child()}</ui.ContextMenuContent>
  </ui.ContextMenu>
);
const inContextGroup = (child: () => JSX.Element) =>
  inContextContent(() => <ui.ContextMenuGroup>{child()}</ui.ContextMenuGroup>);
const inContextRadio = (child: () => JSX.Element) =>
  inContextContent(() => <ui.ContextMenuRadioGroup value="a">{child()}</ui.ContextMenuRadioGroup>);
const inContextSub = (child: () => JSX.Element) =>
  inContextContent(() => <ui.ContextMenuSub>{child()}</ui.ContextMenuSub>);
const inSelect = inside(ui.Select as never, { options: [], open: true });

const widget = { scope: "glasshome", name: "clock" };

/** Context and required data a component needs to mount at all; everything else mounts bare. */
const FIXTURES: Record<string, Fixture> = {
  AccordionItem: { wrap: inside(ui.Accordion as never), props: { value: "a" } },
  AccordionTrigger: { wrap: inAccordionItem },
  AccordionContent: { wrap: inAccordionItem },
  AlertDialogAction: { wrap: inAlertDialog },
  AlertDialogCancel: { wrap: inAlertDialog },
  AlertDialogContent: { wrap: inAlertDialog },
  AlertDialogDescription: { wrap: inAlertDialog },
  AlertDialogTitle: { wrap: inAlertDialog },
  AlertDialogTrigger: { wrap: inAlertDialog },
  AreaChart: { props: { data: [] } },
  AreaPicker: { wrap: inEntityData, props: { value: "", onChange: noop } },
  AvatarFallback: { wrap: inAvatar },
  AvatarImage: { wrap: inAvatar },
  BarList: { props: { items: [] } },
  BottomSheetClose: { wrap: inBottomSheet },
  BottomSheetContent: { wrap: inBottomSheet },
  BottomSheetOverlay: { wrap: inBottomSheet },
  BottomSheetPortal: { wrap: inBottomSheet },
  BottomSheetTrigger: { wrap: inBottomSheet },
  CarouselContent: { wrap: inCarousel },
  CarouselDots: { wrap: inCarousel },
  CarouselItem: { wrap: inCarousel },
  CarouselNext: { wrap: inCarousel },
  CarouselPrevious: { wrap: inCarousel },
  CollapsibleContent: { wrap: inCollapsible },
  CollapsibleTrigger: { wrap: inCollapsible },
  ColorSlider: { props: { channel: "hue", defaultValue: parseColor("hsl(200, 98%, 39%)") } },
  ContextMenuCheckboxItem: { wrap: inContextContent },
  ContextMenuContent: { wrap: inContextMenu },
  ContextMenuGroup: { wrap: inContextContent },
  ContextMenuItem: { wrap: inContextContent },
  ContextMenuLabel: { wrap: inContextGroup },
  ContextMenuRadioGroup: { wrap: inContextContent },
  ContextMenuRadioItem: { wrap: inContextRadio, props: { value: "a" } },
  ContextMenuSub: { wrap: inContextContent },
  ContextMenuSubContent: { wrap: inContextSub },
  ContextMenuSubTrigger: { wrap: inContextSub },
  ContextMenuTrigger: { wrap: inContextMenu },
  DashboardPreview: { props: { columns: 12, tiles: [] } },
  DialogClose: { wrap: inDialog },
  DialogContent: { wrap: inDialog },
  DialogDescription: { wrap: inDialog },
  DialogTitle: { wrap: inDialog },
  DialogTrigger: { wrap: inDialog },
  Dock: { props: { items: [] } },
  DockedPanel: { props: { open: true } },
  DropdownMenuCheckboxItem: { wrap: inDropdownContent },
  DropdownMenuContent: { wrap: inDropdown },
  DropdownMenuGroup: { wrap: inDropdownContent },
  DropdownMenuItem: { wrap: inDropdownContent },
  DropdownMenuLabel: { wrap: inDropdownGroup },
  DropdownMenuRadioGroup: { wrap: inDropdownContent },
  DropdownMenuRadioItem: { wrap: inDropdownRadio, props: { value: "a" } },
  DropdownMenuSub: { wrap: inDropdownContent },
  DropdownMenuSubContent: { wrap: inDropdownSub },
  DropdownMenuSubTrigger: { wrap: inDropdownSub },
  DropdownMenuTrigger: { wrap: inDropdown },
  EntitySelector: {
    wrap: inEntityData,
    props: { domain: "light", entityIds: [], onEntityIdsChange: noop },
  },
  HeroAction: {
    props: {
      icon: "lucide:play",
      title: "t",
      description: "d",
      accentVar: "var(--primary)",
      onClick: noop,
    },
  },
  HeroOption: { wrap: inOptionGroup, props: { value: "a", title: "t" } },
  HoverCardContent: { wrap: inHoverCard },
  HoverCardTrigger: { wrap: inHoverCard },
  IconPicker: { props: { value: "", onChange: noop } },
  LabeledIconPicker: { props: { label: "Icon", value: "", onChange: noop } },
  MediaTile: {
    props: {
      item: { id: "a", mimeType: "image/png", width: 1, height: 1, size: 1, usedBy: 0 },
      thumbUrl: "/t",
      label: "l",
      broken: false,
      onSelect: noop,
      onBroken: noop,
    },
  },
  OptionCard: { wrap: inOptionGroup, props: { value: "a", title: "t" } },
  OptionChoice: {
    wrap: (child) =>
      inOptionGroup(() => (
        <ui.OptionCard value="a" title="t" subValue="b" onSubChange={noop}>
          {child()}
        </ui.OptionCard>
      )),
    props: { value: "b", label: "l" },
  },
  PopoverAnchor: { wrap: inPopover },
  PopoverContent: { wrap: inPopover },
  PopoverTrigger: { wrap: inPopover },
  PreviewTile: { wrap: inRadioGroup, props: { value: "a", label: "l" } },
  RadioGroupItem: { wrap: inRadioGroup, props: { value: "a" } },
  RangeToggle: { props: { value: 7, onChange: noop } },
  ResponsiveDialogClose: { wrap: inResponsive },
  ResponsiveDialogContent: { wrap: inResponsive },
  ResponsiveDialogDescription: { wrap: inResponsive },
  ResponsiveDialogTitle: { wrap: inResponsive },
  ResponsiveDialogTrigger: { wrap: inResponsive },
  SchemaForm: { props: { schema: { type: "object", properties: {} }, data: {}, onChange: noop } },
  Select: { props: { options: [] } },
  SelectContent: { wrap: inSelect },
  SelectLabel: { wrap: inSelect },
  SelectTrigger: { wrap: inSelect },
  SelectValue: { wrap: inSelect },
  SheetClose: { wrap: inSheet },
  SheetContent: { wrap: inSheet },
  SheetDescription: { wrap: inSheet },
  SheetTitle: { wrap: inSheet },
  SheetTrigger: { wrap: inSheet },
  StackedBar: { props: { segments: [] } },
  TableFilterSelect: {
    props: { options: [], value: "", onChange: noop, label: (v: string) => v, ariaLabel: "a" },
  },
  TabsContent: { wrap: inTabs, props: { value: "a" } },
  TabsList: { wrap: inTabs },
  TabsTrigger: { wrap: inTabs, props: { value: "a" } },
  ToggleGroupItem: { wrap: inToggleGroup, props: { value: "a" } },
  TooltipContent: { wrap: inTooltip },
  TooltipTrigger: { wrap: inTooltip },
  WidgetCard: { props: { widget } },
  WidgetIdentity: { props: { widget } },
  WidgetMeta: { props: { widget } },
};

/** Exports that cannot be mounted as a component here, each with why. */
const SKIPPED: Record<string, string> = {
  SelectItem: "Kobalte builds it per option through Select's itemComponent with a list item",
};

const isComponent = ([name, value]: [string, unknown]) =>
  /^[A-Z]/.test(name) &&
  typeof value === "function" &&
  !/^class\b/.test(Function.prototype.toString.call(value));

const files = exportFiles();
const components = Object.entries(ui).filter(isComponent) as [
  string,
  (props: Record<string, unknown>) => JSX.Element,
][];
const mounted = components.filter(([name]) => !(name in SKIPPED));

function slotsOf(name: string): string[] {
  const file = files.get(name);
  if (!file) throw new Error(`${name} is not re-exported from a file index.ts names`);
  const notSlots = FIXTURES[name]?.notSlots ?? {};
  return [...new Set(["children", ...jsxPropNames(file)])].filter((slot) => !(slot in notSlots));
}

function mountWith(
  name: string,
  Component: (p: Record<string, unknown>) => JSX.Element,
  slot: string,
) {
  const fixture = FIXTURES[name] ?? {};
  let built = 0;
  const props = { ...fixture.props };
  Object.defineProperty(props, slot, {
    enumerable: true,
    get: () => {
      built++;
      return <span data-testid="slot-probe" />;
    },
  });
  const view = () => <Component {...props} />;
  render(() => (fixture.wrap ? fixture.wrap(view) : view()));
  return built;
}

describe("slot props build once", () => {
  it("discovers every exported component, or skips it with a reason", () => {
    expect(mounted.length).toBeGreaterThan(150);
    const exported = new Set(components.map(([name]) => name));
    const stale = [...Object.keys(FIXTURES), ...Object.keys(SKIPPED)].filter(
      (n) => !exported.has(n),
    );
    expect(stale).toEqual([]);
  });

  const reached = new Set<string>();

  it.each(mounted.map(([name, Component]) => [name, Component] as const))(
    "%s",
    (name, Component) => {
      const twice: string[] = [];
      for (const slot of slotsOf(name)) {
        const built = mountWith(name, Component, slot);
        cleanup();
        if (built === 1) reached.add(name);
        if (built > 1) twice.push(`${slot} built ${built} times`);
      }
      expect(twice).toEqual([]);
    },
  );

  // Slotless components (charts, skeletons, inputs) and parts closed in their fixture read
  // no slot; the floor keeps the harness from going quietly vacuous.
  it("reaches a slot in most components", () => {
    expect(reached.size).toBeGreaterThanOrEqual(230);
  });
});
