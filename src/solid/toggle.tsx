import { ToggleButton as ToggleButtonPrimitive } from "@kobalte/core/toggle-button";
import { cva, type VariantProps } from "cva";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OUTLINE_SURFACE } from "../lib/button-variants.js";
import { CONTROL_H } from "../lib/input-classes.js";
import { SEGMENT_ITEM } from "../lib/segment-classes.js";
import { cn } from "../lib/utils.js";

const toggleVariants = cva({
  base: `${SEGMENT_ITEM} aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 border border-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  variants: {
    variant: {
      default: "bg-transparent",
      outline: OUTLINE_SURFACE,
    },
    size: {
      default: `${CONTROL_H.default} min-w-9 px-2`,
      sm: `${CONTROL_H.sm} min-w-8 px-1.5`,
      lg: `${CONTROL_H.lg} min-w-10 px-2.5`,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

/* The hover fill lives here, not in the shared variants: a ToggleGroupItem
 * takes its pressed paint from the group's sliding indicator, and
 * `:not([data-pressed]):hover` (0,3,0) outranks any plain `:hover` the group
 * adds to cancel it. Unpressed only, because a background utility is a no-op
 * once `data-[pressed]:glass` engages, so the pressed hover bumps a knob. */
const TOGGLE_HOVER: Record<"default" | "outline", string> = {
  default:
    "not-data-[pressed]:hover:bg-muted not-data-[pressed]:hover:text-muted-foreground data-[pressed]:hover:[--glass-wash:40%]",
  outline: "",
};

const Toggle: Component<
  ComponentProps<typeof ToggleButtonPrimitive> & VariantProps<typeof toggleVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size"] as const);
  return (
    <ToggleButtonPrimitive
      data-slot="toggle"
      class={cn(
        toggleVariants({ variant: local.variant, size: local.size }),
        TOGGLE_HOVER[local.variant ?? "default"],
        "data-[pressed]:glass data-[pressed]:[--glass-tone:var(--surface-accent)]",
        local.class,
      )}
      {...rest}
    />
  );
};

export { Toggle, toggleVariants };
