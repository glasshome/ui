import { Collapsible as CollapsiblePrimitive } from "@kobalte/core/collapsible";
import type { Component, ComponentProps } from "solid-js";

const Collapsible: Component<ComponentProps<typeof CollapsiblePrimitive>> = (props) => {
  return <CollapsiblePrimitive data-slot="collapsible" {...props} />;
};

const CollapsibleTrigger: Component<ComponentProps<typeof CollapsiblePrimitive.Trigger>> = (
  props,
) => {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
};

const CollapsibleContent: Component<ComponentProps<typeof CollapsiblePrimitive.Content>> = (
  props,
) => {
  return <CollapsiblePrimitive.Content data-slot="collapsible-content" {...props} />;
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
