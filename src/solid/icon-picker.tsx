import { createMemo, createSignal, For, Show } from "solid-js";
import { STAGGER } from "../lib/motion-classes.js";
import { PICKER_LIST } from "../lib/picker-classes.js";
import { CHIP, ICON_PILL_TINT } from "../lib/pill-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { PickerSearch } from "./picker-search.js";
import { PickerTrigger } from "./picker-trigger.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";

const ICON_LIBRARIES = [
	{ prefix: "", label: "All" },
	{ prefix: "mdi", label: "MDI" },
	{ prefix: "lucide", label: "Lucide" },
	{ prefix: "solar", label: "Solar" },
	{ prefix: "tabler", label: "Tabler" },
	{ prefix: "ph", label: "Phosphor" },
	{ prefix: "fluent", label: "Fluent" },
] as const;

const COMMON_ICONS: Record<string, string[]> = {
	mdi: [
		"mdi:home",
		"mdi:home-outline",
		"mdi:lightbulb",
		"mdi:lightbulb-outline",
		"mdi:lamp",
		"mdi:ceiling-light",
		"mdi:floor-lamp",
		"mdi:led-strip",
		"mdi:power-plug",
		"mdi:power-socket",
		"mdi:toggle-switch",
		"mdi:thermometer",
		"mdi:thermostat",
		"mdi:air-conditioner",
		"mdi:fan",
		"mdi:water",
		"mdi:fire",
		"mdi:snowflake",
		"mdi:weather-partly-cloudy",
		"mdi:lock",
		"mdi:lock-open",
		"mdi:door",
		"mdi:door-open",
		"mdi:window-closed",
		"mdi:window-open",
		"mdi:garage",
		"mdi:gate",
		"mdi:blinds",
		"mdi:television",
		"mdi:speaker",
		"mdi:cast",
		"mdi:camera",
		"mdi:cctv",
		"mdi:motion-sensor",
		"mdi:smoke-detector",
		"mdi:bell",
		"mdi:battery",
		"mdi:solar-power",
		"mdi:robot-vacuum",
		"mdi:washing-machine",
		"mdi:fridge",
		"mdi:stove",
		"mdi:bed",
		"mdi:sofa",
		"mdi:shower",
		"mdi:car",
		"mdi:wifi",
		"mdi:router-wireless",
		"mdi:view-dashboard",
		"mdi:cog",
		"mdi:star",
		"mdi:heart",
		"mdi:shield-home",
		"mdi:home-floor-1",
		"mdi:home-floor-2",
		"mdi:home-floor-3",
		"mdi:home-group",
		"mdi:office-building",
	],
	lucide: [
		"lucide:home",
		"lucide:lightbulb",
		"lucide:lamp",
		"lucide:lamp-desk",
		"lucide:plug",
		"lucide:power",
		"lucide:thermometer",
		"lucide:flame",
		"lucide:snowflake",
		"lucide:wind",
		"lucide:droplets",
		"lucide:sun",
		"lucide:cloud-sun",
		"lucide:lock",
		"lucide:lock-open",
		"lucide:door-open",
		"lucide:door-closed",
		"lucide:blinds",
		"lucide:tv",
		"lucide:speaker",
		"lucide:camera",
		"lucide:bell",
		"lucide:battery",
		"lucide:car",
		"lucide:wifi",
		"lucide:router",
		"lucide:layout-dashboard",
		"lucide:settings",
		"lucide:star",
		"lucide:heart",
		"lucide:shield",
		"lucide:eye",
		"lucide:zap",
		"lucide:clock",
		"lucide:calendar",
		"lucide:link",
		"lucide:image",
		"lucide:music",
		"lucide:map-pin",
		"lucide:user",
	],
	solar: [
		"solar:home-bold",
		"solar:home-linear",
		"solar:lamp-bold",
		"solar:lightbulb-bolt-bold",
		"solar:plug-circle-bold",
		"solar:temperature-bold",
		"solar:fire-bold",
		"solar:snowflake-bold",
		"solar:lock-bold",
		"solar:lock-unlocked-bold",
		"solar:tv-bold",
		"solar:speaker-bold",
		"solar:camera-bold",
		"solar:bell-bold",
		"solar:battery-charge-bold",
		"solar:wi-fi-router-bold",
		"solar:widget-bold",
		"solar:settings-bold",
		"solar:star-bold",
		"solar:heart-bold",
		"solar:shield-bold",
		"solar:eye-bold",
		"solar:bolt-bold",
		"solar:clock-circle-bold",
		"solar:calendar-bold",
		"solar:link-bold",
		"solar:gallery-bold",
		"solar:music-note-bold",
		"solar:map-point-bold",
		"solar:user-bold",
	],
	tabler: [
		"tabler:home",
		"tabler:bulb",
		"tabler:lamp",
		"tabler:plug",
		"tabler:power",
		"tabler:temperature",
		"tabler:flame",
		"tabler:snowflake",
		"tabler:wind",
		"tabler:droplet",
		"tabler:sun",
		"tabler:cloud",
		"tabler:lock",
		"tabler:lock-open",
		"tabler:door",
		"tabler:window",
		"tabler:device-tv",
		"tabler:speaker",
		"tabler:camera",
		"tabler:bell",
		"tabler:battery",
		"tabler:car",
		"tabler:wifi",
		"tabler:router",
		"tabler:dashboard",
		"tabler:settings",
		"tabler:star",
		"tabler:heart",
		"tabler:shield",
		"tabler:eye",
	],
	ph: [
		"ph:house-bold",
		"ph:lightbulb-bold",
		"ph:lamp-bold",
		"ph:plug-bold",
		"ph:power-bold",
		"ph:thermometer-bold",
		"ph:fire-bold",
		"ph:snowflake-bold",
		"ph:wind-bold",
		"ph:drop-bold",
		"ph:sun-bold",
		"ph:cloud-sun-bold",
		"ph:lock-bold",
		"ph:lock-open-bold",
		"ph:door-bold",
		"ph:television-bold",
		"ph:speaker-high-bold",
		"ph:camera-bold",
		"ph:bell-bold",
		"ph:battery-charging-bold",
		"ph:car-bold",
		"ph:wifi-high-bold",
		"ph:squares-four-bold",
		"ph:gear-bold",
		"ph:star-bold",
		"ph:heart-bold",
		"ph:shield-bold",
		"ph:eye-bold",
		"ph:lightning-bold",
		"ph:clock-bold",
	],
	fluent: [
		"fluent:home-24-filled",
		"fluent:lightbulb-24-filled",
		"fluent:plug-connected-24-filled",
		"fluent:power-24-filled",
		"fluent:temperature-24-filled",
		"fluent:fire-24-filled",
		"fluent:weather-snowflake-24-filled",
		"fluent:lock-closed-24-filled",
		"fluent:lock-open-24-filled",
		"fluent:door-24-filled",
		"fluent:tv-24-filled",
		"fluent:speaker-2-24-filled",
		"fluent:camera-24-filled",
		"fluent:alert-24-filled",
		"fluent:battery-charge-24-filled",
		"fluent:vehicle-car-24-filled",
		"fluent:wifi-1-24-filled",
		"fluent:board-24-filled",
		"fluent:settings-24-filled",
		"fluent:star-24-filled",
		"fluent:heart-24-filled",
		"fluent:shield-24-filled",
		"fluent:eye-24-filled",
		"fluent:flash-24-filled",
		"fluent:clock-24-filled",
		"fluent:calendar-24-filled",
		"fluent:link-24-filled",
		"fluent:image-24-filled",
		"fluent:music-note-1-24-filled",
		"fluent:person-24-filled",
	],
};

