import { type Component, type ComponentProps, type JSX, Show, splitProps } from "solid-js";
import {
	ALERT_CLASS,
	ALERT_CONTENT_CLASS,
	ALERT_DESCRIPTION_CLASS,
	ALERT_ICON_BG_CLASS,
	ALERT_ICON_PATHS,
	ALERT_TITLE_CLASS,
	ALERT_TONES,
	type AlertTone,
	alertIconBgStyle,
} from "../lib/alert-tones.js";
import { glassToneText } from "../lib/glass-tone.js";
import { cn } from "../lib/utils.js";

export type { AlertTone };

type AlertProps = ComponentProps<"div"> & {
	tone?: AlertTone;
	icon?: JSX.Element;
	title?: JSX.Element;
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
			class={cn(ALERT_CLASS, "glass glass-tint", local.class)}
			style={{ "--glass-tone": tone().color, color: "var(--foreground)" }}
			{...rest}
		>
			<span class={ALERT_ICON_BG_CLASS} style={alertIconBgStyle(tone().color)} aria-hidden="true">
				<Show
					when={local.icon}
					fallback={
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							innerHTML={ALERT_ICON_PATHS[toneKey()]}
						/>
					}
				>
					{local.icon}
				</Show>
			</span>
			<div class={ALERT_CONTENT_CLASS}>
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
