import { CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-solid";
import {
	type Component,
	type ComponentProps,
	createSignal,
	type JSX,
	mergeProps,
	onCleanup,
	onMount,
	Show,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { type ExternalToast, Toaster as SolidSonner, toast as sonnerToast } from "solid-sonner";
import {
	ALERT_CLASS,
	ALERT_CONTENT_CLASS,
	ALERT_DESCRIPTION_CLASS,
	ALERT_ICON_BG_CLASS,
	ALERT_ICON_CLASS,
	ALERT_TITLE_CLASS,
	alertIconBgStyle,
} from "../lib/alert-tones";
import { glassToneText } from "../lib/glass-tone";
import { cn } from "../lib/utils";
import { Spinner } from "./spinner";

type Position = ComponentProps<typeof SolidSonner>["position"];
type ToastMessage = JSX.Element | string;

// ─── Glass toast card ────────────────────────────────────────────────────────
// A toast IS an alert. Rather than fight sonner's default chrome with CSS
// overrides (its border/background/box-shadow repaint kept killing our rim), we
// render our OWN card via toast.custom() with the Toaster set `unstyled`. The
// card is built from the exact same pieces as <Alert>: the shared glassSurface()
// tint, glassToneText() title, and the alert icon-chip tokens — so a toast and
// an alert of the same kind are visually identical, no drift possible.

type ToastKind = "success" | "error" | "warning" | "info" | "loading" | "message";

// Same tone map as <Alert>. `null` = neutral (message / loading): a frosted
// --card surface, no color.
const KIND_TONE: Record<ToastKind, string | null> = {
	success: "var(--success)",
	error: "var(--destructive)",
	warning: "var(--warning)",
	info: "var(--primary)",
	loading: null,
	message: null,
};

const KIND_ICON: Record<ToastKind, Component<{ size?: number }> | null> = {
	success: CircleCheck,
	error: OctagonAlert,
	warning: TriangleAlert,
	info: Info,
	loading: null,
	message: null,
};

// NOTE: no `backdrop-filter` on toasts. sonner animates the toast's transform
// (slide/stack), and a backdrop-filter on a transform-animated element renders
// solid black mid-animation in Chromium. So instead of frosting what's behind
// (the badge/alert trick), the toast composites the SAME tone over an opaque
// --card base — glassy look, but nothing to blur, so it animates cleanly.
function toneCardStyle(color: string): JSX.CSSProperties {
	return {
		"border-color": `color-mix(in srgb, ${color} 45%, transparent)`,
		background: `linear-gradient(155deg, color-mix(in srgb, ${color} 24%, var(--card)), color-mix(in srgb, ${color} 8%, var(--card)))`,
		"box-shadow": `inset 0 1px 0 oklch(1 0 0 / 0.18), inset 3px 3px 6px -3px oklch(1 0 0 / 0.5), inset 0 -3px 8px color-mix(in srgb, ${color} 16%, transparent), 0 12px 32px -8px oklch(0 0 0 / 0.5)`,
		color: "var(--foreground)",
	};
}

const NEUTRAL_CARD_STYLE: JSX.CSSProperties = {
	"border-color": "color-mix(in srgb, var(--foreground) 16%, transparent)",
	background:
		"linear-gradient(155deg, color-mix(in srgb, var(--foreground) 6%, var(--card)), var(--card))",
	"box-shadow": "inset 0 1px 0 oklch(1 0 0 / 0.16), inset 3px 3px 6px -3px oklch(1 0 0 / 0.45), 0 12px 32px -8px oklch(0 0 0 / 0.5)",
	color: "var(--foreground)",
};

type GlassToastProps = {
	kind: ToastKind;
	title: ToastMessage;
	description?: ToastMessage;
	icon?: JSX.Element;
	action?: JSX.Element;
};

const GlassToast: Component<GlassToastProps> = (props) => {
	const tone = KIND_TONE[props.kind];
	const ToneIcon = KIND_ICON[props.kind];
	// Toned toasts get the corner watermark (like the alert). Loading keeps a
	// small leading spinner chip; the neutral message toast has no icon at all.
	const watermarkGlyph: JSX.Element | null =
		props.icon ?? (ToneIcon ? <Dynamic component={ToneIcon} /> : null);

	return (
		<div
			data-slot="toast"
			role={props.kind === "error" ? "alert" : "status"}
			class={cn(ALERT_CLASS, "w-[356px] max-w-[calc(100vw-2rem)]")}
			style={tone ? toneCardStyle(tone) : NEUTRAL_CARD_STYLE}
		>
			<Show when={tone && watermarkGlyph}>
				<span
					class={ALERT_ICON_BG_CLASS}
					style={alertIconBgStyle(tone as string)}
					aria-hidden="true"
				>
					{watermarkGlyph}
				</span>
			</Show>
			<Show when={props.kind === "loading"}>
				<span
					class={ALERT_ICON_CLASS}
					style={{
						"background-color": "color-mix(in srgb, var(--foreground) 8%, transparent)",
						color: "var(--foreground)",
					}}
				>
					<Spinner class="size-[18px]" />
				</span>
			</Show>
			<div class={ALERT_CONTENT_CLASS}>
				<Show when={props.title}>
					<p class={ALERT_TITLE_CLASS} style={tone ? { color: glassToneText(tone) } : undefined}>
						{props.title}
					</p>
				</Show>
				<Show when={props.description}>
					<div class={ALERT_DESCRIPTION_CLASS}>{props.description}</div>
				</Show>
			</div>
			<Show when={props.action}>
				<div class="flex shrink-0 items-center">{props.action}</div>
			</Show>
		</div>
	);
};

// ─── toast() API ─────────────────────────────────────────────────────────────
// Drop-in replacement for solid-sonner's `toast`: same helpers/signatures, every
// one now renders a <GlassToast>. All ~200 existing call sites upgrade for free.

const show =
	(kind: ToastKind) =>
	(message: ToastMessage, data: ExternalToast = {}): string | number => {
		// Pull the fields our card renders out of the sonner options, else sonner
		// renders `description` a second time as loose text under the toast.
		const { description, icon, action, ...rest } = data;
		return sonnerToast.custom(
			() => (
				<GlassToast
					kind={kind}
					title={message}
					description={description as ToastMessage | undefined}
					icon={icon ?? undefined}
					action={action as JSX.Element | undefined}
				/>
			),
			{ unstyled: true, ...rest },
		);
	};

type PromiseData<T> = Omit<ExternalToast, "description"> & {
	loading?: ToastMessage;
	success?: ToastMessage | ((data: T) => ToastMessage);
	error?: ToastMessage | ((err: unknown) => ToastMessage);
	finally?: () => void | Promise<void>;
};

const resolveMsg = <T,>(m: ToastMessage | ((v: T) => ToastMessage) | undefined, v: T): ToastMessage =>
	typeof m === "function" ? (m as (v: T) => ToastMessage)(v) : (m ?? "");

function glassPromise<T>(
	promise: Promise<T> | (() => Promise<T>),
	data: PromiseData<T> = {},
): { unwrap: () => Promise<T> } {
	const id = sonnerToast.custom(() => <GlassToast kind="loading" title={data.loading ?? "Loading"} />, {
		unstyled: true,
		duration: Number.POSITIVE_INFINITY,
	});
	const p = typeof promise === "function" ? promise() : promise;
	p.then((v) => {
		sonnerToast.custom(() => <GlassToast kind="success" title={resolveMsg(data.success, v)} />, {
			id,
			unstyled: true,
		});
	})
		.catch((e: unknown) => {
			sonnerToast.custom(() => <GlassToast kind="error" title={resolveMsg(data.error, e)} />, {
				id,
				unstyled: true,
			});
		})
		.finally(() => data.finally?.());
	return { unwrap: () => p };
}

const toast = Object.assign(
	(message: ToastMessage, data?: ExternalToast) => show("message")(message, data),
	{
		success: show("success"),
		error: show("error"),
		warning: show("warning"),
		info: show("info"),
		message: show("message"),
		loading: (message: ToastMessage, data: ExternalToast = {}) => {
			const { description, icon, action, ...rest } = data;
			return sonnerToast.custom(
				() => (
					<GlassToast
						kind="loading"
						title={message}
						description={description as ToastMessage | undefined}
						icon={icon ?? undefined}
						action={action as JSX.Element | undefined}
					/>
				),
				{ unstyled: true, duration: Number.POSITIVE_INFINITY, ...rest },
			);
		},
		custom: sonnerToast.custom,
		dismiss: sonnerToast.dismiss,
		promise: glassPromise,
		getHistory: sonnerToast.getHistory,
		getToasts: sonnerToast.getToasts,
	},
);

// ─── Toaster host ────────────────────────────────────────────────────────────

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
	const props = mergeProps({ duration: 3000, gap: 8, visibleToasts: 3 }, rawProps);
	const position = (): Position => props.position ?? (isMobile() ? "top-center" : "bottom-right");

	// Every toast is a fully custom <GlassToast>; `unstyled` strips sonner's own
	// card chrome so our glass surface is the whole visual.
	return (
		<SolidSonner
			{...props}
			position={position()}
			class="toaster group"
			toastOptions={{ unstyled: true, ...props.toastOptions }}
		/>
	);
};

export { GlassToast, Toaster, toast };
