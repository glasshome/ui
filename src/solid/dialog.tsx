import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Dialog = DialogPrimitive;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.CloseButton;

const DialogContent: ParentComponent<ComponentProps<typeof DialogPrimitive.Content>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay class="data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[closed]:animate-out data-[expanded]:animate-in" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        class={cn(
          "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[closed]:animate-out data-[expanded]:animate-in sm:rounded-lg",
          local.class,
        )}
        {...others}
      >
        {local.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

const DialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="dialog-header"
      class={cn("flex flex-col gap-2 text-center sm:text-left", local.class)}
      {...others}
    />
  );
};

const DialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="dialog-footer"
      class={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", local.class)}
      {...others}
    />
  );
};

const DialogTitle: Component<ComponentProps<typeof DialogPrimitive.Title>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn("font-semibold text-lg leading-none tracking-tight", local.class)}
      {...others}
    />
  );
};

const DialogDescription: Component<ComponentProps<typeof DialogPrimitive.Description>> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...others}
    />
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
