import { cva, type VariantProps } from "cva";
import { type Component, type ComponentProps, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { ICON_PILL } from "../lib/pill-classes.js";
import { cn } from "../lib/utils.js";
import { Separator } from "./separator.js";

const ItemGroup: Component<ComponentProps<"ul">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ul
      data-slot="item-group"
      class={cn("group/item-group flex flex-col", local.class)}
      {...rest}
    />
  );
};

const ItemSeparator: Component<ComponentProps<typeof Separator>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      class={cn("my-0", local.class)}
      {...rest}
    />
  );
};

const itemVariants = cva({
  base: "group/item focus-visible:border-ring focus-visible:ring-ring/50 [a]:hover:bg-muted/50 flex flex-wrap items-center rounded-md border border-transparent text-sm transition-colors duration-100 outline-none focus-visible:ring-[3px] [a]:transition-colors",
  variants: {
    variant: {
      // Item is structure, not a surface (that is <Card>). Plain treatments only.
      default: "bg-transparent",
      outline: "border-border",
      muted: "bg-muted/40",
    },
    size: {
      default: "gap-4 p-4",
      sm: "gap-2.5 px-4 py-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Item: Component<
  ComponentProps<"div"> & VariantProps<typeof itemVariants> & { as?: ValidComponent; href?: string }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "as"] as const);
  const variant = () => local.variant ?? "default";
  const size = () => local.size ?? "default";
  const Comp = () => local.as || "div";
  return (
    <Dynamic
      component={Comp()}
      data-slot="item"
      data-variant={variant()}
      data-size={size()}
      class={cn(itemVariants({ variant: variant(), size: size() }), local.class)}
      {...rest}
    />
  );
};

type ItemMediaKind = "icon" | "image";

const ITEM_MEDIA: Record<ItemMediaKind, string> = {
  icon: `${ICON_PILL} size-8 rounded-md text-foreground/80 [&_svg:not([class*='size-'])]:size-4`,
  image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
};

const ItemMedia: Component<
  ComponentProps<"div"> & {
    /** The well the media sits in. Omit for bare content. */
    media?: ItemMediaKind;
    /** @deprecated `media` */
    variant?: ItemMediaKind | "default";
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "media", "variant"] as const);
  const media = () => local.media ?? (local.variant === "default" ? undefined : local.variant);
  return (
    <div
      data-slot="item-media"
      data-media={media()}
      data-variant={local.variant ?? media() ?? "default"}
      class={cn(
        "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
        media() && ITEM_MEDIA[media() as ItemMediaKind],
        local.class,
      )}
      {...rest}
    />
  );
};

const ItemContent: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="item-content"
      class={cn("flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none", local.class)}
      {...rest}
    />
  );
};

const ItemTitle: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="item-title"
      class={cn("flex w-fit items-center gap-2 text-sm leading-snug font-medium", local.class)}
      {...rest}
    />
  );
};

const ItemDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <p
      data-slot="item-description"
      class={cn(
        "text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        local.class,
      )}
      {...rest}
    />
  );
};

const ItemActions: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div data-slot="item-actions" class={cn("flex items-center gap-2", local.class)} {...rest} />
  );
};

const ItemHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="item-header"
      class={cn("flex basis-full items-center justify-between gap-2", local.class)}
      {...rest}
    />
  );
};

const ItemFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="item-footer"
      class={cn("flex basis-full items-center justify-between gap-2", local.class)}
      {...rest}
    />
  );
};

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
};
