import { Accordion as AccordionPrimitive } from "@kobalte/core/accordion";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

const Accordion = AccordionPrimitive;

const AccordionItem: Component<ComponentProps<typeof AccordionPrimitive.Item>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      class={cn("border-b last:border-b-0", local.class)}
      {...rest}
    />
  );
};

const AccordionTrigger: ParentComponent<ComponentProps<typeof AccordionPrimitive.Trigger>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Header class="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        class={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-expanded]>[data-slot=icon]]:rotate-180",
          local.class,
        )}
        {...rest}
      >
        {local.children}
        <Icon
          icon="lucide:chevron-down"
          width={16}
          height={16}
          class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
};

const AccordionContent: ParentComponent<ComponentProps<typeof AccordionPrimitive.Content>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      class="data-[closed]:animate-accordion-up data-[expanded]:animate-accordion-down overflow-hidden text-sm"
      {...rest}
    >
      <div class={cn("pt-0 pb-4", local.class)}>{local.children}</div>
    </AccordionPrimitive.Content>
  );
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
