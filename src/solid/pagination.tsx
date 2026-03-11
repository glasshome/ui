import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-solid";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

const Pagination: Component<ComponentProps<"nav">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      class={cn("mx-auto flex w-full justify-center", local.class)}
      {...rest}
    />
  );
};

const PaginationContent: Component<ComponentProps<"ul">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ul
      data-slot="pagination-content"
      class={cn("flex flex-row items-center gap-1", local.class)}
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
  const [local, rest] = splitProps(props, ["class", "isActive", "size"]);
  const size = () => local.size ?? "icon";
  return (
    <a
      aria-current={local.isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={local.isActive}
      class={cn(
        buttonVariants({
          variant: local.isActive ? "outline" : "ghost",
          size: size(),
        }),
        local.class,
      )}
      {...rest}
    />
  );
};

const PaginationPrevious: Component<PaginationLinkProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      class={cn("gap-1 px-2.5 sm:pl-2.5", local.class)}
      {...rest}
    >
      <ChevronLeft />
      <span class="hidden sm:block">Previous</span>
    </PaginationLink>
  );
};

const PaginationNext: Component<PaginationLinkProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      class={cn("gap-1 px-2.5 sm:pr-2.5", local.class)}
      {...rest}
    >
      <span class="hidden sm:block">Next</span>
      <ChevronRight />
    </PaginationLink>
  );
};

const PaginationEllipsis: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      class={cn("flex size-9 items-center justify-center", local.class)}
      {...rest}
    >
      <MoreHorizontal class="size-4" />
      <span class="sr-only">More pages</span>
    </span>
  );
};

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
