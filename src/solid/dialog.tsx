import { usePortalMount } from "./portal-mount.js";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  onCleanup,
  type ParentComponent,
  splitProps,
} from "solid-js";
import { overAnchor } from "../lib/anchor-placement.js";
import { ModalFrame, useDialogContext } from "../lib/behavior/modal-root.js";
import { MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import {
  ANCHORED_PANEL,
  createModalDismiss,
  createModalHead,
  createModalParts,
  createModalRootSkin,
  createModalTextParts,
  MODAL_ANCHOR,
  MODAL_PANEL,
  MODAL_SCRIM,
  MODAL_WIDTH,
  type ModalContentProps,
  type ModalDismissProps,
  ModalCover,
  type ModalSize,
} from "./dialog-parts.js";

const Dialog = createModalRootSkin("dialog");

const {
  Trigger: DialogTrigger,
  Title: DialogTitle,
  Description: DialogDescription,
} = createModalTextParts("dialog");

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

type DialogContentProps = ModalContentProps & {
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
  const placement = createMemo<JSX.CSSProperties | undefined>((last) => {
    if (!ctx.isOpen()) return last;
    viewport();
    const a = local.anchor;
    return a ? overAnchor(a, ANCHORED_WIDTH[local.size ?? "lg"], height()) : undefined;
  });
  return (
    <>
      <ModalCover panel={ctx.panel} open={ctx.isOpen} dormant={ctx.dormant} />
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
        {...others}
      >
        {local.children}
      </ModalFrame>
    </>
  );
};

const { Header: DialogHeader, Body: DialogBody, Footer: DialogFooter } = createModalParts("dialog");

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
