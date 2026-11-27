import type { IconifyIcon } from "@iconify/types";
import { iconToSVG } from "@iconify/utils";
import { createMemo, createSignal, merge, type Signal, omit } from "solid-js";
import { isServer, type JSX } from "@solidjs/web";
import { iconNodes, trusted } from "./icon-nodes.js";

export type IconData = IconifyIcon;

export interface IconSource {
  /** Icons known at build time, keyed `prefix:name`. */
  bundled: Record<string, IconData>;
  /** Resolves the rest in one batch; a name the source does not have maps to null. */
  load?: (names: string[]) => Promise<Record<string, IconData | null>>;
  /** `prefix:name` matches for `query` across `prefixes`; powers every IconPicker. */
  search?: (query: string, prefixes: string[]) => Promise<string[]>;
}

/**
 * Module-level singleton, the same shape as provideEntityData: widget sandboxes
 * mount their own Solid roots but resolve this module through the host import
 * map, so the host's source reaches them too.
 */
let source: IconSource | undefined;
const loaded = new Map<string, IconData | null>();
// A new source re-resolves every icon; a batch landing wakes only the names it answered.
// oxlint-disable-next-line solid/ssr-module-state -- icon data is the same for every visitor
const [generation, setGeneration] = createSignal(0);
const arrivals = new Map<string, Signal<number>>();
const arrivalOf = (name: string) => {
  let signal = arrivals.get(name);
  if (!signal) {
    signal = createSignal(0);
    arrivals.set(name, signal);
  }
  return signal;
};
let pending = new Set<string>();
// Queued or in flight: a lookup while the batch is out waits for it, never asks again.
const requested = new Set<string>();
let flush: Promise<void> | null = null;

/** Host apps call this once at startup; every mounted Icon re-resolves. */
export function provideIcons(next: IconSource): void {
  source = next;
  loaded.clear();
  requested.clear();
  setGeneration((g) => g + 1);
}

export function iconSearch(): IconSource["search"] {
  return source?.search;
}

function request(name: string): void {
  const load = source?.load;
  if (!load || requested.has(name)) return;
  requested.add(name);
  pending.add(name);
  if (flush) return;
  flush = Promise.resolve().then(async () => {
    const names = [...pending];
    pending = new Set();
    flush = null;
    let result: Record<string, IconData | null> = {};
    try {
      result = await load(names);
    } catch {
      result = {};
    }
    if (source?.load !== load) return;
    for (const n of names) {
      loaded.set(n, result[n] ?? null);
      requested.delete(n);
      arrivals.get(n)?.[1]((v) => v + 1);
    }
  });
}

function lookup(name: string): IconData | undefined {
  generation();
  const bundled = source?.bundled[name];
  if (bundled) return bundled;
  if (loaded.has(name)) return loaded.get(name) ?? undefined;
  arrivalOf(name)[0]();
  request(name);
  return undefined;
}

export interface IconProps extends Omit<
  JSX.SvgSVGAttributes<SVGSVGElement>,
  "width" | "height" | "children"
> {
  /** `prefix:name`, e.g. `lucide:plus`. */
  icon: string;
  /** Unitless = px; both omitted = 1em, one omitted = the icon's own ratio. */
  width?: number | string;
  height?: number | string;
}

const EMPTY = { attributes: { viewBox: "0 0 16 16", width: "1em", height: "1em" }, body: "" };

/** One inline `<svg>` per icon: no shadow root, no observer, rendered once and kept. */
export function Icon(props: IconProps) {
  const rest = omit(props, "icon", "width", "height");
  const built = createMemo(() => {
    const data = lookup(props.icon);
    const size = {
      width: props.width == null ? null : String(props.width),
      height: props.height == null ? null : String(props.height),
    };
    if (!data) return { ...EMPTY, attributes: { ...EMPTY.attributes, ...sizeOrDefault(size) } };
    return iconToSVG(data, size);
  });
  const body = createMemo(() => built().body);
  const named = () =>
    rest["aria-label"] != null || rest["aria-labelledby"] != null || rest.role != null;
  const shell = merge(
    {
      xmlns: "http://www.w3.org/2000/svg",
      "data-slot": "icon",
      get "data-icon"() {
        return props.icon;
      },
      get "aria-hidden"() {
        return named() ? undefined : ("true" as const);
      },
      fill: "currentColor",
    },
    rest,
    {
      get viewBox() {
        return built().attributes.viewBox;
      },
      get width() {
        return built().attributes.width;
      },
      get height() {
        return built().attributes.height;
      },
    },
  );
  if (isServer) {
    // A TrustedHTML is a fresh object per call, which the spread would write as a new innerHTML.
    const html = createMemo(() => trusted(body()));
    // oxlint-disable-next-line solid/no-innerhtml -- html() is trusted(body()), held in a memo
    const svg = <svg {...shell} innerHTML={html()} />;
    // The client's child insert takes one hydration id after the svg; take it here too.
    createMemo(() => undefined);
    // oxlint-disable-next-line solid/components-return-once -- isServer is a build constant
    return svg;
  }
  const nodes = createMemo(() => iconNodes(body()));
  return <svg {...shell}>{nodes()}</svg>;
}

function sizeOrDefault(size: { width: string | null; height: string | null }) {
  if (size.width == null && size.height == null) return { width: "1em", height: "1em" };
  return { width: size.width ?? size.height ?? "1em", height: size.height ?? size.width ?? "1em" };
}
