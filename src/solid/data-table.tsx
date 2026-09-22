import { For, type JSX, Show, splitProps } from "solid-js";
import { SECTION_PADDING } from "../lib/section-tokens.js";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "./empty.js";
import { Icon } from "./icon.js";
import { Input } from "./input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select.js";
import { Skeleton } from "./skeleton.js";
import { TABLE_HEAD_CELL_CLASS, TABLE_HEAD_LABEL_CLASS } from "./table.js";

/**
 * Generic data-table vocabulary: head strip, row height/padding, border
 * treatment, hover, numeric alignment, toolbar (search/filter/sort), bulk bar,
 * and empty/loading/error states. A list composes DataTableRow for the shared
 * press and keyboard behaviour, or the class tokens for bespoke markup.
 * Presentational only — no app data.
 *
 * Tables live inside a card; go edge-to-edge with `TABLE_BLEED` (cancels the
 * card's p-3) and re-add the inset via the cell padding tokens.
 */

export { TABLE_HEAD_CELL_CLASS, TABLE_HEAD_LABEL_CLASS };

// Literal counterpart of SECTION_PADDING's spacing number, kept for
// Tailwind's static scanner (same split as lib/layers.ts's Z/Z_CLASS). Keying
// on the literal type of SECTION_PADDING makes a drift a compile error here
// instead of a runtime throw.
const BLEED_BY_SECTION_PADDING: Record<typeof SECTION_PADDING, string> = { "p-3": "-mx-3" };
export const TABLE_BLEED = `${BLEED_BY_SECTION_PADDING[SECTION_PADDING]} border-border/50 border-t`;

export const TABLE_CELL_X = "px-4";
export const TABLE_ROW_CLASS =
	"flex items-center gap-4 border-border/50 border-b px-4 py-2.5 transition-colors last:border-b-0 hover:bg-foreground/[0.03]";
export const TABLE_HEAD_CLASS = "flex items-center gap-4 border-border/50 border-b px-4 py-2";
/* No vertical cap: a table inside a page that already scrolls got a second
 * scrollbar and hid most of its own rows. A list that genuinely boxes adds its
 * own max-h. */
export const TABLE_SCROLL_CLASS = "overflow-x-auto gh-scroll";
export const TABLE_NUM_CELL_CLASS = "text-right text-muted-foreground text-xs tabular-nums";

export type SortDirection = "asc" | "desc";

/** Toolbar filter dropdown, built on the Select. Leading filter icon, h-9. Pass
 *  `label` to render an option key as display text (include counts there). */
export function TableFilterSelect(props: {
	options: readonly string[];
	value: string;
	onChange: (value: string) => void;
	label: (value: string) => string;
	ariaLabel: string;
	class?: string;
}) {
	return (
		<Select<string>
			options={[...props.options]}
			value={props.value}
			onChange={(next) => {
				if (next != null) props.onChange(next);
			}}
			itemComponent={(itemProps) => (
				<SelectItem item={itemProps.item}>{props.label(itemProps.item.rawValue)}</SelectItem>
			)}
		>
			<SelectTrigger
				data-slot="table-filter-select"
				class={cn("h-9 w-auto gap-1.5 text-xs", props.class)}
				aria-label={props.ariaLabel}
			>
				<Icon
					icon="lucide:funnel"
					width={14}
					height={14}
					class="size-3.5 shrink-0 text-muted-foreground"
				/>
				<SelectValue<string>>{(state) => props.label(state.selectedOption())}</SelectValue>
			</SelectTrigger>
			<SelectContent />
		</Select>
	);
}

/** Toolbar search box: leading icon, h-9, trailing clear. Debounce in caller. */
export function TableSearchInput(props: {
	value: string;
	onInput: (value: string) => void;
	placeholder: string;
	label: string;
	class?: string;
}) {
	return (
		<div data-slot="table-search-input" class={cn("relative w-full sm:w-64", props.class)}>
			<Icon
				icon="lucide:search"
				width={14}
				height={14}
				class="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				placeholder={props.placeholder}
				value={props.value}
				onInput={(e) => props.onInput((e.currentTarget as HTMLInputElement).value)}
				class="h-9 w-full pr-7 pl-7 text-xs"
				aria-label={props.label}
			/>
			<Show when={props.value}>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => props.onInput("")}
					class="absolute top-1/2 right-1 size-6 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
					aria-label="Clear search"
				>
					<Icon icon="lucide:x" width={14} height={14} class="size-3.5" />
				</Button>
			</Show>
		</div>
	);
}

/**
 * One row of a flex data table. The row itself is what you press: activation
 * rides on a real button covering it, the same mechanism `ListRow` uses, so a
 * row reachable by Tab is also openable by Enter. Cells go in `children`;
 * anything separately clickable goes in `actions`, which stacks above the
 * overlay.
 */
export function DataTableRow(props: {
	children: JSX.Element;
	/** Activates the whole row. Requires `openLabel`. */
	onOpen?: () => void;
	/** The whole row is a link. Requires `openLabel`. */
	href?: string;
	/** Accessible name for the whole-row activation. */
	openLabel?: string;
	selected?: boolean;
	actions?: JSX.Element;
	class?: string;
}) {
	const opens = () => props.onOpen !== undefined || props.href !== undefined;
	return (
		<div
			data-slot="data-table-row"
			data-state={props.selected ? "selected" : undefined}
			class={cn(
				TABLE_ROW_CLASS,
				// Same selected treatment the semantic TableRow uses, keyed off the
				// same data-state, so the two table families read alike.
				"relative data-[state=selected]:bg-muted",
				opens() && "cursor-pointer",
				props.class,
			)}
		>
			<Show when={props.href}>
				{(href) => (
					<a href={href()} class="absolute inset-0 outline-none">
						<span class="sr-only">{props.openLabel}</span>
					</a>
				)}
			</Show>
			<Show when={props.href === undefined && props.onOpen}>
				<button
					type="button"
					class="absolute inset-0 outline-none"
					aria-label={props.openLabel}
					onClick={() => props.onOpen?.()}
				/>
			</Show>
			{props.children}
			<Show when={props.actions}>
				<div class="relative flex shrink-0 items-center gap-1">{props.actions}</div>
			</Show>
		</div>
	);
}

