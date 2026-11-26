import { type Component, type ParentComponent, omit } from "solid-js";
import { type ComponentProps, type ValidComponent } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";

const Breadcrumb: Component<ComponentProps<"nav">> = (props) => {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
};

const BreadcrumbList: Component<ComponentProps<"ol">> = (props) => {
  const rest = omit(props, "class");
  return (
    <ol
      data-slot="breadcrumb-list"
      class={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        props.class,
      )}
      {...rest}
    />
  );
};

const BreadcrumbItem: Component<ComponentProps<"li">> = (props) => {
  const rest = omit(props, "class");
  return (
    <li
      data-slot="breadcrumb-item"
      class={cn("inline-flex items-center gap-1.5", props.class)}
      {...rest}
    />
  );
};

const BreadcrumbLink: Component<ComponentProps<"a"> & { as?: ValidComponent }> = (props) => {
  const rest = omit(props, "class", "as");
  return (
    <Polymorphic
      defaultAs="a"
      as={props.as}
      data-slot="breadcrumb-link"
      class={cn("hover:text-foreground transition-colors", props.class)}
      {...rest}
    />
  );
};

const BreadcrumbPage: Component<ComponentProps<"span">> = (props) => {
  const rest = omit(props, "class");
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      class={cn("text-foreground font-normal", props.class)}
      {...rest}
    />
  );
};

const BreadcrumbSeparator: ParentComponent<ComponentProps<"li">> = (props) => {
  const rest = omit(props, "children", "class");
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      class={cn("[&>svg]:size-3.5", props.class)}
      {...rest}
    >
      {props.children ?? <Icon icon="lucide:chevron-right" width={14} height={14} />}
    </li>
  );
};

const BreadcrumbEllipsis: Component<ComponentProps<"span">> = (props) => {
  const rest = omit(props, "class");
  const text = useUiText();
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      class={cn("flex size-9 items-center justify-center", props.class)}
      {...rest}
    >
      <Icon icon="lucide:ellipsis" width={16} height={16} class="size-4" />
      <span class="sr-only">{text("ui.breadcrumb.more")}</span>
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
