import type { JSX } from "solid-js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";

/**
 * Small neutral count chip (list size, item count) sitting next to a title:
 * the Badge material with the muted tone, mono figures that do not jitter.
 * Whole-pixel box, line-height equal to it and a 2px top pad: Geist Mono
 * digits sit above the line centre, and fractional boxes drift a further
 * pixel per DPR (measured 1/1.5/2/4).
 */
export function CountPill(props: { children: JSX.Element; class?: string }) {
  return (
    <Badge
      tone="var(--muted-foreground)"
      class={cn(
        "h-[20px] min-w-[20px] justify-center pt-[2px] pr-[6px] pb-0 pl-[7px] font-mono text-[11px] leading-[20px] tabular-nums",
        props.class,
      )}
    >
      {props.children}
    </Badge>
  );
}
