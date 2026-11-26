import { type Component, Show, omit } from "solid-js";
import { type ComponentProps, type ValidComponent } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
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
import { Ornament } from "./ornament.js";

// `as` picks the tag at the call site, so the attributes of the tags a card is
// rendered as (link, details, button) ride along with the div base.
type CardProps = ComponentProps<"div"> &
  Partial<Pick<ComponentProps<"a">, "href" | "target" | "rel">> &
  Partial<Pick<ComponentProps<"details">, "name" | "open">> & {
    interactive?: boolean;
    opaque?: boolean;
    padding?: CardPadding;
    as?: ValidComponent;
    type?: "button" | "submit" | "reset";
    /** The corner glyph of a go-somewhere ("arrow") or picked ("check") card. */
    ornament?: "arrow" | "check";
  };

// The card owns the padding: every part below carries none, and no part has a margin.
const Card: Component<CardProps> = (props) => {
  const others = omit(
    props,
    "class",
    "interactive",
    "opaque",
    "padding",
    "as",
    "ornament",
    "children",
  );
  return (
    <Polymorphic
      defaultAs="div"
      as={props.as}
      data-slot="card"
      class={cn(
        props.opaque ? CARD_SURFACE_OPAQUE : CARD_SURFACE,
        "rounded-[var(--radius)]",
        CARD_PADDING[props.padding ?? "none"],
        props.interactive && CARD_INTERACTIVE,
        props.ornament && "group relative overflow-hidden",
        props.class,
      )}
      {...others}
    >
      <Show when={props.ornament}>{(kind) => <Ornament kind={kind()} />}</Show>
      {props.children}
    </Polymorphic>
  );
};

const CardHeader: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return <div data-slot="card-header" class={cn(CARD_HEADER_CLASS, props.class)} {...others} />;
};

const CardTitle: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return <div data-slot="card-title" class={cn(CARD_TITLE_CLASS, props.class)} {...others} />;
};

const CardDescription: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return (
    <div data-slot="card-description" class={cn(CARD_DESCRIPTION_CLASS, props.class)} {...others} />
  );
};

const CardAction: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return <div data-slot="card-action" class={cn(CARD_ACTION_CLASS, props.class)} {...others} />;
};

const CardContent: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return <div data-slot="card-content" class={cn(CARD_CONTENT_CLASS, props.class)} {...others} />;
};

const CardFooter: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return <div data-slot="card-footer" class={cn(CARD_FOOTER_CLASS, props.class)} {...others} />;
};

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
