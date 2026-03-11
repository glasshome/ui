import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Card: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="card"
      class={cn(
        "flex flex-col rounded-lg border border-border/50 bg-card py-3 text-card-foreground shadow-sm backdrop-blur-sm transition-all hover:border-border  md:py-4",
        local.class,
      )}
      {...others}
    />
  );
};

const CardHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="card-header"
      class={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-3 pb-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] md:px-4 md:pb-4",
        local.class,
      )}
      {...others}
    />
  );
};

const CardTitle: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div data-slot="card-title" class={cn("font-semibold leading-none", local.class)} {...others} />
  );
};

const CardDescription: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="card-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...others}
    />
  );
};

const CardAction: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="card-action"
      class={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", local.class)}
      {...others}
    />
  );
};

const CardContent: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div data-slot="card-content" class={cn("px-3 md:px-4", local.class)} {...others} />;
};

const CardFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="card-footer"
      class={cn("flex items-center px-3 md:px-4 [.border-t]:pt-6", local.class)}
      {...others}
    />
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter };
