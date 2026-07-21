import { type Component, type ComponentProps, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
	CARD_ACTION_CLASS,
	CARD_CONTENT_CLASS,
	CARD_DESCRIPTION_CLASS,
	CARD_FOOTER_CLASS,
	CARD_HEADER_CLASS,
	CARD_INTERACTIVE,
	CARD_PADDING,
	CARD_SURFACE,
	CARD_SURFACE_OPAQUE,
	CARD_TITLE_CLASS,
	type CardPadding,
} from "../lib/card-classes.js";
import { cn } from "../lib/utils.js";

type CardProps = ComponentProps<"div"> & {
	interactive?: boolean;
	opaque?: boolean;
	padding?: CardPadding;
	as?: ValidComponent;
	href?: string;
};

const Card: Component<CardProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "interactive", "opaque", "padding", "as"]);
	return (
		<Dynamic
			component={local.as ?? "div"}
			data-slot="card"
			class={cn(
				local.opaque ? CARD_SURFACE_OPAQUE : CARD_SURFACE,
				"rounded-[var(--radius)]",
				CARD_PADDING[local.padding ?? "none"],
				local.interactive && CARD_INTERACTIVE,
				local.class,
			)}
			{...others}
		/>
	);
};

const CardHeader: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return <div data-slot="card-header" class={cn(CARD_HEADER_CLASS, local.class)} {...others} />;
};

const CardTitle: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return <div data-slot="card-title" class={cn(CARD_TITLE_CLASS, local.class)} {...others} />;
};

const CardDescription: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<div data-slot="card-description" class={cn(CARD_DESCRIPTION_CLASS, local.class)} {...others} />
	);
};

const CardAction: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return <div data-slot="card-action" class={cn(CARD_ACTION_CLASS, local.class)} {...others} />;
};

const CardContent: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return <div data-slot="card-content" class={cn(CARD_CONTENT_CLASS, local.class)} {...others} />;
};

const CardFooter: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return <div data-slot="card-footer" class={cn(CARD_FOOTER_CLASS, local.class)} {...others} />;
};

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
