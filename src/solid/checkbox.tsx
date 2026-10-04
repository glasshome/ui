import { Checkbox as CheckboxPrimitive } from "@kobalte/core/checkbox";
import { type Component, type ComponentProps, type JSX, splitProps } from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

/* Two box sizes and the glyph that fits each: `sm` is the row-embedded control
 * (picker rows, dense lists), `default` the touch target of a standalone one. */
const CHECKBOX_SIZE = {
  sm: { box: "size-5", glyph: "size-3.5", px: 14 },
  default: { box: "size-7", glyph: "size-5", px: 20 },
} as const;

type CheckboxSize = keyof typeof CHECKBOX_SIZE;

const Checkbox: Component<ComponentProps<typeof CheckboxPrimitive> & { size?: CheckboxSize }> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class", "children", "size"]);
  const label = () => local.children as JSX.Element;
  const size = () => CHECKBOX_SIZE[local.size ?? "default"];
  return (
    <CheckboxPrimitive data-slot="checkbox" {...others}>
      {/* One <label> row: the box is a plain span, not a Kobalte Control, so a
			    click anywhere toggles exactly once. */}
      {(state) => (
        <CheckboxPrimitive.Label
          data-slot="checkbox-label"
          class="group inline-flex cursor-pointer items-center gap-2.5 select-none data-[disabled]:cursor-not-allowed"
        >
          <CheckboxPrimitive.Input class="peer" />
          <span
            aria-hidden="true"
            data-slot="checkbox-box"
            data-size={local.size ?? "default"}
            class={cn(
              "transition-glass box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs duration-200 ease-out group-active:scale-90",
              size().box,
              "peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px] peer-focus-visible:[--glass-edge:var(--ring)]",
              state.checked()
                ? "glass glass-tint text-foreground [--glass-tone:var(--surface-accent)]"
                : FIELD_CHROME,
              props.disabled && "cursor-not-allowed opacity-40",
              local.class,
            )}
          >
            {/* Always mounted so the box keeps constant height. */}
            <Icon
              icon="lucide:check"
              width={size().px}
              height={size().px}
              class={cn(
                size().glyph,
                "transition-glass duration-200 ease-out",
                state.checked() ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            />
          </span>
          {local.children && (
            <span data-slot="checkbox-text" class="text-sm leading-none">
              {label()}
            </span>
          )}
        </CheckboxPrimitive.Label>
      )}
    </CheckboxPrimitive>
  );
};

export { Checkbox };
