import { cva, type VariantProps } from "cva";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { CONTROL_H, FIELD_TEXT, INPUT_SURFACE } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";

const InputGroup: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    // biome-ignore lint/a11y/useSemanticElements: fieldset would carry default browser styling and break the input layout; role=group conveys the same semantics.
    <div
      data-slot="input-group"
      role="group"
      class={cn(
        `group/input-group relative flex w-full items-center rounded-md ${INPUT_SURFACE} transition-[color,box-shadow] outline-none`,
        `${CONTROL_H.default} min-w-0 has-[>textarea]:h-auto`,
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
        // The shell wears the focus and invalid state for the control inside
        // it; on glass the edge moves through the knob, never through border-*.
        "has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:[--glass-edge:var(--ring)]",
        "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[[data-slot][aria-invalid=true]]:[--glass-edge:var(--destructive)]",
        local.class,
      )}
      {...rest}
    />
  );
};

/* An addon owns the distance to the panel edge, and only that: the control
 * keeps its own px-3, so nothing reaches into a sibling to trim it. A button
 * or kbd inside already carries its own padding, so the addon sits closer. */
const inputGroupAddonVariants = cva({
  base: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-sm [&>svg:not([class*='size-'])]:size-4",
  variants: {
    align: {
      "inline-start": "order-first pl-3 has-[>button]:pl-1.5 has-[>kbd]:pl-2",
      "inline-end": "order-last pr-3 has-[>button]:pr-1.5 has-[>kbd]:pr-2",
      "block-start": "order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3",
      "block-end": "order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3",
    },
  },
  defaultVariants: {
    align: "inline-start",
  },
});

const InputGroupAddon: Component<
  ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "align"] as const);
  const align = () => local.align ?? "inline-start";
  return (
    // Addon click forwards focus to the sibling input (cursor-text affordance); buttons inside keep their own behavior.
    // biome-ignore lint/a11y/useKeyWithClickEvents: see above
    // biome-ignore lint/a11y/useSemanticElements: see above
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align()}
      class={cn(inputGroupAddonVariants({ align: align() }), local.class)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        (e.currentTarget as HTMLElement).parentElement
          ?.querySelector<HTMLInputElement>("input")
          ?.focus();
      }}
      {...rest}
    />
  );
};

/* Both button sizes come from the shared control heights: sm fits inside the
 * h-9 shell, default fills a block addon's own row. */
const GROUP_BUTTON_SM = `${CONTROL_H.sm} gap-1.5 px-2.5 has-[>svg]:px-2.5`;
const GROUP_BUTTON_ICON_SM = "size-8 p-0 has-[>svg]:p-0";

const inputGroupButtonVariants = cva({
  base: "flex items-center gap-2 rounded-sm text-sm shadow-none",
  variants: {
    size: {
      /** @deprecated Use "sm". */
      xs: GROUP_BUTTON_SM,
      sm: GROUP_BUTTON_SM,
      default: `${CONTROL_H.default} px-3 has-[>svg]:px-3`,
      /** @deprecated Use "icon-sm". */
      "icon-xs": GROUP_BUTTON_ICON_SM,
      "icon-sm": GROUP_BUTTON_ICON_SM,
      "icon-default": "size-9 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

const InputGroupButton: Component<
  Omit<ComponentProps<typeof Button>, "size"> & VariantProps<typeof inputGroupButtonVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "type", "variant", "size"] as const);
  const size = () => local.size ?? "sm";
  return (
    <Button
      type={local.type ?? "button"}
      data-slot="input-group-button"
      data-size={size()}
      variant={local.variant ?? "ghost"}
      class={cn(inputGroupButtonVariants({ size: size() }), local.class)}
      {...rest}
    />
  );
};

const InputGroupText: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="input-group-text"
      class={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        local.class,
      )}
      {...rest}
    />
  );
};

// The control inside a group is SURFACELESS — the <InputGroup> owns the border,
// background, height and focus state. So these are bare <input>/<textarea>, not
// the glass <Input>/<Textarea>: routing through those paints the `.glass`
// gradient inside the group (a `bg-transparent` can't clear the `background`
// shorthand's image layers) and stacks a second concave surface.
const InputGroupInput: Component<ComponentProps<"input">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <input
      data-slot="input-group-control"
      class={cn(
        `${CONTROL_H.default} w-full flex-1 rounded-none border-0 bg-transparent px-3 py-1 ${FIELD_TEXT} placeholder:text-muted-foreground shadow-none outline-none disabled:cursor-not-allowed disabled:opacity-50`,
        local.class,
      )}
      {...rest}
    />
  );
};

const InputGroupTextarea: Component<ComponentProps<"textarea">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <textarea
      data-slot="input-group-control"
      class={cn(
        `field-sizing-content min-h-16 w-full flex-1 resize-none rounded-none border-0 bg-transparent px-3 py-2 ${FIELD_TEXT} placeholder:text-muted-foreground shadow-none outline-none disabled:cursor-not-allowed disabled:opacity-50`,
        local.class,
      )}
      {...rest}
    />
  );
};

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
};
