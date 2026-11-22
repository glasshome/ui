import { type JSX, mergeProps, Show } from "solid-js";
import { type UiFormat, uiFormat } from "../lib/format.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Icon } from "./icon.js";
import { useUiFormat, useUiText } from "./locale.js";
import { ScopeIndicator } from "./scope-indicator.js";
import { SectionIcon, SectionSubtitle } from "./section-card.js";
import { WidgetTrustBadge } from "./widget-trust-badge.js";

/**
 * The reusable nucleus for rendering one widget/package: icon pill + name (with
 * official/unlisted markers + inline version) + the @scope/name line, plus the
 * download/version meta cluster. Shared by every widget surface (registry
 * gallery, dashboard browse, admin tables). App-specific cards (hub's row/tile
 * registry card, dash's interactive picker) compose this; the data model is
 * `WidgetSummary`.
 */
export interface WidgetSummary {
  scope: string;
  name: string;
  displayName?: string | null;
  icon?: string | null;
  description?: string | null;
  isOfficial?: boolean;
  isUnlisted?: boolean;
  /** Newest version never finished publishing (bundle upload never confirmed,
   *  or no version row at all), so nothing is installable. Distinct from
   *  `isUnlisted`, which is a published widget hidden from search.
   *  Owner-facing surfaces set it; public ones leave it off. */
  isUnpublished?: boolean;
  downloadCount?: number;
  latestVersion?: string | null;
  versionCount?: number;
  ownerType?: "personal" | "organization";
}

/** Canonical public detail URL for a widget (`/widgets/@scope/name`). */
export function widgetHref(w: { scope: string; name: string }): string {
  return `/widgets/@${w.scope}/${w.name}`;
}

const usEnglish = uiFormat("en-US");
const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false };

/** Compact download/count formatting, shared by every surface. */
export function formatWidgetCount(
  n: number | null | undefined,
  format: UiFormat = usEnglish,
): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${format.number(v / 1_000_000, ONE_DECIMAL)}M`;
  if (v >= 1000) return `${format.number(v / 1000, ONE_DECIMAL)}k`;
  return format.number(v, { useGrouping: false });
}

type WidgetIdentityProps = {
  widget: WidgetSummary;
  /** Icon pill size. Rows use sm, tiles use md. */
  iconSize?: "sm" | "md";
  /** CSS color for the icon pill; neutral when unset. */
  iconTone?: string;
  /** Append `v{latestVersion}` next to the name. Default true. */
  showVersionInline?: boolean;
  /** Show the (personal/org) scope pill after the @scope/name line. */
  showScopeIndicator?: boolean;
  class?: string;
};

export function WidgetIdentity(_props: WidgetIdentityProps) {
  const props = mergeProps({ iconSize: "sm" as const, showVersionInline: true }, _props);
  const text = useUiText();
  return (
    <div data-slot="widget-identity" class={cn("flex min-w-0 items-center gap-3", props.class)}>
      <SectionIcon size={props.iconSize} tone={props.iconTone}>
        <Show when={props.widget.icon} fallback={<Icon icon="lucide:package" />}>
          {(icon) => <Icon icon={icon()} />}
        </Show>
      </SectionIcon>
      <div data-slot="widget-identity-headings" class="flex min-w-0 flex-1 flex-col gap-0.5">
        <div data-slot="widget-identity-headline" class="flex items-center gap-2">
          <SectionSubtitle class="truncate">
            {props.widget.displayName || props.widget.name}
          </SectionSubtitle>
          <Show when={props.showVersionInline && props.widget.latestVersion}>
            <span class="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
              {text("ui.widget-identity.version", { version: props.widget.latestVersion ?? "" })}
            </span>
          </Show>
          <WidgetTrustBadge isOfficial={!!props.widget.isOfficial} />

          <Show when={props.widget.isUnlisted}>
            <Badge tone="var(--warning)">{text("ui.widget-identity.unlisted")}</Badge>
          </Show>
          <Show when={props.widget.isUnpublished}>
            <Badge tone="var(--destructive)">{text("ui.widget-identity.unpublished")}</Badge>
          </Show>
        </div>
        <div data-slot="widget-identity-scope" class="flex min-w-0 flex-wrap items-center gap-1.5">
          <span class="text-muted-foreground truncate font-mono text-xs">
            @{props.widget.scope}/{props.widget.name}
          </span>
          <Show when={props.showScopeIndicator}>
            <ScopeIndicator
              scope={props.widget.scope}
              type={props.widget.ownerType ?? "personal"}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}

/** Downloads (+ optional version counts) meta cluster. */
export function WidgetMeta(props: {
  widget: WidgetSummary;
  /** Append `N versions`. */
  showVersions?: boolean;
  /** Append `v{latestVersion}` (the tile footer's shape). */
  showLatestVersion?: boolean;
  class?: string;
}): JSX.Element {
  const text = useUiText();
  const format = useUiFormat();
  return (
    <div
      data-slot="widget-meta"
      class={cn("text-muted-foreground flex items-center gap-4 text-xs", props.class)}
    >
      <Show when={props.widget.downloadCount != null}>
        <span class="flex items-center gap-1 tabular-nums">
          <Icon icon="lucide:arrow-down-to-line" width={12} height={12} class="size-3" />
          {formatWidgetCount(props.widget.downloadCount, format)}
        </span>
      </Show>
      <Show when={props.showVersions && props.widget.versionCount != null}>
        <span class="flex items-center gap-1 tabular-nums">
          <Icon icon="lucide:layers" width={12} height={12} class="size-3" />
          {text("ui.widget-identity.versions", { count: props.widget.versionCount ?? 0 })}
        </span>
      </Show>
      <Show when={props.showLatestVersion && props.widget.latestVersion}>
        <span class="tabular-nums">
          {text("ui.widget-identity.version", { version: props.widget.latestVersion ?? "" })}
        </span>
      </Show>
    </div>
  );
}
