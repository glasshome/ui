import { Checkbox as CheckboxPrimitive } from "@kobalte/core/checkbox";
import { CheckIcon } from "lucide-solid";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Checkbox: Component<ComponentProps<typeof CheckboxPrimitive>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <CheckboxPrimitive
      data-slot="checkbox"
      class={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground dark:bg-input/30 dark:data-[checked]:bg-primary dark:aria-invalid:ring-destructive/40",
        local.class,
      )}
      {...others}
    >
      <CheckboxPrimitive.Indicator class="flex items-center justify-center text-current">
        <CheckIcon class="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive>
  );
};

export { Checkbox };
