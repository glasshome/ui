import { useAreas } from "@glasshome/sync-layer/solid";
import { Icon } from "@iconify-icon/solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes";
import { OVERLAY_SURFACE } from "../lib/overlay-classes";
import { Input } from "./input";
import { anchorToTriggerTop, Popover, PopoverAnchor } from "./popover";
import { SlidingIndicator } from "./sliding-indicator";

interface AreaPickerProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	class?: string;
	allowClear?: boolean;
}

export function AreaPicker(props: AreaPickerProps) {
	const [open, setOpen] = createSignal(false);
	const [search, setSearch] = createSignal("");

	const areas = useAreas();

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

	const selectedLabel = createMemo(() => {
		const v = props.value;
		if (!v) return undefined;
		return areaList().find((a) => a.id === v);
	});

	// One glass pill (SlidingIndicator) tracks the active row and animates between
	// rows, exactly like the Select. The pill is an absolutely-positioned layer, so
	// unlike a per-row `glass` border it never nudges row height. Children of the
	// indicator are [optional Clear button, ...filtered areas]; `active` is that
	// child index. Hover wins; otherwise the pill rests on the selected area.
	const [hovered, setHovered] = createSignal<number | null>(null);
	const showClear = () => props.allowClear !== false && !!props.value;
	const selectedIndex = createMemo(() => {
		if (!props.value) return null;
		const j = filtered().findIndex((a) => a.id === props.value);
		return j < 0 ? null : j + (showClear() ? 1 : 0);
	});
	const activeIndex = () => hovered() ?? selectedIndex();

	const selectArea = (areaId: string) => {
		props.onChange(areaId);
		setOpen(false);
		setSearch("");
	};

	const clear = () => {
		props.onChange("");
		setOpen(false);
		setSearch("");
	};

	return (
		<Popover
			open={open()}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setOpen(false);
					setSearch("");
				}
			}}
			modal
			gutter={0}
			getAnchorRect={anchorToTriggerTop}
		>
			<PopoverAnchor as="div" class={props.class}>
				<button
					type="button"
					class={`flex h-9 w-full items-center gap-2 rounded-md ${INPUT_SURFACE} hover:[--glass-light:0.09] px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`}
					onClick={() => setOpen(!open())}
				>
					<Show
						when={selectedLabel()}
						fallback={
							<span class="flex-1 text-left text-muted-foreground">
								{props.placeholder ?? "Select area..."}
							</span>
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
			<Popover.Portal>
				<Popover.Content
					data-slot="popover-content"
					class={`${OVERLAY_SURFACE} relative z-50 w-[var(--kb-popper-anchor-width)] overflow-hidden rounded-md text-popover-foreground outline-hidden data-[closed]:animate-select-out data-[expanded]:animate-select-in`}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={() => setOpen(false)}
				>
					<div class="flex flex-col">
						<div class="border-b px-3 py-2">
							<Input
								type="text"
								placeholder="Search areas..."
								value={search()}
								onInput={(e) => setSearch(e.currentTarget.value)}
								class="border-none bg-transparent shadow-none outline-none focus-visible:ring-0"
							/>
						</div>
						<div class="max-h-[280px] overflow-y-auto">
							<Show when={filtered().length === 0}>
								<div class="py-4 text-center text-muted-foreground text-sm">No areas found</div>
							</Show>
							<SlidingIndicator
								orientation="vertical"
								active={activeIndex()}
								class="flex flex-col gap-0.5 p-1"
								onMouseLeave={() => setHovered(null)}
							>
								<Show when={showClear()}>
									<button
										type="button"
										class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
										onMouseEnter={() => setHovered(0)}
										onClick={clear}
									>
										<div class="flex size-[18px] shrink-0 items-center justify-center">
											<Icon
												icon="mdi:close-circle-outline"
												width={18}
												height={18}
												class="text-muted-foreground"
											/>
										</div>
										<span class="text-muted-foreground">Clear selection</span>
									</button>
								</Show>
								<For each={filtered()}>
									{(area, j) => (
										<button
											type="button"
											class="group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
											classList={{
												"text-foreground": props.value === area.id,
											}}
											onMouseEnter={() => setHovered(j() + (showClear() ? 1 : 0))}
											onClick={() => selectArea(area.id)}
										>
											<div class="flex size-[18px] shrink-0 items-center justify-center">
												<Icon icon={area.icon || "mdi:home-floor-1"} width={18} height={18} />
											</div>
											<div class="flex min-w-0 flex-1 flex-col">
												<span class="truncate font-medium">{area.name}</span>
											</div>
											<span
												class="shrink-0 text-muted-foreground text-xs group-hover:text-foreground/60"
												classList={{
													"!text-foreground/60": props.value === area.id,
												}}
											>
												{area.entityCount} entities
											</span>
										</button>
									)}
								</For>
							</SlidingIndicator>
						</div>
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover>
	);
}
