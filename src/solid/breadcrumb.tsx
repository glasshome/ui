import { ChevronRight, MoreHorizontal } from "lucide-solid";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils";

const Breadcrumb: Component<ComponentProps<"nav">> = (props) => {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
};

const BreadcrumbList: Component<ComponentProps<"ol">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ol
      data-slot="breadcrumb-list"
      class={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-sm sm:gap-2.5",
        local.class,
      )}
      {...rest}
    />
  );
};

const BreadcrumbItem: Component<ComponentProps<"li">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <li
      data-slot="breadcrumb-item"
      class={cn("inline-flex items-center gap-1.5", local.class)}
      {...rest}
    />
  );
};

const BreadcrumbLink: Component<ComponentProps<"a"> & { component?: Component<any> }> = (props) => {
  const [local, rest] = splitProps(props, ["class", "component"]);
  const Comp = () => local.component || "a";
  return (
    <Dynamic
      component={Comp()}
      data-slot="breadcrumb-link"
      class={cn("transition-colors hover:text-foreground", local.class)}
      {...rest}
    />
  );
};

const BreadcrumbPage: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      class={cn("font-normal text-foreground", local.class)}
      {...rest}
    />
  );
};

const BreadcrumbSeparator: ParentComponent<ComponentProps<"li">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      class={cn("[&>svg]:size-3.5", local.class)}
      {...rest}
    >
      {local.children ?? <ChevronRight />}
    </li>
  );
};

const BreadcrumbEllipsis: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      class={cn("flex size-9 items-center justify-center", local.class)}
      {...rest}
    >
      <MoreHorizontal class="size-4" />
      <span class="sr-only">More</span>
    </span>
  );
};

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
