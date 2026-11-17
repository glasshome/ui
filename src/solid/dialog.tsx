import { usePortalMount } from "./portal-mount.js";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  type ParentComponent,
  splitProps,
  type ValidComponent,
} from "solid-js";
import { overAnchor } from "../lib/anchor-placement.js";
import {
  ModalDescription,
  ModalFrame,
  type ModalPartProps,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
  useDialogContext,
} from "../lib/behavior/modal-root.js";
import { MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { inShadowRoot } from "../lib/shadow-layer.js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import {
  ANCHORED_PANEL,
  createModalDismiss,
  createModalHead,
  createModalParts,
  MODAL_ANCHOR,
  MODAL_DESCRIPTION,
  MODAL_PANEL,
  MODAL_SCRIM,
  MODAL_TITLE,
  MODAL_WIDTH,
  type ModalDismissProps,
  ModalCover,
  type ModalSize,
} from "./dialog-parts.js";

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Modal toward the page. Defaults to true on the page and false inside a shadow root. */
  modal?: boolean;
  /** @deprecated No effect; the panel takes its own id. */
  id?: string;
  /** @deprecated No effect; the panel stays mounted through its exit on its own. */
  forceMount?: boolean;
  /** @deprecated No effect; a dialog never locks page scroll. */
  preventScroll?: boolean;
  /** @deprecated No effect. */
  translations?: Record<string, string>;
  children?: JSX.Element;
}

const Dialog: ParentComponent<DialogProps> = (props) => {
  const mount = usePortalMount();
  return (
    <ModalRoot
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      modal={props.modal ?? !inShadowRoot(mount)}
      role="dialog"
    >
      {props.children}
    </ModalRoot>
  );
};

function DialogTrigger<T extends ValidComponent = "button">(props: ModalPartProps<T>): JSX.Element {
  return <ModalTrigger data-slot="dialog-trigger" {...(props as ModalPartProps<"button">)} />;
}

type DialogCloseProps = ModalDismissProps &
  Partial<Pick<VariantProps<typeof buttonVariants>, "variant" | "size">>;

const DialogDismiss = createModalDismiss("dialog-close", useDialogContext);

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

type DialogContentProps = Omit<ComponentProps<"div">, "style" | "role"> & {
  as?: ValidComponent;
  style?: JSX.CSSProperties | string;
  size?: ModalSize;
  /** Names a panel that has no `DialogTitle`. A registered Title wins. */
  ariaLabel?: string;
  /** Opens the panel out of this element (the tile it came from): it grows from the element's box
   *  over it instead of appearing centred, and closes back into it. */
  anchor?: HTMLElement;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  /** @deprecated No effect; focus never leaves an open dialog. */
  onFocusOutside?: (event: Event) => void;
  /** @deprecated No effect; the panel stays mounted through its exit on its own. */
  forceMount?: boolean;
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
    "onPointerDownOutside",
    "onInteractOutside",
    "onFocusOutside",
    "forceMount",
  ]);
  const ctx = useDialogContext();
  const [viewport, setViewport] = createSignal(0);
  const [height, setHeight] = createSignal<number>();
  createEffect(() => {
    if (!local.anchor || !ctx.isOpen()) return;
    const measure = () => setViewport((n) => n + 1);
    window.addEventListener("resize", measure);
    onCleanup(() => window.removeEventListener("resize", measure));
  });
  createEffect(() => {
    const el = ctx.panel();
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
    <>
      <ModalCover panel={ctx.panel} open={ctx.isOpen} />
      <ModalFrame
        slot="dialog"
        mount={usePortalMount()}
        exitMs={local.anchor ? MOTION_EXIT_MS.anchored : MOTION_EXIT_MS.modal}
        scrimClass={MODAL_SCRIM}
        panelClass={cn(
          local.anchor ? ANCHORED_PANEL : MODAL_PANEL,
          !local.anchor && MODAL_WIDTH[local.size ?? "lg"],
          !local.anchor && MODAL_ANCHOR[local.size ?? "lg"],
          local.class,
        )}
        panelStyle={{ ...(typeof local.style === "object" ? local.style : {}), ...placement() }}
        ariaLabel={local.ariaLabel}
        ref={(el: HTMLElement) => {
          if (typeof local.ref === "function") local.ref(el as HTMLDivElement);
        }}
        onInteractOutside={(event: Event) => {
          local.onPointerDownOutside?.(event);
          local.onInteractOutside?.(event);
        }}
        {...others}
      >
        {local.children}
      </ModalFrame>
    </>
  );
};

const { Header: DialogHeader, Body: DialogBody, Footer: DialogFooter } = createModalParts("dialog");

function DialogTitle<T extends ValidComponent = "h2">(props: ModalPartProps<T>): JSX.Element {
  const [local, others] = splitProps(props as ModalPartProps<"h2">, ["class"]);
  return <ModalTitle data-slot="dialog-title" class={cn(MODAL_TITLE, local.class)} {...others} />;
}

function DialogDescription<T extends ValidComponent = "p">(props: ModalPartProps<T>): JSX.Element {
  const [local, others] = splitProps(props as ModalPartProps<"p">, ["class"]);
  return (
    <ModalDescription
      data-slot="dialog-description"
      class={cn(MODAL_DESCRIPTION, local.class)}
      {...others}
    />
  );
}

const DialogHead = createModalHead(
  DialogHeader,
  DialogTitle as Component<ComponentProps<"h2">>,
  DialogDescription as Component<ComponentProps<"p">>,
);

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHead,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
