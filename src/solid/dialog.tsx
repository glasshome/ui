import { Dialog as DialogPrimitive, useDialogContext } from "@kobalte/core/dialog";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createEffect,
  createSignal,
  onCleanup,
  type ParentComponent,
  splitProps,
} from "solid-js";
import { overAnchor } from "../lib/anchor-placement.js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import {
  ANCHORED_PANEL,
  createModalDismiss,
  createModalParts,
  MODAL_ANCHOR,
  MODAL_DESCRIPTION,
  MODAL_PANEL,
  MODAL_SCRIM,
  MODAL_TITLE,
  MODAL_WIDTH,
  type ModalDismissProps,
  ModalScrollLock,
  type ModalSize,
} from "./dialog-parts.js";

/* Kobalte's own scroll lock is off everywhere: one refcounted lock
 * (bottom-sheet/scroll-lock.ts) serves every modal family, so a nested modal
 * cannot release the page early. */
const Dialog: ParentComponent<ComponentProps<typeof DialogPrimitive>> = (props) => (
  <DialogPrimitive {...props} preventScroll={false} />
);

const DialogTrigger: Component<ComponentProps<typeof DialogPrimitive.Trigger>> = (props) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);

type DialogCloseProps = ModalDismissProps &
  Partial<Pick<VariantProps<typeof buttonVariants>, "variant" | "size">>;

const DialogDismiss = createModalDismiss("dialog-close");

/** Already the outline button, so `as` is for a non-button element (a link),
 *  never for `Button`: two buttonVariants() calls leave tone knobs side by side
 *  and the later stylesheet rule wins. */
const DialogClose: ParentComponent<DialogCloseProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "children"]);
  return (
    <DialogDismiss
      class={cn(
        buttonVariants({ variant: local.variant ?? "outline", size: local.size }),
        local.class,
      )}
      {...rest}
    >
      {local.children ?? "Close"}
    </DialogDismiss>
  );
};

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  size?: ModalSize;
  /** Names a panel that has no `DialogTitle`. A registered Title wins. */
  ariaLabel?: string;
  /** Opens the panel out of this element (the tile it came from): it grows from the element's box
   *  over it instead of appearing centred, and closes back into it. */
  anchor?: HTMLElement;
};

/* Pixel widths of the sizes an anchored panel keeps (Tailwind's max-w-sm/md/lg/3xl/5xl). */
const ANCHORED_WIDTH: Record<ModalSize, number> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 768,
  full: 1024,
};

const DialogContent: ParentComponent<DialogContentProps> = (props) => {
  const [local, others] = splitProps(props, [
    "class",
    "children",
    "size",
    "ariaLabel",
    "anchor",
    "style",
    "ref",
  ]);
  const context = useDialogContext();
  const [viewport, setViewport] = createSignal(0);
  const [panel, setPanel] = createSignal<HTMLElement>();
  const [height, setHeight] = createSignal<number>();
  createEffect(() => {
    if (!local.anchor || !context.isOpen()) return;
    const measure = () => setViewport((n) => n + 1);
    window.addEventListener("resize", measure);
    onCleanup(() => window.removeEventListener("resize", measure));
  });
  createEffect(() => {
    const el = panel();
    if (!local.anchor || !el) return;
    setHeight(el.offsetHeight);
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  });
  const placement = () => {
    viewport();
    const a = local.anchor;
    return a ? overAnchor(a, ANCHORED_WIDTH[local.size ?? "lg"], height()) : undefined;
  };
  return (
    <DialogPrimitive.Portal>
      <ModalScrollLock />
      <DialogPrimitive.Overlay data-slot="dialog-overlay" class={MODAL_SCRIM} />
      <DialogPrimitive.Content
        ref={(el: HTMLElement) => {
          setPanel(el);
          if (typeof local.ref === "function") local.ref(el);
        }}
        data-slot="dialog-content"
        role="dialog"
        aria-label={context.titleId() ? undefined : local.ariaLabel}
        class={cn(
          local.anchor ? ANCHORED_PANEL : MODAL_PANEL,
          !local.anchor && MODAL_WIDTH[local.size ?? "lg"],
          !local.anchor && MODAL_ANCHOR[local.size ?? "lg"],
          local.class,
        )}
        style={{ ...(typeof local.style === "object" ? local.style : {}), ...placement() }}
        {...others}
      >
        {local.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

const { Header: DialogHeader, Body: DialogBody, Footer: DialogFooter } = createModalParts("dialog");

const DialogTitle: Component<ComponentProps<typeof DialogPrimitive.Title>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn(MODAL_TITLE, local.class)}
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
      class={cn(MODAL_DESCRIPTION, local.class)}
      {...others}
    />
  );
};

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
