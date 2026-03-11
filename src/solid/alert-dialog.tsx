import { AlertDialog as AlertDialogPrimitive } from "@kobalte/core/alert-dialog";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

const AlertDialog = AlertDialogPrimitive;

const AlertDialogTrigger: Component<ComponentProps<typeof AlertDialogPrimitive.Trigger>> = (
  props,
) => {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
};

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay: Component<ComponentProps<typeof AlertDialogPrimitive.Overlay>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      class={cn(
        "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[closed]:animate-out data-[expanded]:animate-in",
        local.class,
      )}
      {...rest}
    />
  );
};

const AlertDialogContent: Component<ComponentProps<typeof AlertDialogPrimitive.Content>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        class={cn(
          "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[closed]:animate-out data-[expanded]:animate-in sm:max-w-lg",
          local.class,
        )}
        {...rest}
      />
    </AlertDialogPrimitive.Portal>
  );
};

const AlertDialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="alert-dialog-header"
      class={cn("flex flex-col gap-2 text-center sm:text-left", local.class)}
      {...rest}
    />
  );
};

const AlertDialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="alert-dialog-footer"
      class={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", local.class)}
      {...rest}
    />
  );
};

const AlertDialogTitle: Component<ComponentProps<typeof AlertDialogPrimitive.Title>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      class={cn("font-semibold text-lg", local.class)}
      {...rest}
    />
  );
};

const AlertDialogDescription: Component<ComponentProps<typeof AlertDialogPrimitive.Description>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

const AlertDialogAction: Component<ComponentProps<typeof AlertDialogPrimitive.CloseButton>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return <AlertDialogPrimitive.CloseButton class={cn(buttonVariants(), local.class)} {...rest} />;
};

const AlertDialogCancel: Component<ComponentProps<typeof AlertDialogPrimitive.CloseButton>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AlertDialogPrimitive.CloseButton
      class={cn(buttonVariants({ variant: "outline" }), local.class)}
      {...rest}
    />
  );
};

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
