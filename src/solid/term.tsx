import { Popover as PopoverPrimitive } from "@kobalte/core/popover";
import { type JSX, Show } from "solid-js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { Popover, PopoverContent } from "./popover.js";
import { SectionIcon } from "./section-card.js";

export interface TermDefinition {
  icon: string;
  title: string;
  /** One sentence a homeowner reads in a glance. */
  line: string;
  href?: string;
}

/** A word a homeowner may not know; tapping it explains it in place. */
export function Term(props: { term: TermDefinition; children?: JSX.Element; class?: string }) {
  return (
    <Popover>
      <PopoverPrimitive.Trigger
        data-slot="term"
        class={cn(
          "decoration-muted-foreground/60 hover:decoration-foreground cursor-help underline decoration-dotted underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--material-accent)]",
          props.class,
        )}
      >
        {props.children ?? props.term.title}
      </PopoverPrimitive.Trigger>
      <PopoverContent class="flex w-72 items-start gap-3 text-left">
        <SectionIcon icon={props.term.icon} tone="var(--material-accent)" size="sm" />
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-foreground text-sm font-semibold">{props.term.title}</span>
          <span class="text-muted-foreground text-xs leading-snug">{props.term.line}</span>
          <Show when={props.term.href}>
            {(href) => (
              <a
                href={href()}
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-tint-foreground mt-1 inline-flex items-center gap-1 self-start text-xs font-medium underline-offset-4 hover:underline"
              >
                Learn more
                <Icon icon="lucide:arrow-up-right" width={12} height={12} />
              </a>
            )}
          </Show>
        </div>
      </PopoverContent>
    </Popover>
  );
}
