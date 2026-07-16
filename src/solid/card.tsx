import { type Component, type ComponentProps, splitProps } from "solid-js";
import {
	CARD_ACTION_CLASS,
	CARD_CLASS,
	CARD_CONTENT_CLASS,
	CARD_DESCRIPTION_CLASS,
	CARD_FOOTER_CLASS,
	CARD_HEADER_CLASS,
	CARD_INSET_SHADOW,
	CARD_TITLE_CLASS,
} from "../lib/card-classes";
import { cn } from "../lib/utils";

// Card surface + sub-part classes are the pure, single-source `../lib/card-classes`
// (shared with hub's `.astro` card surfaces and the `@glasshome/ui/astro` <Card>),
// so a package card and a marketing-page card are byte-identical.

const Card: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="card"
			class={cn(CARD_CLASS, local.class)}
			style={{ "box-shadow": CARD_INSET_SHADOW }}
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
