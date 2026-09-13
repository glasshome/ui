import {
	createEffect,
	createMemo,
	createSignal,
	createUniqueId,
	For,
	on,
	onCleanup,
	type ParentComponent,
	Show,
} from "solid-js";
import { MENU_LABEL } from "../lib/menu-classes.js";
import { PICKER_LIST } from "../lib/picker-classes.js";
import { createIsMobile } from "../lib/use-is-mobile.js";
import { cn } from "../lib/utils.js";
import {
	BottomSheet,
	BottomSheetContent,
	BottomSheetHandle,
	BottomSheetOverlay,
	BottomSheetPortal,
} from "./bottom-sheet/index.js";
import { type EntityViewLike, useEntityData } from "./entity-data.js";
import { Icon } from "./icon.js";
import { PICKER_ROW_HEIGHT, PickerRow } from "./picker-row.js";
import { PickerSearch } from "./picker-search.js";
import { PickerTrigger } from "./picker-trigger.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";
import { SlidingIndicator } from "./sliding-indicator.js";

interface EntitySelectorProps {
	entityIds: string[];
	onEntityIdsChange: (ids: string[]) => void;
	domain: string;
	/** Restrict the list to entities of this device_class (with a
	 *  unit-of-measurement fallback for power/energy sensors that lack one). */
	deviceClass?: string;
	multiple?: boolean;
	/** Id of the element naming the trigger, for forms that label it outside. */
	"aria-labelledby"?: string;
}

// Many real-world power/energy sensors carry a unit but no device_class.
const DEVICE_CLASS_UNIT_FALLBACK: Record<string, readonly string[]> = {
	power: ["W", "kW"],
	energy: ["Wh", "kWh"],
};

const HEADER_HEIGHT = 30;
const ROW_HEIGHT = PICKER_ROW_HEIGHT;
const OVERSCAN_PX = 200;
const NO_AREA_KEY = "__no_area__";
const FALLBACK_ICON = "mdi:shape-outline";

// Rows carry only stable identity (no live EntityView): row objects must keep
// referential equality across entity state ticks so <For> never remounts DOM
// (remounting <iconify-icon> blanks the icon for a frame). Live state is read
// per-row via getEntityView.
type ListRow =
	| { kind: "header"; key: string; label: string }
	| { kind: "entity"; key: string; id: string; entityIndex: number };

function sameRow(a: ListRow, b: ListRow): boolean {
	if (a.kind === "header" && b.kind === "header") return a.label === b.label;
	if (a.kind === "entity" && b.kind === "entity")
		return a.id === b.id && a.entityIndex === b.entityIndex;
	return false;
}

function isUnavailable(view: EntityViewLike) {
	return view.state === "unavailable" || view.state === "unknown";
}

function stateLabel(view: EntityViewLike) {
	if (isUnavailable(view)) return "Unavailable";
	const unit = view.unitOfMeasurement;
	return unit ? `${view.state} ${unit}` : view.state;
}

