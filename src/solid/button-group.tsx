import { cva, type VariantProps } from "cva";
import { type Component, omit } from "solid-js";
import { type ComponentProps, type ValidComponent } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { cn } from "../lib/utils.js";
import { Separator } from "./separator.js";

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
  const rest = omit(props, "class", "orientation");
  return (
    <div
      data-slot="button-group"
      data-orientation={props.orientation}
      class={cn(buttonGroupVariants({ orientation: props.orientation }), props.class)}
      {...rest}
    />
  );
};

const ButtonGroupText: Component<ComponentProps<"div"> & { as?: ValidComponent }> = (props) => {
  const rest = omit(props, "class", "as");
  return (
    <Polymorphic
      defaultAs="div"
      as={props.as}
      class={cn(
        "glass text-muted-foreground flex items-center gap-2 rounded-md px-4 text-sm font-medium [--glass-edge:var(--border)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        props.class,
      )}
      {...rest}
    />
  );
};

const ButtonGroupSeparator: Component<ComponentProps<typeof Separator>> = (props) => {
  const rest = omit(props, "class", "orientation");
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={props.orientation ?? "vertical"}
      class={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        props.class,
      )}
      {...rest}
    />
  );
};

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
