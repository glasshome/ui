import type { JSX } from "solid-js";
import { Show } from "solid-js";

/**
 * Shared chrome for the @glasshome/ui component catalog. Every component group
 * renders its cells through <Specimen> so the whole catalog reads as one grid:
 * a mono name label, an optional interaction or state chip, and the live
 * component below, split into <Axis> rows by prop. Keep demos MINIMAL — one
 * representative instance with its key variants/states, not an exhaustive
 * matrix. This is an at-a-glance overview, not Storybook.
 */

/** A titled catalog group (e.g. "Actions", "Overlays"). */
export function CatalogGroup(props: { id: string; title: string; children: JSX.Element }) {
  return (
    <section class="space-y-3">
      <h3
        id={props.id}
        class="text-foreground scroll-mt-24 text-sm font-semibold tracking-wider uppercase"
      >
        {props.title}
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{props.children}</div>
    </section>
  );
}

/** One specimen cell. `name` is the exported identifier. */
export function Specimen(props: {
  name: string;
  /** The interaction the specimen needs; shoot.mjs reads it as --click / --hover. */
  try?: string;
  /** A live value worth showing (a select's value, a toggle's pressed). */
  state?: string;
  span?: 2 | 3;
  children: JSX.Element;
}) {
  const spanClass =
    props.span === 3 ? "sm:col-span-2 lg:col-span-3" : props.span === 2 ? "sm:col-span-2" : "";
  return (
    <div
      data-specimen={props.name}
      data-try={props.try}
      // Opaque on purpose: glass specimens need a known backdrop.
      class={`border-border/60 bg-card flex flex-col overflow-hidden rounded-lg border ${spanClass}`}
    >
      <div class="border-border/50 bg-muted/30 flex items-baseline justify-between gap-2 border-b px-3 py-1.5">
        <code class="text-foreground font-mono text-xs font-semibold">{props.name}</code>
        <Show when={props.state ?? props.try}>
          {(chip) => <span class="text-muted-foreground truncate text-[10px]">{chip()}</span>}
        </Show>
      </div>
      {/* shoot.mjs scopes its triggers here, so the header's `try` chip is never clicked. */}
      <div
        data-stage
        class="flex min-h-24 flex-1 flex-col not-has-[[data-axis]]:flex-row not-has-[[data-axis]]:flex-wrap not-has-[[data-axis]]:items-center not-has-[[data-axis]]:gap-3 not-has-[[data-axis]]:p-4"
      >
        {props.children}
      </div>
    </div>
  );
}

/** One prop axis inside a specimen. `of` is the component's real prop name. */
export function Axis(props: { of: string; children: JSX.Element }) {
  return (
    <div
      data-axis={props.of}
      class="border-border/40 flex flex-wrap items-center gap-3 border-b p-3 last:border-b-0"
    >
      <span class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
        {props.of}
      </span>
      {props.children}
    </div>
  );
}
