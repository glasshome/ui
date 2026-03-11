import { cva, type VariantProps } from "cva";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Empty: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="empty"
      class={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
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

const emptyMediaVariants = cva({
  base: "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const EmptyMedia: Component<ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "variant"] as const);
  const variant = () => local.variant ?? "default";
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant()}
      class={cn(emptyMediaVariants({ variant: variant() }), local.class)}
      {...rest}
    />
  );
};

const EmptyTitle: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="empty-title"
      class={cn("font-medium text-lg tracking-tight", local.class)}
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

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