/**
 * Column header strip. `sticky` keeps the labels against the top of the
 * scrollport while a long list scrolls under them, which needs its own
 * background so rows do not read through the glass.
 */
export function DataTableHead(props: { children: JSX.Element; sticky?: boolean; class?: string }) {
	return (
		<div
			data-slot="data-table-head"
			class={cn(TABLE_HEAD_CLASS, props.sticky && "sticky top-0 z-10 bg-background", props.class)}
		>
			{props.children}
		</div>
	);
}

/** Sortable column header button. `align="end"` for numeric columns. */
export function TableSortHeader(props: {
	label: string;
	active: boolean;
	dir: SortDirection;
	onClick: () => void;
	align?: "start" | "end";
	class?: string;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={props.onClick}
			data-slot="table-sort-header"
			class={cn(
				"h-auto gap-1 px-1.5 py-0.5 font-medium text-muted-foreground text-xs hover:text-foreground",
				props.align === "end" && "justify-end",
				props.class,
			)}
			aria-label={`Sort by ${props.label}`}
		>
			{props.label}
			<Show
				when={props.active}
				fallback={
					<Icon icon="lucide:chevrons-up-down" width={12} height={12} class="size-3 opacity-30" />
				}
			>
				<Show
					when={props.dir === "asc"}
					fallback={<Icon icon="lucide:arrow-down" width={12} height={12} class="size-3" />}
				>
					<Icon icon="lucide:arrow-up" width={12} height={12} class="size-3" />
				</Show>
			</Show>
		</Button>
	);
}

/** Centered empty state inside the table body. `icon` takes JSX or an iconify name. */
export function TableEmpty(props: {
	icon?: JSX.Element | string;
	message: JSX.Element;
	action?: JSX.Element;
}) {
	return (
		<Empty class="gap-3 rounded-none py-12">
			<EmptyHeader>
				<Show when={props.icon}>
					<EmptyMedia media="icon">
						{typeof props.icon === "string" ? (
							<Icon icon={props.icon} width={24} height={24} />
						) : (
							props.icon
						)}
					</EmptyMedia>
				</Show>
				<EmptyDescription>{props.message}</EmptyDescription>
			</EmptyHeader>
			<Show when={props.action}>
				<EmptyContent>{props.action}</EmptyContent>
			</Show>
		</Empty>
	);
}

/** Inline error state with a Retry button. */
export function TableError(props: { message: JSX.Element; onRetry: () => void }) {
	return (
		<div data-slot="table-error" class="px-4 py-10 text-center">
			<p class="text-destructive text-sm">{props.message}</p>
			<Button variant="outline" size="sm" class="mt-3" onClick={props.onRetry}>
				Retry
			</Button>
		</div>
	);
}

const SKELETON_TITLE_WIDTHS = ["w-2/5", "w-1/3", "w-1/2", "w-2/5", "w-5/12"] as const;
const SKELETON_META_WIDTHS = ["w-1/2", "w-2/5", "w-3/5", "w-1/2", "w-3/5"] as const;

/** Table-shaped loading skeleton: N rows at the shared row height. */
export function TableSkeleton(props: { count?: number; class?: string }) {
	const n = props.count ?? 5;
	return (
		<div data-slot="table-skeleton" aria-busy="true">
			<For each={Array.from({ length: n })}>
				{(_, i) => (
					<div data-slot="table-skeleton-row" class={cn(TABLE_ROW_CLASS, props.class)}>
						<Skeleton class="h-4 w-4 shrink-0" />
						<div class="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
							<Skeleton class="size-9 shrink-0 rounded-full sm:size-7" />
							<div class="flex min-w-0 flex-1 flex-col gap-1.5">
								<Skeleton
									class={cn("h-3", SKELETON_TITLE_WIDTHS[i() % SKELETON_TITLE_WIDTHS.length])}
								/>
								<Skeleton
									class={cn("h-2.5", SKELETON_META_WIDTHS[i() % SKELETON_META_WIDTHS.length])}
								/>
								<div class="flex gap-1 pt-0.5 sm:hidden">
									<Skeleton class="h-4 w-12 rounded-lg" />
									<Skeleton class="h-4 w-16 rounded-lg" />
								</div>
							</div>
							<Skeleton class="h-3 w-12 shrink-0" />
						</div>
					</div>
				)}
			</For>
		</div>
	);
}

/** Bulk-action bar above the rows when a selection is active. */
export function TableBulkBar(props: { class?: string; children: JSX.Element }) {
	const [local, rest] = splitProps(props, ["class", "children"]);
	return (
		<div
			data-slot="table-bulk-bar"
			class={cn(
				"flex flex-wrap items-center gap-2 border-border/50 border-b bg-foreground/[0.03] px-4 py-2",
				local.class,
			)}
			{...rest}
		>
			{local.children}
		</div>
	);
}
