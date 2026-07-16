import {
	type Component,
	type ComponentProps,
	createSignal,
	mergeProps,
	onCleanup,
	onMount,
} from "solid-js";
import { Toaster as SolidSonner } from "solid-sonner";
import { glassSurface, glassToneText } from "../lib/glass-tone";

type Position = ComponentProps<typeof SolidSonner>["position"];

// Toast tones by sonner type — same tone map as <Alert>, so a success toast and
// a success alert wear the identical glasshome glass. Default (plain toast()) is
// left neutral (frosted --card) via the base class below.
const TOAST_TONES: Record<string, string> = {
	success: "var(--success)",
	error: "var(--destructive)",
	warning: "var(--warning)",
	info: "var(--primary)",
};

const toCss = (o: Record<string, string>) =>
	Object.entries(o)
		.map(([k, v]) => `${k}:${v} !important`)
		.join(";");

// A toast floats over the page, so it needs a stronger drop shadow than a badge
// and a crisper top shine to read at its larger size. The tint/border/frost stay
// exactly glassSurface(); only the box-shadow is retuned for the toast: a bright
// 1px top hairline (the "border shine"), the same tone under-glow, and a real
// floating shadow. Badge/alert keep glassSurface's own subtler shadow untouched.
const toastShadow = (color: string) =>
	`inset 0 1px 0 oklch(1 0 0 / 0.4), inset 0 -2px 6px color-mix(in srgb, ${color} 16%, transparent), 0 10px 30px -8px oklch(0 0 0 / 0.5)`;

const toastGlassRule = (color: string) => {
	const { "box-shadow": _drop, ...surface } = glassSurface(color);
	return `${toCss(surface)};box-shadow:${toastShadow(color)} !important;color:${glassToneText(color)} !important`;
};

// Generated from the shared glassSurface() so the toast tint never drifts from
// the badge/alert glass. Selector is scoped + attribute-specific to outrank
// sonner's own `!important` utility classes. Message tinted (glassToneText),
// description stays muted (its own class), the type icon carries the accent. The
// base rule frosts + shines the neutral default toast (no tone) too.
const TOAST_GLASS_CSS = [
	`[data-sonner-toaster] [data-sonner-toast]{backdrop-filter:blur(8px) saturate(180%) !important;-webkit-backdrop-filter:blur(8px) saturate(180%) !important;box-shadow:inset 0 1px 0 oklch(1 0 0 / 0.3), 0 10px 30px -8px oklch(0 0 0 / 0.5) !important}`,
	...Object.entries(TOAST_TONES).map(
		([type, color]) =>
			`[data-sonner-toaster] [data-sonner-toast][data-type="${type}"]{${toastGlassRule(color)}}`,
	),
].join("");

function useIsMobile(breakpoint = 768) {
	const [mobile, setMobile] = createSignal(
		typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
	);

	onMount(() => {
		const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
		setMobile(mq.matches);
		const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
		mq.addEventListener("change", handler);
		onCleanup(() => mq.removeEventListener("change", handler));
	});

	return mobile;
}

const Toaster: Component<ComponentProps<typeof SolidSonner>> = (rawProps) => {
	const isMobile = useIsMobile();
	const props = mergeProps(
		{
			theme: "dark" as const,
			duration: 3000,
			gap: 8,
			visibleToasts: 3,
		},
		rawProps,
	);

	const position = (): Position => props.position ?? (isMobile() ? "top-center" : "bottom-right");

	return (
		<>
			{/* Per-type glass, generated from the shared glassSurface() (see top). */}
			{/* eslint-disable-next-line solid/no-innerhtml */}
			<style innerHTML={TOAST_GLASS_CSS} />
			<SolidSonner
				{...props}
				position={position()}
				class="toaster group"
				toastOptions={{
					classes: {
						toast:
							"group toast group-[.toaster]:!bg-card/80 group-[.toaster]:!text-foreground group-[.toaster]:!border-border group-[.toaster]:!shadow-lg group-[.toaster]:!rounded-xl group-[.toaster]:!text-sm group-[.toaster]:!py-3 group-[.toaster]:!px-4",
						description: "group-[.toast]:!text-muted-foreground group-[.toast]:!text-xs",
						actionButton: "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground",
						cancelButton: "group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground",
					},
					...props.toastOptions,
				}}
			/>
		</>
	);
};

export { toast } from "solid-sonner";
export { Toaster };
