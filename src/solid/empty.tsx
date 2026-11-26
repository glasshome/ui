import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { ICON_PILL } from "../lib/pill-classes.js";
import { cn } from "../lib/utils.js";

const Empty: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="empty"
      class={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center text-balance md:p-12",
        props.class,
      )}
      {...rest}
    />
  );
};

const EmptyHeader: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="empty-header"
      class={cn("flex max-w-sm flex-col items-center gap-2 text-center", props.class)}
      {...rest}
    />
  );
};

type EmptyMediaKind = "icon";

const EMPTY_MEDIA: Record<EmptyMediaKind, string> = {
  icon: `${ICON_PILL} size-10 rounded-lg [&_svg:not([class*='size-'])]:size-6`,
};

const EmptyMedia: Component<
  ComponentProps<"div"> & {
    media?: EmptyMediaKind;
  }
> = (props) => {
  const rest = omit(props, "class", "media");
  const media = () => props.media;
  return (
    <div
      data-slot="empty-media"
      data-media={media()}
      data-variant={media() ?? "default"}
      class={cn(
        "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
        media() && EMPTY_MEDIA[media() as EmptyMediaKind],
        props.class,
      )}
      {...rest}
    />
  );
};

const EmptyTitle: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="empty-title"
      class={cn("text-lg font-semibold tracking-tight", props.class)}
      {...rest}
    />
  );
};

const EmptyDescription: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="empty-description"
      class={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        props.class,
      )}
      {...rest}
    />
  );
};

const EmptyContent: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="empty-content"
      class={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        props.class,
      )}
      {...rest}
    />
  );
};

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
