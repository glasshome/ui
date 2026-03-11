import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createContext,
  type ParentComponent,
  splitProps,
  useContext,
} from "solid-js";
import { cn } from "../lib/utils";
import { toggleVariants } from "./toggle";

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

const ToggleGroup: ParentComponent<
  ComponentProps<typeof ToggleGroupPrimitive> & VariantProps<typeof toggleVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "children"] as const);
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={local.variant}
      data-size={local.size}
      class={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        local.class,
      )}
      {...rest}
    >
      <ToggleGroupContext.Provider value={{ variant: local.variant, size: local.size }}>
        {local.children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
};

const ToggleGroupItem: Component<
  ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size"] as const);
  const context = useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || local.variant}
      data-size={context.size || local.size}
      class={cn(
        toggleVariants({
          variant: context.variant || local.variant,
          size: context.size || local.size,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        local.class,
      )}
      {...rest}
    />
  );
};

export { ToggleGroup, ToggleGroupItem };
