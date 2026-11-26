import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils.js";
import { buttonVariants } from "./button.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";

const Pagination: Component<ComponentProps<"nav">> = (props) => {
  const rest = omit(props, "class");
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      class={cn("mx-auto flex w-full justify-center", props.class)}
      {...rest}
    />
  );
};

const PaginationContent: Component<ComponentProps<"ul">> = (props) => {
  const rest = omit(props, "class");
  return (
    <ul
      data-slot="pagination-content"
      class={cn("flex flex-row items-center gap-1", props.class)}
      {...rest}
    />
  );
};

const PaginationItem: Component<ComponentProps<"li">> = (props) => {
  return <li data-slot="pagination-item" {...props} />;
};

type PaginationLinkProps = ComponentProps<"a"> & {
  isActive?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
};

const PaginationLink: Component<PaginationLinkProps> = (props) => {
  const rest = omit(props, "class", "isActive", "size");
  const size = () => props.size ?? "icon";
  return (
    <a
      aria-current={props.isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={props.isActive}
      class={cn(
        buttonVariants({
          variant: props.isActive ? "outline" : "ghost",
          size: size(),
        }),
        props.class,
      )}
      {...rest}
    />
  );
};

const PaginationPrevious: Component<PaginationLinkProps> = (props) => {
  const rest = omit(props, "class");
  const text = useUiText();
  return (
    <PaginationLink
      aria-label={text("ui.pagination.previous-label")}
      size="default"
      class={cn("gap-1 px-2.5 sm:pl-2.5", props.class)}
      {...rest}
    >
      <Icon icon="lucide:chevron-left" width={16} height={16} />
      <span class="hidden sm:block">{text("ui.pagination.previous")}</span>
    </PaginationLink>
  );
};

const PaginationNext: Component<PaginationLinkProps> = (props) => {
  const rest = omit(props, "class");
  const text = useUiText();
  return (
    <PaginationLink
      aria-label={text("ui.pagination.next-label")}
      size="default"
      class={cn("gap-1 px-2.5 sm:pr-2.5", props.class)}
      {...rest}
    >
      <span class="hidden sm:block">{text("ui.pagination.next")}</span>
      <Icon icon="lucide:chevron-right" width={16} height={16} />
    </PaginationLink>
  );
};

const PaginationEllipsis: Component<ComponentProps<"span">> = (props) => {
  const rest = omit(props, "class");
  const text = useUiText();
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      class={cn("flex size-9 items-center justify-center", props.class)}
      {...rest}
    >
      <Icon icon="lucide:ellipsis" width={16} height={16} class="size-4" />
      <span class="sr-only">{text("ui.pagination.more")}</span>
    </span>
  );
};

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
