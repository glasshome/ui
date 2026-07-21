import { ArrowDownToLine, ChevronRight } from "lucide-solid";
import { type JSX, mergeProps, Show } from "solid-js";
import { cn } from "../lib/utils.js";
import { Card } from "./card.js";
import {
	formatWidgetCount,
	WidgetIdentity,
	WidgetMeta,
	type WidgetSummary,
	widgetHref,
} from "./widget-identity.js";

/**
 * The registry widget card: `row` for dense lists, `tile` for grids/galleries.
 * Both are a <Card> + the WidgetIdentity/WidgetMeta nucleus. Shared by every
 * widget surface (registry gallery, dashboard browse, admin tables) across
 * apps; the data model is `WidgetSummary`.
 */
type WidgetCardProps = {
	widget: WidgetSummary;
	/** `row` for dense lists, `tile` for grids/galleries. Default `row`. */
	layout?: "row" | "tile";
	/** When set, the whole card becomes a link. */
	href?: string;
	/** Click handler (used when no href). */
	onClick?: (e: MouseEvent) => void;
	/** Show the (personal/org) scope pill. Default false. */
	showScopeIndicator?: boolean;
	/** Show the version-count meta. Default false. */
	showVersions?: boolean;
	/** Show the description (tile only). Default true for tiles. */
	showDescription?: boolean;
	/** Custom trailing element for the row layout. Defaults to a chevron when
	 *  the card is interactive (href/onClick), otherwise nothing. */
	trailing?: JSX.Element;
	class?: string;
};

export function WidgetCard(_props: WidgetCardProps) {
	const props = mergeProps({ layout: "row" as const }, _props);
	// Default: link to the widget's public page. A call-site that wants different
	// behavior (e.g. open a dialog) passes `onClick` and opts out of the link.
	const href = () => props.href ?? (props.onClick ? undefined : widgetHref(props.widget));
	const interactive = () => href() != null || props.onClick != null;

	return (
		<Show
			when={props.layout === "tile"}
			fallback={<WidgetCardRow {...props} href={href()} interactive={interactive()} />}
		>
			<WidgetCardTile {...props} href={href()} interactive={interactive()} />
		</Show>
	);
}

type InternalProps = WidgetCardProps & { interactive: boolean };

function WidgetCardRow(props: InternalProps) {
	const hasMeta = () =>
		props.widget.downloadCount != null || (props.showVersions && props.widget.versionCount != null);
	const showTrailing = () => props.trailing !== undefined || props.interactive;

	return (
		<Card
			as={props.href ? "a" : "div"}
			href={props.href}
			onClick={props.onClick}
			interactive={props.interactive}
			padding="sm"
			class={cn("group flex items-center gap-3", props.class)}
		>
			<div class="min-w-0 flex-1">
				<WidgetIdentity
					widget={props.widget}
					iconSize="sm"
					showScopeIndicator={props.showScopeIndicator}
				/>
			</div>
			<Show when={hasMeta()}>
				<WidgetMeta widget={props.widget} showVersions={props.showVersions} class="shrink-0" />
			</Show>
			<Show when={showTrailing()} fallback={null}>
				<Show
					when={props.trailing !== undefined}
					fallback={
						<ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
					}
				>
					{props.trailing}
				</Show>
			</Show>
		</Card>
	);
}

function WidgetCardTile(props: InternalProps) {
	const showDescription = () => props.showDescription !== false;

	return (
		<Card
			as={props.href ? "a" : "div"}
			href={props.href}
			onClick={props.onClick}
			interactive={props.interactive}
			padding="md"
			class={cn("group flex h-full flex-col", props.class)}
		>
			<WidgetIdentity widget={props.widget} iconSize="md" showVersionInline={false} />
			<Show when={showDescription() && props.widget.description}>
				<p class="mt-3 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
					{props.widget.description}
				</p>
			</Show>
			<div class="mt-auto flex items-center gap-4 pt-3 text-muted-foreground text-xs">
				<Show when={props.widget.downloadCount != null}>
					<span class="flex items-center gap-1 tabular-nums">
						<ArrowDownToLine class="size-3" />
						{formatWidgetCount(props.widget.downloadCount)}
					</span>
				</Show>
				<Show when={props.widget.latestVersion}>
					<span class="tabular-nums">v{props.widget.latestVersion}</span>
				</Show>
			</div>
		</Card>
	);
}

export default WidgetCard;
