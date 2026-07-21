import { Icon } from "@iconify-icon/solid";
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
import { type ExternalToast, Toaster as SolidSonner, toast as sonnerToast } from "solid-sonner";
import {
	ALERT_CLASS,
	ALERT_CONTENT_CLASS,
	ALERT_DESCRIPTION_CLASS,
	ALERT_ICON_BG_CLASS,
	ALERT_ICON_CLASS,
	ALERT_TITLE_CLASS,
	alertIconBgStyle,
} from "../lib/alert-tones.js";
import { glassToneText } from "../lib/glass-tone.js";
import { cn } from "../lib/utils.js";
import { Spinner } from "./spinner.js";

type Position = ComponentProps<typeof SolidSonner>["position"];
type ToastMessage = JSX.Element | string;

type ToastKind = "success" | "error" | "warning" | "info" | "loading" | "message";

const KIND_TONE: Record<ToastKind, string | null> = {
	success: "var(--success)",
	error: "var(--destructive)",
	warning: "var(--warning)",
	info: "var(--primary)",
	loading: null,
	message: null,
};

const KIND_ICON: Record<ToastKind, string | null> = {
	success: "lucide:circle-check",
	error: "lucide:octagon-alert",
	warning: "lucide:triangle-alert",
	info: "lucide:info",
	loading: null,
	message: null,
};

/* No backdrop-blur on toasts: sonner animates transform, and backdrop-filter on
 * a transform-animated element renders solid black mid-animation in Chromium.
 * The opaque --card base gives the glass look with nothing to blur. Toned and
 * neutral toasts are the same .glass material with a stronger lift. */
const TONE_TOAST_CLASS = "glass glass-tint [--glass-lift:0.5]";
const NEUTRAL_TOAST_CLASS =
	"glass [--glass-tone:var(--foreground)] [--glass-wash:6%] [--glass-glow:0%] [--glass-drop:0%] [--glass-edge:color-mix(in_srgb,var(--foreground)_16%,transparent)] [--glass-lift:0.5]";

type GlassToastProps = {
	kind: ToastKind;
	title: ToastMessage;
	description?: ToastMessage;
	icon?: JSX.Element;
	action?: JSX.Element;
};

const GlassToast: Component<GlassToastProps> = (props) => {
	const tone = KIND_TONE[props.kind];
	const toneIcon = KIND_ICON[props.kind];
	// Explicit 112px (= the old [&>svg]:size-28) since host CSS can't reach the
	// iconify shadow-DOM svg.
	const watermarkGlyph: JSX.Element | null =
		props.icon ?? (toneIcon ? <Icon icon={toneIcon} width={112} height={112} /> : null);

	return (
		<div
			data-slot="toast"
			role={props.kind === "error" ? "alert" : "status"}
			class={cn(
				ALERT_CLASS,
				tone ? TONE_TOAST_CLASS : NEUTRAL_TOAST_CLASS,
				"w-[356px] max-w-[calc(100vw-2rem)]",
			)}
			style={tone ? { "--glass-tone": tone, color: "var(--foreground)" } : undefined}
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

const show =
	(kind: ToastKind) =>
	(message: ToastMessage, data: ExternalToast = {}): string | number => {
		/* Pull rendered fields out of the sonner options, else sonner renders
		 * `description` a second time as loose text under the toast. */
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

const resolveMsg = <T,>(
	m: ToastMessage | ((v: T) => ToastMessage) | undefined,
	v: T,
): ToastMessage => (typeof m === "function" ? (m as (v: T) => ToastMessage)(v) : (m ?? ""));

function glassPromise<T>(
	promise: Promise<T> | (() => Promise<T>),
	data: PromiseData<T> = {},
): { unwrap: () => Promise<T> } {
	const id = sonnerToast.custom(
		() => <GlassToast kind="loading" title={data.loading ?? "Loading"} />,
		{
			unstyled: true,
			duration: Number.POSITIVE_INFINITY,
		},
	);
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
