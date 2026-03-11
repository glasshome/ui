import { Popover as PopoverPrimitive } from "@kobalte/core/popover";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Popover = PopoverPrimitive;

const PopoverTrigger: Component<ComponentProps<typeof PopoverPrimitive.Trigger>> = (props) => {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
};

const PopoverContent: Component<ComponentProps<typeof PopoverPrimitive.Content>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        class={cn(
          "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[closed]:animate-out data-[expanded]:animate-in",
          local.class,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
};

const PopoverAnchor: Component<ComponentProps<typeof PopoverPrimitive.Anchor>> = (props) => {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
};

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
