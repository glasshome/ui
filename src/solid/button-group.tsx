import { cva, type VariantProps } from "cva";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils";
import { Separator } from "./separator";

const buttonGroupVariants = cva({
  base: "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  variants: {
    orientation: {
      horizontal:
        "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
      vertical:
        "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const ButtonGroup: Component<ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "orientation"] as const);
  return (
    <div
      data-slot="button-group"
      data-orientation={local.orientation}
      class={cn(buttonGroupVariants({ orientation: local.orientation }), local.class)}
      {...rest}
    />
  );
};

const ButtonGroupText: Component<ComponentProps<"div"> & { component?: Component<any> }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "component"] as const);
  const Comp = () => local.component || "div";
  return (
    <Dynamic
      component={Comp()}
      class={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-4 font-medium text-sm shadow-xs [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        local.class,
      )}
      {...rest}
    />
  );
};

const ButtonGroupSeparator: Component<ComponentProps<typeof Separator>> = (props) => {
  const [local, rest] = splitProps(props, ["class", "orientation"] as const);
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={local.orientation ?? "vertical"}
      class={cn(
        "!m-0 relative self-stretch bg-input data-[orientation=vertical]:h-auto",
        local.class,
      )}
      {...rest}
    />
  );
};

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
