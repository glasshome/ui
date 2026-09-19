import { type Component, type ComponentProps, splitProps } from "solid-js";
import { ICON_PILL } from "../lib/pill-classes.js";
import { cn } from "../lib/utils.js";

const Empty: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="empty"
			class={cn(
				"flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg p-6 text-center md:p-12",
				local.class,
			)}
			{...rest}
		/>
	);
};

const EmptyHeader: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="empty-header"
			class={cn("flex max-w-sm flex-col items-center gap-2 text-center", local.class)}
			{...rest}
		/>
	);
};

type EmptyMediaKind = "icon";

const EMPTY_MEDIA: Record<EmptyMediaKind, string> = {
	icon: `${ICON_PILL} size-10 rounded-lg [&_svg:not([class*='size-'])]:size-6`,
};

const EmptyMedia: Component<
	ComponentProps<"div"> & {
		media?: EmptyMediaKind;
		/** @deprecated `media` */
		variant?: EmptyMediaKind | "default";
	}
> = (props) => {
	const [local, rest] = splitProps(props, ["class", "media", "variant"] as const);
	const media = () => local.media ?? (local.variant === "default" ? undefined : local.variant);
	return (
		<div
			data-slot="empty-media"
			data-media={media()}
			data-variant={local.variant ?? media() ?? "default"}
			class={cn(
				"flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
				media() && EMPTY_MEDIA[media() as EmptyMediaKind],
				local.class,
			)}
			{...rest}
		/>
	);
};

const EmptyTitle: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="empty-title"
			class={cn("font-semibold text-lg tracking-tight", local.class)}
			{...rest}
		/>
	);
};

const EmptyDescription: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="empty-description"
			class={cn(
				"text-muted-foreground text-sm/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
				local.class,
			)}
			{...rest}
		/>
	);
};

const EmptyContent: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="empty-content"
			class={cn(
				"flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
				local.class,
			)}
			{...rest}
		/>
	);
};

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
