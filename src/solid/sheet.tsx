import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { X } from "lucide-solid";
import {
  type Component,
  type ComponentProps,
  type JSX,
  type ParentComponent,
  splitProps,
} from "solid-js";
import { cn } from "../lib/utils";

const Sheet = DialogPrimitive;

const SheetTrigger: Component<ComponentProps<typeof DialogPrimitive.Trigger>> = (props) => {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
};

const SheetClose = DialogPrimitive.CloseButton;

const SheetOverlay: Component<ComponentProps<typeof DialogPrimitive.Overlay>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      class={cn(
        "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 pointer-events-auto fixed inset-0 z-50 select-none bg-black/50 data-[closed]:animate-out data-[expanded]:animate-in",
        local.class,
      )}
      {...rest}
    />
  );
};

const SheetContent: ParentComponent<
  ComponentProps<typeof DialogPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    above?: JSX.Element;
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "side", "above"]);
  const side = () => local.side ?? "right";
  const isBottom = () => side() === "bottom";

  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        class={cn(
          "fixed z-50 flex transition ease-in-out focus:outline-none focus-visible:outline-none data-[closed]:animate-out data-[expanded]:animate-in data-[closed]:duration-300 data-[expanded]:duration-500",
          side() === "right" &&
            "data-[closed]:slide-out-to-right data-[expanded]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 bg-background shadow-lg sm:max-w-sm",
          side() === "left" &&
            "data-[closed]:slide-out-to-left data-[expanded]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 bg-background shadow-lg sm:max-w-sm",
          side() === "top" &&
            "data-[closed]:slide-out-to-top data-[expanded]:slide-in-from-top inset-x-0 top-0 h-auto bg-background shadow-lg",
          side() === "bottom" &&
            "data-[closed]:slide-out-to-bottom data-[expanded]:slide-in-from-bottom inset-x-0 bottom-0 flex h-auto max-h-[85vh] flex-col p-0",
          local.class,
        )}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
        {...rest}
      >
        {local.above && (
          <div data-slot="sheet-content-above" class="flex w-full items-end justify-center">
            {local.above}
          </div>
        )}
        <div
          class={cn(
            "relative flex flex-col",
            isBottom() && "w-full overflow-hidden rounded-t-lg border bg-background shadow-lg",
          )}
        >
          <div class={cn("flex min-h-0 flex-1 flex-col", isBottom() && "overflow-y-auto")}>
            {local.children}
          </div>
          <DialogPrimitive.CloseButton class="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[expanded]:bg-secondary">
            <X class="size-4" />
            <span class="sr-only">Close</span>
          </DialogPrimitive.CloseButton>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

const SheetHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sheet-header"
      class={cn("flex flex-col gap-1.5 px-4 py-4 sm:px-6", local.class)}
      {...rest}
    />
  );
};

const SheetFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sheet-footer"
      class={cn("mt-auto flex flex-col gap-2 px-4 py-4 sm:px-6", local.class)}
      {...rest}
    />
  );
};

const SheetTitle: Component<ComponentProps<typeof DialogPrimitive.Title>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      class={cn("font-semibold text-foreground", local.class)}
      {...rest}
    />
  );
};

const SheetDescription: Component<ComponentProps<typeof DialogPrimitive.Description>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
