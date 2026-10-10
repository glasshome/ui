import { Show } from "solid-js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { WidgetTrustBadge } from "./widget-trust-badge.js";

/**
 * Where a catalog item comes from: the official or community mark, plus Built in when it ships with GlassHome.
 * Inside an `@container/source-marks` narrower than 12rem, Built in steps aside so the name keeps its room.
 */
export function SourceMarks(props: { official: boolean; builtIn?: boolean; class?: string }) {
  return (
    <span
      data-slot="source-marks"
      class={cn("inline-flex shrink-0 items-center gap-1.5", props.class)}
    >
      <WidgetTrustBadge isOfficial={props.official} />
      <Show when={props.builtIn}>
        <Badge tone="var(--muted-foreground)" class="@max-[12rem]/source-marks:hidden">
          Built in
        </Badge>
      </Show>
    </span>
  );
}
