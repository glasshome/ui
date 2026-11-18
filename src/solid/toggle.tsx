import { cva, type VariantProps } from "cva";
import { type Accessor, children, type JSX, splitProps } from "solid-js";
import { ButtonRoot, type ButtonRootProps } from "../lib/behavior/button-root.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { callEventHandler } from "../lib/behavior/solid.js";
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
 * takes its pressed paint from the group's selection highlight, and
 * `:not([data-pressed]):hover` (0,3,0) outranks any plain `:hover` the group
 * adds to cancel it. Unpressed only, because a background utility is a no-op
 * once `data-[pressed]:glass` engages, so the pressed hover bumps a knob. */
const TOGGLE_HOVER: Record<"default" | "outline", string> = {
  default:
    "not-data-[pressed]:hover:bg-muted not-data-[pressed]:hover:text-muted-foreground data-[pressed]:hover:[--glass-wash:40%]",
  outline: "",
};

type ToggleProps = Omit<ButtonRootProps<"button">, "children" | "onChange"> &
  VariantProps<typeof toggleVariants> & {
    pressed?: boolean;
    defaultPressed?: boolean;
    onChange?: (pressed: boolean) => void;
    children?: JSX.Element | ((state: { pressed: Accessor<boolean> }) => JSX.Element);
  };

function Toggle(props: ToggleProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "variant",
    "size",
    "pressed",
    "defaultPressed",
    "onChange",
    "onClick",
    "children",
  ]);
  const [pressed, setPressed] = createControllableSignal({
    value: () => local.pressed,
    defaultValue: () => local.defaultPressed ?? false,
    onChange: (next) => local.onChange?.(next),
  });
  const content = children(() => {
    const body = local.children;
    return typeof body === "function" ? body({ pressed }) : body;
  });
  return (
    <ButtonRoot
      data-slot="toggle"
      aria-pressed={pressed()}
      data-pressed={pressed() ? "" : undefined}
      class={cn(
        toggleVariants({ variant: local.variant, size: local.size }),
        TOGGLE_HOVER[local.variant ?? "default"],
        "data-[pressed]:glass data-[pressed]:[--glass-tone:var(--material-accent)]",
        local.class,
      )}
      {...rest}
      onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
        callEventHandler(event, local.onClick);
        if (!rest.disabled) setPressed(!pressed());
      }}
    >
      {content()}
    </ButtonRoot>
  );
}

export { Toggle, toggleVariants };
