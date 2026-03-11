import { RadioGroup as RadioGroupPrimitive } from "@kobalte/core/radio-group";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const RadioGroup: Component<ComponentProps<typeof RadioGroupPrimitive>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <RadioGroupPrimitive data-slot="radio-group" class={cn("grid gap-3", local.class)} {...rest} />
  );
};

const RadioGroupItem: Component<ComponentProps<typeof RadioGroupPrimitive.Item>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      class={cn("flex items-center", local.class)}
      {...rest}
    >
      <RadioGroupPrimitive.ItemInput />
      <RadioGroupPrimitive.ItemControl
        class={cn(
          "aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        )}
      >
        <RadioGroupPrimitive.ItemIndicator
          data-slot="radio-group-indicator"
          class="relative flex items-center justify-center"
        >
          <svg class="size-2 fill-primary" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" />
          </svg>
        </RadioGroupPrimitive.ItemIndicator>
      </RadioGroupPrimitive.ItemControl>
    </RadioGroupPrimitive.Item>
  );
};

export { RadioGroup, RadioGroupItem };
