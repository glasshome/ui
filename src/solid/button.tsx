import type { VariantProps } from "cva";
import { omit } from "solid-js";
import { type JSX, type ValidComponent } from "@solidjs/web";
import { ButtonRoot, type ButtonRootProps } from "../lib/behavior/button-root.js";
import { busyProps } from "../lib/busy.js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

type ButtonProps<T extends ValidComponent = "button"> = ButtonRootProps<T> &
  VariantProps<typeof buttonVariants> & {
    /** Presses do nothing; unlike `disabled` it keeps focus, so the popover or dialog around it stays. */
    busy?: boolean;
    class?: string;
  };

function Button<T extends ValidComponent = "button">(props: ButtonProps<T>) {
  const others = omit(props as ButtonProps<ValidComponent>, "class", "variant", "size", "busy");
  return (
    <ButtonRoot
      data-slot="button"
      {...others}
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
      {...(props.busy ? busyProps : undefined)}
    />
  );
}

function ButtonWell(props: { icon?: string; children?: JSX.Element; class?: string }) {
  return (
    <span
      data-slot="button-well"
      class={cn(
        "bg-foreground/15 grid size-12 shrink-0 place-items-center rounded-full",
        props.class,
      )}
    >
      {props.children ?? (props.icon ? <Icon icon={props.icon} /> : null)}
    </span>
  );
}

export { Button, ButtonWell, buttonVariants };
