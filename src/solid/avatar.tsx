import { Image as ImagePrimitive } from "@kobalte/core/image";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Avatar: Component<ComponentProps<typeof ImagePrimitive>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ImagePrimitive
      data-slot="avatar"
      class={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", local.class)}
      {...rest}
    />
  );
};

const AvatarImage: Component<ComponentProps<typeof ImagePrimitive.Img>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ImagePrimitive.Img
      data-slot="avatar-image"
      class={cn("aspect-square size-full", local.class)}
      {...rest}
    />
  );
};

const AvatarFallback: Component<ComponentProps<typeof ImagePrimitive.Fallback>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ImagePrimitive.Fallback
      data-slot="avatar-fallback"
      class={cn("flex size-full items-center justify-center rounded-full bg-muted", local.class)}
      {...rest}
    />
  );
};

export { Avatar, AvatarImage, AvatarFallback };
