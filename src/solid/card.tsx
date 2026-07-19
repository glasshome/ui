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
} from "../lib/card-classes";
import { cn } from "../lib/utils";

type CardProps = ComponentProps<"div"> & {
	/** Clickable surface: adds the hover/focus affordance. */
	interactive?: boolean;
	/** Opaque solid surface (no backdrop blur). Use over busy/dark backgrounds or
	 *  in animated contexts where blur can't run (marquees, transformed grids). */
	opaque?: boolean;
	/** Padding preset. Default `none`: a bare surface you pad yourself (matches
	 *  the Astro <Card>). Pass `slots` for the CardHeader/Content/Footer vertical
	 *  rhythm, or `md`/`sm` for a uniform tile. */
	padding?: CardPadding;
	/** Render as another element, e.g. "a" (with href) or "section". */
	as?: ValidComponent;
	/** Convenience for `as="a"` cards (not part of the base div props). */
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
