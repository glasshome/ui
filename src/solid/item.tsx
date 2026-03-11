import { cva, type VariantProps } from "cva";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils";
import { Separator } from "./separator";

const ItemGroup: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      role="list"
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
  base: "group/item flex flex-wrap items-center rounded-md border border-transparent text-sm outline-none transition-colors duration-100 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-accent/50",
  variants: {
    variant: {
      default: "bg-transparent",
      outline: "border-border",
      muted: "bg-muted/50",
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
  ComponentProps<"div"> & VariantProps<typeof itemVariants> & { component?: Component<any> }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "component"] as const);
  const variant = () => local.variant ?? "default";
  const size = () => local.size ?? "default";
  const Comp = () => local.component || "div";
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

const itemMediaVariants = cva({
  base: "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "size-8 rounded-sm border bg-muted [&_svg:not([class*='size-'])]:size-4",
      image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const ItemMedia: Component<ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "variant"] as const);
  const variant = () => local.variant ?? "default";
  return (
    <div
      data-slot="item-media"
      data-variant={variant()}
      class={cn(itemMediaVariants({ variant: variant() }), local.class)}
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
      class={cn("flex w-fit items-center gap-2 font-medium text-sm leading-snug", local.class)}
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
        "line-clamp-2 text-balance font-normal text-muted-foreground text-sm leading-normal",
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
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};
