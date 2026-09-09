import { createMemo, createSignal, For, Show } from "solid-js";
import { MENU_ITEM } from "../lib/menu-classes.js";
import { STAGGER } from "../lib/motion-classes.js";
import { PICKER_LIST, PICKER_TRIGGER } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { useEntityData } from "./entity-data.js";
import { Icon } from "./icon.js";
import { PickerRow } from "./picker-row.js";
import { PickerSearch } from "./picker-search.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";
import { SlidingIndicator } from "./sliding-indicator.js";

interface AreaPickerBaseProps {
	placeholder?: string;
	class?: string;
	/** false: a re-tap on the picked area keeps it instead of clearing. */
	allowClear?: boolean;
	/** A read-only caller renders the real picker dimmed, never a plain text line. */
	disabled?: boolean;
	/** Id of the element naming the trigger, for forms that label it outside. */
	"aria-labelledby"?: string;
}

interface AreaPickerSingleProps extends AreaPickerBaseProps {
	value: string;
	onChange: (value: string) => void;
	values?: undefined;
	onValuesChange?: undefined;
}

interface AreaPickerMultiProps extends AreaPickerBaseProps {
	values: string[];
	onValuesChange: (values: string[]) => void;
	value?: undefined;
	onChange?: undefined;
}

type AreaPickerProps = AreaPickerSingleProps | AreaPickerMultiProps;

export function AreaPicker(props: AreaPickerProps) {
	const data = useEntityData();
	const [open, setOpen] = createSignal(false);
	const [search, setSearch] = createSignal("");

	const areas = data.useAreas();

	const areaList = createMemo(() =>
		areas().map((a) => ({
			id: a.id,
			name: a.name,
			icon: a.icon,
			entityCount: a.entityIds.length,
		})),
	);

	const filtered = createMemo(() => {
		const q = search().trim().toLowerCase();
		if (!q) return areaList();
		return areaList().filter(
			(a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q),
		);
	});

	const multi = () => props.values !== undefined;
	// Only ids the home still has: a stale grant shows as its own greyed row and
	// leaves the value on the next toggle.
	const selected = createMemo(() => {
		const ids = props.values ?? [];
		return ids.filter((id) => areaList().some((a) => a.id === id));
	});
	const missing = createMemo(() => {
		const q = search().trim().toLowerCase();
		return (props.values ?? [])
			.filter((id) => !areaList().some((a) => a.id === id))
			.filter((id) => !q || id.toLowerCase().includes(q));
	});
	const isSelected = (areaId: string) =>
		multi() ? selected().includes(areaId) : props.value === areaId;

	const triggerArea = createMemo(() => {
		if (!multi()) {
			const v = props.value;
			return v ? areaList().find((a) => a.id === v) : undefined;
		}
		const only = selected();
		return only.length === 1 ? areaList().find((a) => a.id === only[0]) : undefined;
	});

	// One glass pill (SlidingIndicator) tracks the highlighted row and animates
	// between rows, exactly like the Select. Hover wins; otherwise the pill rests
	// on a selected row, which in multi mode is the first one still listed.
	const [hovered, setHovered] = createSignal<string | null>(null);
	const restingId = createMemo(() => {
		const list = filtered();
		if (!multi()) return list.some((a) => a.id === props.value) ? (props.value ?? null) : null;
		const ids = selected();
		return list.find((a) => ids.includes(a.id))?.id ?? null;
	});
	const highlightedId = () => hovered() ?? restingId();

	// A re-tap on the picked area clears it, the way every other picker toggles.
	const selectArea = (areaId: string) => {
		if (props.disabled) return;
		props.onChange?.(areaId === props.value && props.allowClear !== false ? "" : areaId);
		setOpen(false);
		setSearch("");
	};

	const toggleArea = (areaId: string) => {
		if (props.disabled) return;
		const current = selected();
		props.onValuesChange?.(
			current.includes(areaId) ? current.filter((id) => id !== areaId) : [...current, areaId],
		);
	};

	return (
		<Popover
			surface="field"
			open={open()}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setOpen(false);
					setSearch("");
				}
			}}
			modal
		>
			<PopoverAnchor as="div" class={props.class}>
				<button
					type="button"
					data-slot="area-picker-trigger"
					data-expanded={open() || undefined}
					aria-labelledby={props["aria-labelledby"]}
					class={PICKER_TRIGGER}
					disabled={props.disabled}
					onClick={() => setOpen(!open())}
				>
					<Show
						when={triggerArea()}
						fallback={
							<Show
								when={selected().length > 1}
								fallback={
									<span class="flex-1 text-left text-muted-foreground">
										{props.placeholder ?? (multi() ? "Select areas..." : "Select area...")}
									</span>
								}
							>
								<span class="flex-1 truncate text-left">{selected().length} rooms</span>
							</Show>
						}
					>
						{(area) => (
							<>
								<div class="flex size-4 shrink-0 items-center justify-center">
									<Icon icon={area().icon || "mdi:home-floor-1"} width={16} height={16} />
								</div>
								<span class="flex-1 truncate text-left">{area().name}</span>
							</>
						)}
					</Show>
					<Icon
						icon="mdi:chevron-down"
						width={16}
						height={16}
						class="shrink-0 text-muted-foreground"
					/>
				</button>
			</PopoverAnchor>
			<PopoverContent
				onOpenAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={() => setOpen(false)}
			>
				<div class="flex flex-col">
					<PickerSearch
						value={search()}
						onValueChange={setSearch}
						placeholder="Search areas..."
						aria-label="Search areas"
					/>
					<SlidingIndicator
						activeSelector="[data-highlighted]"
						orientation="vertical"
						indicatorClass="rounded-sm"
						class={cn("flex flex-col gap-0.5 p-1", STAGGER, PICKER_LIST)}
						onMouseLeave={() => setHovered(null)}
					>
						<Show when={filtered().length === 0 && missing().length === 0}>
							<div class="py-4 text-center text-muted-foreground text-sm">No areas found</div>
						</Show>
						<For each={missing()}>
							{(areaId) => (
								<div
									data-slot="area-picker-missing"
									class={cn(MENU_ITEM, "text-muted-foreground/60")}
								>
									<span class="truncate">{areaId}</span>
									<span class="shrink-0 text-xs">no longer exists</span>
								</div>
							)}
						</For>
						<For each={filtered()}>
							{(area) => (
								<PickerRow
									as="button"
									type="button"
									data-slot="area-picker-row"
									data-highlighted={highlightedId() === area.id || undefined}
									aria-pressed={multi() ? isSelected(area.id) : undefined}
									icon={area.icon || "mdi:home-floor-1"}
									title={area.name}
									subtitle={`${area.entityCount} ${area.entityCount === 1 ? "entity" : "entities"}`}
									selected={isSelected(area.id)}
									multi={multi()}
									onMouseEnter={() => setHovered(area.id)}
									onClick={() => (multi() ? toggleArea(area.id) : selectArea(area.id))}
								/>
							)}
						</For>
					</SlidingIndicator>
				</div>
			</PopoverContent>
		</Popover>
	);
}