export interface IconPickerProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	class?: string;
	/**
	 * Host-provided icon search. The design system carries no network or CSP
	 * policy of its own: dash proxies the Iconify API same-origin so its
	 * connect-src allowlist stays free of third-party origins. Without this the
	 * picker still works, showing the curated set only.
	 */
	searchIcons?: (query: string, prefix: string) => Promise<string[]>;
	/** Id of the element naming the trigger, for forms that label it outside. */
	"aria-labelledby"?: string;
}

export function IconPicker(props: IconPickerProps) {
	const [open, setOpen] = createSignal(false);
	const [search, setSearch] = createSignal("");
	const [activeLib, setActiveLib] = createSignal("");
	const [apiResults, setApiResults] = createSignal<string[]>([]);
	const [loading, setLoading] = createSignal(false);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let searchRef: HTMLInputElement | undefined;

	const searchIcons = (query: string, prefix: string) => {
		clearTimeout(debounceTimer);
		if (!query.trim()) {
			setApiResults([]);
			return;
		}
		const search = props.searchIcons;
		if (!search) return;
		setLoading(true);
		debounceTimer = setTimeout(async () => {
			try {
				setApiResults(await search(query, prefix));
			} catch {
				setApiResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	};

	const defaultIcons = createMemo(() => {
		const lib = activeLib();
		if (!lib) {
			return Object.values(COMMON_ICONS).flat().slice(0, 60);
		}
		return COMMON_ICONS[lib] ?? [];
	});

	const displayIcons = createMemo(() => {
		const q = search().toLowerCase().trim();
		if (!q) return defaultIcons();
		if (apiResults().length > 0) return apiResults();
		return defaultIcons().filter((icon) => icon.toLowerCase().includes(q));
	});

	// A re-tap on the picked icon clears it, the way every picker toggles.
	const selectIcon = (icon: string) => {
		props.onChange(icon === props.value.trim() ? "" : icon);
		setOpen(false);
		setSearch("");
	};

	const clearIcon = () => props.onChange("");

	const handleLibChange = (prefix: string) => {
		setActiveLib(prefix);
		setApiResults([]);
		if (search().trim()) {
			searchIcons(search(), prefix);
		}
	};

	return (
		<Popover surface="field" open={open()} onOpenChange={setOpen} modal>
			<PopoverAnchor as="div" class={props.class}>
				<PickerTrigger
					slot="icon-picker-trigger"
					open={open()}
					onToggle={() => setOpen(!open())}
					aria-labelledby={props["aria-labelledby"]}
					onClear={props.value.trim() ? clearIcon : undefined}
					clearLabel="Clear icon"
				>
					<Show
						when={props.value.trim()}
						fallback={
							<span class="flex-1 text-left text-muted-foreground">
								{props.placeholder ?? "mdi:home"}
							</span>
						}
					>
						<Icon icon={props.value.trim()} width={18} height={18} class="shrink-0" />
						<span class="flex-1 truncate text-left">{props.value}</span>
					</Show>
				</PickerTrigger>
			</PopoverAnchor>
			<PopoverContent
				onOpenAutoFocus={(e) => {
					e.preventDefault();
					// preventScroll: the panel is portalled at (0,0) until the popper places it,
					// so a plain focus() scrolls the page to the top.
					searchRef?.focus({ preventScroll: true });
				}}
				onInteractOutside={() => setOpen(false)}
			>
				<div class="flex flex-col">
					<PickerSearch
						inputRef={(el) => {
							searchRef = el;
						}}
						value={search()}
						onValueChange={(next) => {
							setSearch(next);
							searchIcons(next, activeLib());
						}}
						placeholder="Search icons..."
						aria-label="Search icons"
					/>
					<div class="flex flex-wrap gap-1 border-border/50 border-b px-2 py-1.5">
						<For each={ICON_LIBRARIES}>
							{(lib) => (
								<button
									type="button"
									data-slot="icon-picker-library"
									aria-pressed={activeLib() === lib.prefix}
									class={cn(
										CHIP,
										"cursor-pointer transition-glass",
										activeLib() === lib.prefix
											? "[--glass-tone:var(--primary)]"
											: "text-muted-foreground [--glass-base:transparent] [--glass-edge:transparent] [--glass-light:0] [--glass-rim:0] hover:text-foreground",
									)}
									onClick={() => handleLibChange(lib.prefix)}
								>
									{lib.label}
								</button>
							)}
						</For>
					</div>
					<div class={cn(PICKER_LIST, "p-2")}>
						<Show when={loading() && displayIcons().length === 0}>
							<div class="py-4 text-center text-muted-foreground text-sm">Searching...</div>
						</Show>
						<Show when={!loading() && search().trim() && displayIcons().length === 0}>
							<div class="py-4 text-center text-muted-foreground text-sm">No icons found</div>
						</Show>
						<div class={cn("grid grid-cols-6 gap-1", STAGGER)}>
							<For each={displayIcons()}>
								{(icon) => (
									<button
										type="button"
										aria-pressed={props.value === icon}
										class={cn(
											"mx-auto flex size-11 cursor-pointer items-center justify-center rounded-full transition-glass hover:bg-accent",
											props.value === icon &&
												`${ICON_PILL_TINT} text-foreground [--glass-tone:var(--primary)] hover:bg-transparent`,
										)}
										onClick={() => selectIcon(icon)}
										title={icon}
									>
										<Icon icon={icon} width={22} height={22} />
									</button>
								)}
							</For>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
