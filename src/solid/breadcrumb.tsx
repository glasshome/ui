import {
  type Component,
  type ComponentProps,
  type ParentComponent,
  splitProps,
  type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

const Breadcrumb: Component<ComponentProps<"nav">> = (props) => {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
};

const BreadcrumbList: Component<ComponentProps<"ol">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ol
      data-slot="breadcrumb-list"
      class={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
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

const BreadcrumbLink: Component<ComponentProps<"a"> & { as?: ValidComponent }> = (props) => {
  const [local, rest] = splitProps(props, ["class", "as"]);
  const Comp = () => local.as || "a";
  return (
    <Dynamic
      component={Comp()}
      data-slot="breadcrumb-link"
      class={cn("hover:text-foreground transition-colors", local.class)}
      {...rest}
    />
  );
};

const BreadcrumbPage: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      class={cn("text-foreground font-normal", local.class)}
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
      {local.children ?? <Icon icon="lucide:chevron-right" width={14} height={14} />}
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
      <Icon icon="lucide:ellipsis" width={16} height={16} class="size-4" />
      <span class="sr-only">More</span>
    </span>
  );
};

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
