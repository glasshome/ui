import { Icon } from "@iconify-icon/solid";
import { ArrowDown, ArrowUp, ChevronsUpDown, Filter, Search, X } from "lucide-solid";
import { For, type JSX, Show, splitProps } from "solid-js";
import { Button } from "./button";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

/**
 * Generic data-table vocabulary: sticky-less header, row height/padding, border
 * treatment, hover, numeric alignment, toolbar (search/filter/sort), bulk bar,
 * and empty/loading/error states. Each list renders its own row markup but
 * shares these primitives + class tokens. Presentational only — no app data.
 *
 * Tables live inside a card; go edge-to-edge with `TABLE_BLEED` (cancels the
 * card's p-3) and re-add the inset via the cell padding tokens.
 */

export const TABLE_BLEED = "-mx-3 border-border/50 border-t";
export const TABLE_CELL_X = "px-4";
export const TABLE_ROW_CLASS =
	"flex items-center gap-4 border-border/50 border-b px-4 py-2.5 transition-colors last:border-b-0 hover:bg-foreground/[0.03]";
export const TABLE_HEAD_CLASS = "flex items-center gap-4 border-border/50 border-b px-4 py-2";
export const TABLE_HEAD_CELL_CLASS = "font-medium text-muted-foreground text-xs";
export const TABLE_SCROLL_CLASS = "max-h-[600px] overflow-auto";
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
				class={`h-9 w-auto gap-1.5 text-xs ${props.class ?? ""}`}
				aria-label={props.ariaLabel}
			>
				<Filter class="size-3.5 shrink-0 text-muted-foreground" />
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
		<div class={`relative w-full sm:w-64 ${props.class ?? ""}`}>
			<Search class="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder={props.placeholder}
				value={props.value}
				onInput={(e) => props.onInput((e.currentTarget as HTMLInputElement).value)}
				class="h-9 w-full pr-7 pl-7 text-xs"
				aria-label={props.label}
			/>
			<Show when={props.value}>
				<button
					type="button"
					onClick={() => props.onInput("")}
					class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
					aria-label="Clear search"
				>
					<X class="size-3.5" />
				</button>
			</Show>
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
		<button
			type="button"
			onClick={props.onClick}
			class={`inline-flex items-center gap-1 rounded font-medium text-muted-foreground text-xs transition-colors hover:text-foreground ${
				props.align === "end" ? "justify-end" : ""
			} ${props.class ?? ""}`}
			aria-label={`Sort by ${props.label}`}
		>
			{props.label}
			<Show when={props.active} fallback={<ChevronsUpDown class="size-3 opacity-30" />}>
				<Show when={props.dir === "asc"} fallback={<ArrowDown class="size-3" />}>
					<ArrowUp class="size-3" />
				</Show>
			</Show>
		</button>
	);
}

/** Centered empty state inside the table body. `icon` takes JSX or an iconify name. */
export function TableEmpty(props: {
	icon?: JSX.Element | string;
	message: JSX.Element;
	action?: JSX.Element;
}) {
	return (
		<div class="flex flex-col items-center gap-3 px-4 py-12 text-center">
			<Show when={props.icon}>
				{typeof props.icon === "string" ? (
					<Icon icon={props.icon} class="block text-[32px] text-muted-foreground/50" />
				) : (
					props.icon
				)}
			</Show>
			<p class="text-muted-foreground text-sm">{props.message}</p>
			<Show when={props.action}>{props.action}</Show>
		</div>
	);
}

/** Inline error state with a Retry button. */
export function TableError(props: { message: JSX.Element; onRetry: () => void }) {
	return (
		<div class="px-4 py-10 text-center">
			<p class="text-destructive text-sm">{props.message}</p>
			<Button variant="outline" size="sm" class="mt-3" onClick={props.onRetry}>
				Retry
			</Button>
		</div>
	);
}

/** Table-shaped loading skeleton: N rows at the shared row height. */
export function TableSkeleton(props: { count?: number; class?: string }) {
	const n = props.count ?? 5;
	return (
		<div aria-busy="true">
			<For each={Array.from({ length: n })}>
				{(_, i) => (
					<div class={`${TABLE_ROW_CLASS} ${props.class ?? ""}`}>
						<div class="h-4 w-4 shrink-0 animate-pulse rounded bg-foreground/[0.06]" />
						<div class="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
							<div class="size-9 shrink-0 animate-pulse rounded-full bg-foreground/[0.06] sm:size-7" />
							<div class="min-w-0 flex-1 space-y-1.5">
								<div
									class="h-3 animate-pulse rounded bg-foreground/[0.06]"
									style={{ width: `${[38, 30, 46, 34, 42][i() % 5]}%` }}
								/>
								<div
									class="h-2.5 animate-pulse rounded bg-foreground/[0.04]"
									style={{ width: `${[52, 44, 60, 48, 56][i() % 5]}%` }}
								/>
								<div class="flex gap-1 pt-0.5 sm:hidden">
									<div class="h-4 w-12 animate-pulse rounded-full bg-foreground/[0.05]" />
									<div class="h-4 w-16 animate-pulse rounded-full bg-foreground/[0.05]" />
								</div>
							</div>
							<div class="h-3 w-12 shrink-0 animate-pulse rounded bg-foreground/[0.06]" />
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
			class={`flex flex-wrap items-center gap-2 border-border/50 border-b bg-foreground/[0.03] px-4 py-2 ${local.class ?? ""}`}
			{...rest}
		>
			{local.children}
		</div>
	);
}
