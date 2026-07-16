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
import {
	ALERT_CLASS,
	ALERT_DESCRIPTION_CLASS,
	ALERT_ICON_CLASS,
	ALERT_TITLE_CLASS,
	alertIconFill as iconFill,
	ALERT_TONES,
	type AlertTone,
} from "../lib/alert-tones";
import { glassSurface, glassToneText } from "../lib/glass-tone";
import { cn } from "../lib/utils";

/**
 * Tone-driven alert (the design formerly known as hub's SectionAlert). One
 * component, four tones, both themes. Tone table + surface recipe are the pure,
 * single-source `../lib/alert-tones` (shared with hub's docs Callout and the
 * `@glasshome/ui/astro` <Alert>), so all three faces render identically. This
 * file only maps each tone to its lucide-solid glyph.
 */
export type { AlertTone };

const TONE_ICON: Record<AlertTone, ValidComponent> = {
	info: Info,
	warning: TriangleAlert,
	success: CircleCheck,
	destructive: OctagonAlert,
};

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
	const toneKey = () => local.tone ?? "info";
	const tone = () => ALERT_TONES[toneKey()];
	return (
		<div
			data-slot="alert"
			role={local.tone === "destructive" ? "alert" : "status"}
			class={cn(ALERT_CLASS, local.class)}
			style={{
				...glassSurface(tone().color),
				color: "var(--foreground)",
			}}
			{...rest}
		>
			<span
				class={ALERT_ICON_CLASS}
				style={{ "background-color": iconFill(tone().color), color: tone().color }}
			>
				<Show when={local.icon} fallback={<Dynamic component={TONE_ICON[toneKey()]} size={18} />}>
					{local.icon}
				</Show>
			</span>
			<div class="min-w-0 flex-1">
				<Show when={local.title}>
					<p
						data-slot="alert-title"
						class={ALERT_TITLE_CLASS}
						style={{ color: glassToneText(tone().color) }}
					>
						{local.title}
					</p>
				</Show>
				<Show when={local.children}>
					<div data-slot="alert-description" class={ALERT_DESCRIPTION_CLASS}>
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
	return <div data-slot="alert-title" class={cn(ALERT_TITLE_CLASS, local.class)} {...rest} />;
};

const AlertDescription: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div data-slot="alert-description" class={cn(ALERT_DESCRIPTION_CLASS, local.class)} {...rest} />
	);
};

export { Alert, AlertDescription, AlertTitle };
