import { CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-solid";
import {
	type Component,
	type ComponentProps,
	type JSX,
	Show,
	splitProps,
	type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils";

/**
 * Tone-driven alert (the design formerly known as hub's SectionAlert). One
 * component, four tones, both themes, all color from theme vars via color-mix.
 * Text mixes in oklab (not oklch) so a hued tone desaturates toward neutral
 * with its hue intact instead of swinging toward yellow.
 */
export type AlertTone = "info" | "warning" | "success" | "destructive";

type ToneStyle = { color: string; icon: ValidComponent; text: string };

const ALERT_TONES: Record<AlertTone, ToneStyle> = {
	info: { color: "var(--primary)", icon: Info, text: "var(--primary-tint-foreground)" },
	warning: {
		color: "var(--warning)",
		icon: TriangleAlert,
		text: "color-mix(in oklab, var(--warning) 55%, var(--foreground))",
	},
	success: {
		color: "var(--success)",
		icon: CircleCheck,
		text: "color-mix(in oklab, var(--success) 60%, var(--foreground))",
	},
	destructive: {
		color: "var(--destructive)",
		icon: OctagonAlert,
		text: "color-mix(in oklab, var(--destructive) 65%, var(--foreground))",
	},
};

const border = (c: string) => `color-mix(in oklch, ${c} 28%, transparent)`;
const fill = (c: string) => `color-mix(in oklch, ${c} 9%, transparent)`;
const iconFill = (c: string) => `color-mix(in oklch, ${c} 16%, transparent)`;

type AlertProps = ComponentProps<"div"> & {
	tone?: AlertTone;
	/** Override the default per-tone icon with any JSX (e.g. a lucide-solid icon). */
	icon?: JSX.Element;
	/** Bold heading line. */
	title?: JSX.Element;
	/** Trailing element pinned right (e.g. a Button). */
	action?: JSX.Element;
};

const Alert: Component<AlertProps> = (props) => {
	const [local, rest] = splitProps(props, ["class", "tone", "icon", "title", "action", "children"]);
	const tone = () => ALERT_TONES[local.tone ?? "info"];
	return (
		<div
			data-slot="alert"
			role={local.tone === "destructive" ? "alert" : "status"}
			class={cn("flex items-start gap-3 rounded-lg border p-3 backdrop-blur-sm", local.class)}
			style={{
				"border-color": border(tone().color),
				"background-color": fill(tone().color),
				color: tone().text,
			}}
			{...rest}
		>
			<span
				class="flex size-8 shrink-0 items-center justify-center rounded-md [&>svg]:size-[18px]"
				style={{ "background-color": iconFill(tone().color), color: tone().color }}
			>
				<Show when={local.icon} fallback={<Dynamic component={tone().icon} size={18} />}>
					{local.icon}
				</Show>
			</span>
			<div class="min-w-0 flex-1">
				<Show when={local.title}>
					<p data-slot="alert-title" class="font-semibold text-sm leading-snug">
						{local.title}
					</p>
				</Show>
				<Show when={local.children}>
					<div
						data-slot="alert-description"
						class="text-sm leading-snug [&:not(:first-child)]:mt-0.5"
					>
						{local.children}
					</div>
				</Show>
			</div>
			<Show when={local.action}>
				<div class="flex shrink-0 items-center">{local.action}</div>
			</Show>
		</div>
	);
};

/** Back-compat sub-parts for the older compound usage (Alert > AlertTitle/Description). */
const AlertTitle: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="alert-title"
			class={cn("font-semibold text-sm leading-snug", local.class)}
			{...rest}
		/>
	);
};

const AlertDescription: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="alert-description"
			class={cn("text-sm leading-snug [&:not(:first-child)]:mt-0.5", local.class)}
			{...rest}
		/>
	);
};

export { Alert, AlertDescription, AlertTitle };