export function EntitySelector(props: EntitySelectorProps) {
	const data = useEntityData();
	const isMobile = createIsMobile();
	const listboxId = createUniqueId();
	const [open, setOpen] = createSignal(false);
	const [search, setSearch] = createSignal("");
	const [showDiagnostics, setShowDiagnostics] = createSignal(false);
	const [activeIndex, setActiveIndex] = createSignal(0);

	let inputRef: HTMLInputElement | undefined;
	let scrollRef: HTMLDivElement | undefined;
	const [scrollTop, setScrollTop] = createSignal(0);
	const [viewportHeight, setViewportHeight] = createSignal(320);

	const domainEntityIds = createMemo(() => data.entityIdsByDomain()[props.domain] ?? []);
	const subscribedIds = createMemo(() => (open() ? domainEntityIds() : props.entityIds));
	const allViews = data.useEntities(subscribedIds);
	const areas = data.useAreas();
	const areaNameById = createMemo(() => new Map(areas().map((a) => [a.id, a.name])));
	const selectedSet = createMemo(() => new Set(props.entityIds));

	const usableViews = createMemo(() => allViews().filter((v) => !v.isHidden && !v.isDisabled));

	const classFiltered = createMemo(() => {
		const wanted = props.deviceClass;
		if (!wanted) return usableViews();
		const units = DEVICE_CLASS_UNIT_FALLBACK[wanted];
		return usableViews().filter((v) => {
			if (v.deviceClass === wanted) return true;
			return units != null && v.unitOfMeasurement != null && units.includes(v.unitOfMeasurement);
		});
	});

	const classExcludedCount = createMemo(() =>
		props.deviceClass ? usableViews().length - classFiltered().length : 0,
	);

	const classExcludedMessage = () => {
		const n = classExcludedCount();
		const hidden =
			n === 1
				? `1 ${props.domain} entity was hidden because it does not`
				: `${n} ${props.domain} entities were hidden because they do not`;
		return `No ${props.deviceClass} ${props.domain} entities found. ${hidden} report ${props.deviceClass}.`;
	};

	const diagnosticCount = createMemo(
		() => classFiltered().filter((v) => v.entityCategory != null).length,
	);

	const pool = createMemo(() =>
		showDiagnostics() ? classFiltered() : classFiltered().filter((v) => v.entityCategory == null),
	);

	const searched = createMemo(() => {
		const q = search().trim().toLowerCase();
		if (!q) return pool();
		const names = areaNameById();
		return pool().filter((v) => {
			if (v.id.toLowerCase().includes(q)) return true;
			if (v.friendlyName.toLowerCase().includes(q)) return true;
			if (v.name.toLowerCase().includes(q)) return true;
			if (v.aliases.some((a) => a.toLowerCase().includes(q))) return true;
			const areaName = v.areaId ? names.get(v.areaId) : undefined;
			return areaName?.toLowerCase().includes(q) ?? false;
		});
	});

	// Reuse previous row objects when nothing changed so downstream memos and
	// <For> see identical references on every entity state tick.
	let prevRows: ListRow[] = [];
	const rows = createMemo<ListRow[]>(() => {
		const byAreaKey = new Map<string, EntityViewLike[]>();
		for (const v of searched()) {
			const key = v.areaId ?? NO_AREA_KEY;
			const bucket = byAreaKey.get(key);
			if (bucket) bucket.push(v);
			else byAreaKey.set(key, [v]);
		}
		const names = areaNameById();
		const groups = Array.from(byAreaKey.entries())
			.map(([key, views]) => ({
				areaKey: key,
				label: key === NO_AREA_KEY ? "Other" : (names.get(key) ?? key),
				noArea: key === NO_AREA_KEY,
				views: views.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName)),
			}))
			.sort((a, b) => {
				if (a.noArea !== b.noArea) return a.noArea ? 1 : -1;
				return a.label.localeCompare(b.label);
			});

		const flat: ListRow[] = [];
		let entityIndex = 0;
		for (const group of groups) {
			flat.push({ kind: "header", key: `h:${group.areaKey}`, label: group.label });
			for (const view of group.views) {
				flat.push({ kind: "entity", key: `e:${view.id}`, id: view.id, entityIndex });
				entityIndex++;
			}
		}

		const prevByKey = new Map(prevRows.map((r) => [r.key, r]));
		let changed = flat.length !== prevRows.length;
		const out = flat.map((row, i) => {
			const prev = prevByKey.get(row.key);
			if (prev && sameRow(prev, row)) {
				if (prev !== prevRows[i]) changed = true;
				return prev;
			}
			changed = true;
			return row;
		});
		if (!changed) return prevRows;
		prevRows = out;
		return out;
	});

	const entityRows = createMemo(
		() => rows().filter((r) => r.kind === "entity") as Extract<ListRow, { kind: "entity" }>[],
	);

	// Prefix-summed pixel offsets; offsets()[i] is the top of row i.
	const offsets = createMemo(() => {
		const r = rows();
		const out = new Array<number>(r.length + 1);
		out[0] = 0;
		for (let i = 0; i < r.length; i++) {
			const row = r[i];
			const h = row && row.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT;
			out[i + 1] = (out[i] ?? 0) + h;
		}
		return out;
	});

	const totalHeight = () => offsets()[rows().length] ?? 0;

	const visibleSlice = createMemo(() => {
		const off = offsets();
		const count = rows().length;
		if (count === 0) return { start: 0, end: 0 };
		const topEdge = scrollTop() - OVERSCAN_PX;
		const bottomEdge = scrollTop() + viewportHeight() + OVERSCAN_PX;
		let lo = 0;
		let hi = count - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if ((off[mid + 1] ?? 0) > topEdge) hi = mid;
			else lo = mid + 1;
		}
		const start = lo;
		let end = start;
		while (end < count && (off[end] ?? 0) < bottomEdge) end++;
		return { start, end };
	});

	// Slice arrays are new per scroll tick, but the row objects inside keep
	// their references, so <For> only mounts/unmounts rows entering/leaving
	// the overscan window and repositions the rest.
	const visibleRows = createMemo(() => {
		const { start, end } = visibleSlice();
		return rows().slice(start, end);
	});

	const rowIndexByKey = createMemo(() => {
		const map = new Map<string, number>();
		rows().forEach((row, i) => {
			map.set(row.key, i);
		});
		return map;
	});

	const rowTop = (row: ListRow) => {
		const idx = rowIndexByKey().get(row.key);
		return idx == null ? 0 : (offsets()[idx] ?? 0);
	};

	// The scroll container mounts lazily (popover/sheet open), so the observer
	// attaches via ref callback rather than component onMount.
	const attachScrollRef = (el: HTMLDivElement) => {
		scrollRef = el;
		setScrollTop(el.scrollTop);
		setViewportHeight(el.clientHeight);
		const observer = new ResizeObserver(() => setViewportHeight(el.clientHeight));
		observer.observe(el);
		onCleanup(() => {
			observer.disconnect();
			if (scrollRef === el) scrollRef = undefined;
		});
	};

	createEffect(
		on(
			search,
			() => {
				setActiveIndex(0);
				scrollRef?.scrollTo({ top: 0 });
				setScrollTop(0);
			},
			{ defer: true },
		),
	);

	createEffect(() => {
		const max = entityRows().length - 1;
		if (activeIndex() > max) setActiveIndex(Math.max(0, max));
	});

	const ensureActiveVisible = (entityIndex: number) => {
		if (!scrollRef) return;
		const rowIdx = rows().findIndex((r) => r.kind === "entity" && r.entityIndex === entityIndex);
		if (rowIdx < 0) return;
		const top = offsets()[rowIdx] ?? 0;
		const bottom = top + ROW_HEIGHT;
		if (top < scrollRef.scrollTop) scrollRef.scrollTo({ top });
		else if (bottom > scrollRef.scrollTop + scrollRef.clientHeight)
			scrollRef.scrollTo({ top: bottom - scrollRef.clientHeight });
	};

	const optionId = (entityIndex: number) => `${listboxId}-option-${entityIndex}`;
	// Only names a row the list is actually rendering: the virtualiser unmounts
	// the rest, and aria-activedescendant must point at a live element.
	const activeOptionId = () =>
		!isMobile() && visibleRows().some((r) => r.kind === "entity" && r.entityIndex === activeIndex())
			? optionId(activeIndex())
			: undefined;

	const closePicker = () => {
		setOpen(false);
		setSearch("");
		setActiveIndex(0);
	};

	// A re-tap on the picked entity clears it, the way every picker toggles.
	const toggleEntity = (entityId: string) => {
		if (props.multiple === false) {
			props.onEntityIdsChange(props.entityIds.includes(entityId) ? [] : [entityId]);
			closePicker();
			return;
		}
		const current = props.entityIds;
		if (current.includes(entityId)) {
			props.onEntityIdsChange(current.filter((id) => id !== entityId));
		} else {
			props.onEntityIdsChange([...current, entityId]);
		}
	};

	const removeEntity = (entityId: string) => {
		props.onEntityIdsChange(props.entityIds.filter((id) => id !== entityId));
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		const total = entityRows().length;
		if (e.key === "ArrowDown" && total > 0) {
			e.preventDefault();
			const next = (activeIndex() + 1) % total;
			setActiveIndex(next);
			ensureActiveVisible(next);
		} else if (e.key === "ArrowUp" && total > 0) {
			e.preventDefault();
			const next = (activeIndex() - 1 + total) % total;
			setActiveIndex(next);
			ensureActiveVisible(next);
		} else if (e.key === "Home" && total > 0) {
			e.preventDefault();
			setActiveIndex(0);
			ensureActiveVisible(0);
		} else if (e.key === "End" && total > 0) {
			e.preventDefault();
			setActiveIndex(total - 1);
			ensureActiveVisible(total - 1);
		} else if (e.key === "Enter" && total > 0) {
			e.preventDefault();
			const row = entityRows()[activeIndex()];
			if (row) toggleEntity(row.id);
		} else if (e.key === "Escape") {
			e.preventDefault();
			closePicker();
		}
	};

	const triggerLabel = () => {
		const count = props.entityIds.length;
		if (count === 0) return null;
		if (count === 1) {
			const id = props.entityIds[0] ?? "";
			const view = data.getEntityView(id);
			return view?.friendlyName ?? id;
		}
		return `${count} entities selected`;
	};

	const triggerIcon = () => {
		if (props.entityIds.length !== 1) return null;
		const id = props.entityIds[0] ?? "";
		return data.getEntityView(id)?.icon ?? null;
	};

	const isSingle = () => props.multiple === false;
	const showTriggerClear = () => props.entityIds.length > 0;

	const clearSelection = () => {
		props.onEntityIdsChange([]);
	};

	const TriggerButton = (p: { onClick: () => void }) => (
		<PickerTrigger
			slot="entity-selector-trigger"
			role="combobox"
			open={open()}
			onToggle={p.onClick}
			aria-labelledby={props["aria-labelledby"]}
			aria-expanded={open()}
			aria-controls={listboxId}
			aria-haspopup="listbox"
			onClear={showTriggerClear() ? clearSelection : undefined}
		>
			<Show when={triggerIcon()}>
				{(icon) => (
					<Icon icon={icon()} width={16} height={16} class="shrink-0 text-muted-foreground" />
				)}
			</Show>
			<Show
				when={triggerLabel()}
				fallback={
					<span class="flex-1 truncate text-left text-muted-foreground">
						Select {props.domain} {isSingle() ? "entity" : "entities"}...
					</span>
				}
			>
				{(label) => <span class="flex-1 truncate text-left">{label()}</span>}
			</Show>
		</PickerTrigger>
	);

	const EntityRow = (p: { id: string; entityIndex: number; top: number }) => {
		const view = createMemo(() => data.getEntityView(p.id));
		const selected = () => selectedSet().has(p.id);
		const unavailable = () => {
			const v = view();
			return v == null || isUnavailable(v);
		};
		const state = () => {
			const v = view();
			return v ? stateLabel(v) : "";
		};
		return (
			<PickerRow
				role="option"
				id={optionId(p.entityIndex)}
				data-slot="entity-selector-row"
				aria-selected={selected()}
				data-highlighted={(!isMobile() && activeIndex() === p.entityIndex) || undefined}
				class="absolute inset-x-0"
				style={{ top: `${p.top}px`, height: `${ROW_HEIGHT}px` }}
				icon={view()?.icon ?? FALLBACK_ICON}
				title={view()?.friendlyName ?? p.id}
				subtitle={p.id}
				meta={state()}
				selected={selected()}
				multi={!isSingle()}
				dimmed={unavailable()}
				onMouseMove={() => setActiveIndex(p.entityIndex)}
				onClick={() => toggleEntity(p.id)}
			/>
		);
	};

	const PickerContent = () => (
		<div class="flex min-h-0 flex-1 flex-col">
			<PickerSearch
				inputRef={(el) => {
					inputRef = el;
				}}
				type="search"
				role="combobox"
				aria-label={`Search ${props.domain} entities`}
				aria-controls={listboxId}
				aria-expanded
				aria-activedescendant={activeOptionId()}
				placeholder="Search by name, room, or ID..."
				value={search()}
				onValueChange={setSearch}
				onKeyDown={handleKeyDown}
				clearLabel="Clear search"
				size={isMobile() ? "touch" : "default"}
				class="[&_input::-webkit-search-cancel-button]:hidden"
			/>
			<div
				ref={attachScrollRef}
				id={listboxId}
				role="listbox"
				aria-multiselectable={!isSingle()}
				aria-label={`${props.domain} entities`}
				data-sheet-scroll=""
				class={cn(
					"min-h-0 flex-1 touch-pan-y overscroll-contain px-1 py-1",
					PICKER_LIST,
					isMobile() && "max-h-none",
				)}
				onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
			>
				<Show
					when={rows().length > 0}
					fallback={
						<div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
							<Show
								when={search().trim()}
								fallback={
									<Show
										when={diagnosticCount() > 0}
										fallback={
											<Show
												when={classExcludedCount() > 0}
												fallback={
													<span class="text-muted-foreground text-sm">
														No {props.domain} entities found in your home
													</span>
												}
											>
												<span class="text-muted-foreground text-sm">{classExcludedMessage()}</span>
											</Show>
										}
									>
										<span class="text-muted-foreground text-sm">
											Only diagnostic {props.domain} entities available
										</span>
										<button
											type="button"
											class="text-primary text-sm hover:underline"
											onClick={() => setShowDiagnostics(true)}
										>
											Show diagnostic entities
										</button>
									</Show>
								}
							>
								<span class="text-muted-foreground text-sm">
									No matches for "{search().trim()}"
								</span>
								<button
									type="button"
									class="text-primary text-sm hover:underline"
									onClick={() => setSearch("")}
								>
									Clear search
								</button>
							</Show>
						</div>
					}
				>
					<SlidingIndicator
						activeSelector="[data-highlighted]"
						orientation="vertical"
						indicatorClass="rounded-sm"
						role="presentation"
						style={{ height: `${totalHeight()}px` }}
					>
						<For each={visibleRows()}>
							{(row) =>
								row.kind === "header" ? (
									<div
										class={cn(MENU_LABEL, "absolute inset-x-0 flex items-end px-2 pb-1")}
										style={{
											top: `${rowTop(row)}px`,
											height: `${HEADER_HEIGHT}px`,
										}}
										aria-hidden="true"
									>
										{row.label}
									</div>
								) : (
									<EntityRow id={row.id} entityIndex={row.entityIndex} top={rowTop(row)} />
								)
							}
						</For>
					</SlidingIndicator>
				</Show>
			</div>
			<Show when={diagnosticCount() > 0 || props.deviceClass}>
				<div class="flex shrink-0 items-center justify-between gap-2 border-border/50 border-t px-3 py-2">
					<span class="truncate text-muted-foreground text-xs">
						{props.deviceClass ? `Showing ${props.deviceClass} entities only` : ""}
					</span>
					<Show when={diagnosticCount() > 0}>
						<button
							type="button"
							class="shrink-0 text-muted-foreground text-xs transition-colors hover:text-foreground"
							onClick={() => setShowDiagnostics(!showDiagnostics())}
						>
							{showDiagnostics() ? "Hide diagnostic" : `Show diagnostic (${diagnosticCount()})`}
						</button>
					</Show>
				</div>
			</Show>
		</div>
	);

	const SelectedChips = () => (
		<Show when={!isSingle() && props.entityIds.length > 0}>
			<div class="flex flex-wrap gap-1.5">
				<For each={props.entityIds}>
					{(id) => {
						const view = createMemo(() => data.getEntityView(id));
						const unavailable = () => {
							const v = view();
							return v != null && isUnavailable(v);
						};
						return (
							<span
								class={`inline-flex max-w-full items-stretch overflow-hidden rounded-md border border-border bg-secondary/50 text-secondary-foreground text-xs ${
									unavailable() ? "opacity-60" : ""
								}`}
							>
								<span class="flex min-w-0 items-center gap-1.5 py-1.5 pl-2">
									<Icon
										icon={view()?.icon ?? FALLBACK_ICON}
										width={14}
										height={14}
										class="shrink-0 text-muted-foreground"
									/>
									<span class="truncate">{view()?.friendlyName ?? id}</span>
								</span>
								<button
									type="button"
									aria-label={`Remove ${view()?.friendlyName ?? id}`}
									class="flex w-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
									onClick={() => removeEntity(id)}
								>
									<Icon icon="lucide:x" width={14} height={14} class="size-3.5" />
								</button>
							</span>
						);
					}}
				</For>
			</div>
		</Show>
	);

	// One shell per viewport, one list: the sheet and the panel host the same
	// PickerContent, so a fix to the list can never land in only one of them.
	const ContentHost: ParentComponent = (p) => (
		<Show
			when={isMobile()}
			fallback={
				<PopoverContent
					class="flex min-w-72 flex-col"
					onOpenAutoFocus={(e) => {
						e.preventDefault();
						// preventScroll: the panel is portalled at (0,0) until the popper places it,
						// so a plain focus() scrolls the page to the top.
						inputRef?.focus({ preventScroll: true });
					}}
					onInteractOutside={() => closePicker()}
				>
					{p.children}
				</PopoverContent>
			}
		>
			<BottomSheet
				open={open()}
				onOpenChange={(isOpen) => {
					if (!isOpen) closePicker();
				}}
			>
				<BottomSheetPortal>
					<BottomSheetOverlay />
					<BottomSheetContent
						class="h-[85dvh] pb-[env(safe-area-inset-bottom)]"
						ariaLabel={`Select ${props.domain} entities`}
					>
						<BottomSheetHandle />
						{p.children}
					</BottomSheetContent>
				</BottomSheetPortal>
			</BottomSheet>
		</Show>
	);

	return (
		<div class="flex flex-col gap-2">
			<Popover
				surface="field"
				open={open() && !isMobile()}
				onOpenChange={(isOpen) => {
					if (!isOpen) closePicker();
				}}
				modal
			>
				<PopoverAnchor as="div">
					<TriggerButton onClick={() => (open() ? closePicker() : setOpen(true))} />
				</PopoverAnchor>
				<ContentHost>
					<PickerContent />
				</ContentHost>
			</Popover>
			<SelectedChips />
		</div>
	);
}
