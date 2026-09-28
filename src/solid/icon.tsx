import type { IconifyIcon } from "@iconify/types";
import { iconToSVG } from "@iconify/utils";
import { batch, createMemo, createSignal, type JSX, type Signal, splitProps } from "solid-js";

export type IconData = IconifyIcon;

export interface IconSource {
  /** Icons known at build time, keyed `prefix:name`. */
  bundled: Record<string, IconData>;
  /** Resolves the rest in one batch; a name the source does not have maps to null. */
  load?: (names: string[]) => Promise<Record<string, IconData | null>>;
}

/**
 * Module-level singleton, the same shape as provideEntityData: widget sandboxes
 * mount their own Solid roots but resolve this module through the host import
 * map, so the host's source reaches them too.
 */
let source: IconSource | undefined;
const loaded = new Map<string, IconData | null>();
// A new source re-resolves every icon; a batch landing wakes only the names it answered.
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
    batch(() => {
      for (const n of names) {
        loaded.set(n, result[n] ?? null);
        requested.delete(n);
        arrivals.get(n)?.[1]((v) => v + 1);
      }
    });
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

interface TrustedPolicy {
  createHTML(input: string): string;
}
let policy: TrustedPolicy | null | undefined;

// Icon bodies come from the build or the host's own icon route; under a
// require-trusted-types-for CSP the assignment still needs a policy.
function trusted(html: string): string {
  if (policy === undefined) {
    const tt = (
      globalThis as {
        trustedTypes?: { createPolicy(name: string, rules: TrustedPolicy): TrustedPolicy };
      }
    ).trustedTypes;
    try {
      policy = tt ? tt.createPolicy("glasshome-ui", { createHTML: (s) => s }) : null;
    } catch {
      policy = null;
    }
  }
  return policy ? policy.createHTML(html) : html;
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
  const [local, rest] = splitProps(props, ["icon", "width", "height"]);
  const built = createMemo(() => {
    const data = lookup(local.icon);
    const size = {
      width: local.width == null ? null : String(local.width),
      height: local.height == null ? null : String(local.height),
    };
    if (!data) return { ...EMPTY, attributes: { ...EMPTY.attributes, ...sizeOrDefault(size) } };
    return iconToSVG(data, size);
  });
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-slot="icon"
      data-icon={local.icon}
      aria-hidden="true"
      fill="currentColor"
      {...rest}
      viewBox={built().attributes.viewBox}
      width={built().attributes.width}
      height={built().attributes.height}
      innerHTML={trusted(built().body)}
    />
  );
}

function sizeOrDefault(size: { width: string | null; height: string | null }) {
  if (size.width == null && size.height == null) return { width: "1em", height: "1em" };
  return { width: size.width ?? size.height ?? "1em", height: size.height ?? size.width ?? "1em" };
}
