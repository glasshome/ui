import { Icon } from "@iconify-icon/solid";
import { ArrowDownToLine, Layers, Package } from "lucide-solid";
import { type JSX, mergeProps, Show } from "solid-js";
import { cn } from "../lib/utils.js";
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
	downloadCount?: number;
	latestVersion?: string | null;
	versionCount?: number;
	ownerType?: "personal" | "organization";
}

/** Canonical public detail URL for a widget (`/widgets/@scope/name`). */
export function widgetHref(w: { scope: string; name: string }): string {
	return `/widgets/@${w.scope}/${w.name}`;
}

/** Compact download/count formatting, shared by every surface. */
export function formatWidgetCount(n: number | null | undefined): string {
	const v = n ?? 0;
	if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
	if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
	return v.toString();
}

function UnlistedMark() {
	return (
		<span class="shrink-0 rounded-full bg-foreground/10 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
			Unlisted
		</span>
	);
}

type WidgetIdentityProps = {
	widget: WidgetSummary;
	/** Icon pill size. Rows use sm, tiles use md. */
	iconSize?: "sm" | "md";
	/** Append `v{latestVersion}` next to the name. Default true. */
	showVersionInline?: boolean;
	/** Show the (personal/org) scope pill after the @scope/name line. */
	showScopeIndicator?: boolean;
	class?: string;
};

export function WidgetIdentity(_props: WidgetIdentityProps) {
	const props = mergeProps({ iconSize: "sm" as const, showVersionInline: true }, _props);
	return (
		<div class={cn("flex min-w-0 items-center gap-3", props.class)}>
			<SectionIcon size={props.iconSize}>
				<Show when={props.widget.icon} fallback={<Package />}>
					{(icon) => <Icon icon={icon()} />}
				</Show>
			</SectionIcon>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<SectionSubtitle class="truncate">
						{props.widget.displayName || props.widget.name}
					</SectionSubtitle>
					<Show when={props.showVersionInline && props.widget.latestVersion}>
						<span class="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
							v{props.widget.latestVersion}
						</span>
					</Show>
					<WidgetTrustBadge isOfficial={!!props.widget.isOfficial} />

					<Show when={props.widget.isUnlisted}>
						<UnlistedMark />
					</Show>
				</div>
				<div class="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
					<span class="truncate font-mono text-muted-foreground text-xs">
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

/** Downloads (+ optional version count) meta cluster. */
export function WidgetMeta(props: {
	widget: WidgetSummary;
	showVersions?: boolean;
	class?: string;
}): JSX.Element {
	return (
		<div class={cn("flex items-center gap-4 text-muted-foreground text-xs", props.class)}>
			<Show when={props.widget.downloadCount != null}>
				<span class="flex items-center gap-1 tabular-nums">
					<ArrowDownToLine class="size-3" />
					{formatWidgetCount(props.widget.downloadCount)}
				</span>
			</Show>
			<Show when={props.showVersions && props.widget.versionCount != null}>
				<span class="flex items-center gap-1 tabular-nums">
					<Layers class="size-3" />
					{props.widget.versionCount} versions
				</span>
			</Show>
		</div>
	);
}
