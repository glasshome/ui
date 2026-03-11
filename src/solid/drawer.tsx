import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Drawer = DialogPrimitive;

const DrawerTrigger: Component<ComponentProps<typeof DialogPrimitive.Trigger>> = (props) => {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
};

const DrawerClose = DialogPrimitive.CloseButton;

const DrawerOverlay: Component<ComponentProps<typeof DialogPrimitive.Overlay>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Overlay
      data-slot="drawer-overlay"
      class={cn(
        "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[closed]:animate-out data-[expanded]:animate-in",
        local.class,
      )}
      {...rest}
    />
  );
};

const DrawerContent: ParentComponent<
  ComponentProps<typeof DialogPrimitive.Content> & {
    direction?: "top" | "right" | "bottom" | "left";
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "direction"]);
  const direction = () => local.direction ?? "bottom";

  return (
    <DialogPrimitive.Portal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        data-slot="drawer-content"
        data-direction={direction()}
        class={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-background transition ease-in-out focus:outline-none focus-visible:outline-none data-[closed]:animate-out data-[expanded]:animate-in data-[closed]:duration-300 data-[expanded]:duration-500",
          direction() === "bottom" &&
            "data-[closed]:slide-out-to-bottom data-[expanded]:slide-in-from-bottom inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-lg border-t",
          direction() === "top" &&
            "data-[closed]:slide-out-to-top data-[expanded]:slide-in-from-top inset-x-0 top-0 mb-24 max-h-[80vh] rounded-b-lg border-b",
          direction() === "right" &&
            "data-[closed]:slide-out-to-right data-[expanded]:slide-in-from-right inset-y-0 right-0 w-3/4 border-l sm:max-w-sm",
          direction() === "left" &&
            "data-[closed]:slide-out-to-left data-[expanded]:slide-in-from-left inset-y-0 left-0 w-3/4 border-r sm:max-w-sm",
          local.class,
        )}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
        {...rest}
      >
        {direction() === "bottom" && (
          <div class="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
        )}
        {local.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

const DrawerHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="drawer-header"
      class={cn("flex flex-col gap-0.5 p-4 text-center md:gap-1.5 md:text-left", local.class)}
      {...rest}
    />
  );
};

const DrawerFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="drawer-footer"
      class={cn("mt-auto flex flex-col gap-2 p-4", local.class)}
      {...rest}
    />
  );
};

const DrawerTitle: Component<ComponentProps<typeof DialogPrimitive.Title>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      class={cn("font-semibold text-foreground", local.class)}
      {...rest}
    />
  );
};

const DrawerDescription: Component<ComponentProps<typeof DialogPrimitive.Description>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

export {
  Drawer,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
