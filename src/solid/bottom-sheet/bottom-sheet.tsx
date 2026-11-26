import {
  type Component,
  type ComponentProps,
  createContext,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  type JSX,
  onCleanup,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Polymorphic } from "../../lib/behavior/polymorphic.js";
import { usePortalMount } from "../portal-mount.js";
import { createControllableSignal } from "../../lib/behavior/controllable.js";
import { Z } from "../../lib/layers.js";
import {
  OVERLAY_SURFACE_OPAQUE,
  SCRIM_CONTAIN,
  SCROLL_CONTAIN,
} from "../../lib/overlay-classes.js";
import { coverNow } from "../../lib/page-cover.js";
import { callEventHandler, effect } from "../../lib/behavior/solid.js";
import { cn } from "../../lib/utils.js";
import { type MotionEvent, watchMotion } from "../../lib/behavior/presence.js";
import { MOTION_EXIT_MS } from "../../lib/motion-classes.js";
import {
  createModalLabels,
  createModalParts,
  MODAL_DESCRIPTION,
  MODAL_MAX_H,
  MODAL_TITLE,
  ModalLabelsProvider,
  useModalLabels,
} from "../dialog-parts.js";
import { attachDrag } from "./drag-controller.js";
import { createDismiss } from "../../lib/behavior/dismiss.js";
import { createFocusScope, type InitialFocus } from "../../lib/behavior/focus-scope.js";
import { createHideOutside } from "../../lib/behavior/hide-outside.js";
import { registerLayer } from "../../lib/behavior/layer-stack.js";
import { watchKeyboard } from "./keyboard.js";
import { assertTransition, type SheetState } from "./state-machine.js";

interface BottomSheetContextValue {
  state: () => SheetState;
  setState: (next: SheetState) => void;
  open: () => boolean;
  setOpen: (next: boolean) => void;
  dismissible: () => boolean;
  contentRef: () => HTMLDivElement | undefined;
  setContentRef: (el: HTMLDivElement | undefined) => void;
}

const isSheetMotion = (e: MotionEvent) =>
  "animationName" in e
    ? e.animationName === "bs-slide-up" || e.animationName === "bs-slide-down"
    : e.propertyName === "transform";

const BottomSheetContext = createContext<BottomSheetContextValue>();

function useBottomSheetContext(): BottomSheetContextValue {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) throw new Error("BottomSheet components must be used within <BottomSheet>");
  return ctx;
}

interface BottomSheetRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dismissible?: boolean;
  children: JSX.Element;
}

const BottomSheet: ParentComponent<BottomSheetRootProps> = (props) => {
  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const [state, setStateRaw] = createSignal<SheetState>("closed");
  const [contentRef, setContentRef] = createSignal<HTMLDivElement | undefined>(undefined);

  const setState = (next: SheetState) => {
    const current = state();
    assertTransition(current, next);
    setStateRaw(next);
  };

  const dismissible = () => props.dismissible !== false;

  createEffect(() => {
    const isOpen = open();
    const s = state();
    if (isOpen && s === "closed") {
      setState("opening");
    } else if (
      !isOpen &&
      (s === "open" || s === "opening" || s === "pressing" || s === "dragging" || s === "snapping")
    ) {
      setState("closing");
    }
  });

  return (
    <BottomSheetContext.Provider
      value={{
        state,
        setState,
        open,
        setOpen,
        dismissible,
        contentRef,
        setContentRef,
      }}
    >
      {props.children}
    </BottomSheetContext.Provider>
  );
};

/* A button by default; rendered as a link it takes the anchor's own props. */
type SheetButtonProps = ComponentProps<"button"> &
  Partial<Pick<ComponentProps<"a">, "href" | "target" | "rel">> & { as?: ValidComponent };

const BottomSheetTrigger: ParentComponent<SheetButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["children", "onClick", "as"]);
  const ctx = useBottomSheetContext();
  return (
    <Polymorphic
      defaultAs="button"
      as={local.as}
      data-slot="bottom-sheet-trigger"
      aria-haspopup="dialog"
      aria-expanded={ctx.open()}
      onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
        callEventHandler(event, local.onClick);
        ctx.setOpen(true);
      }}
      {...rest}
    >
      {local.children}
    </Polymorphic>
  );
};

interface BottomSheetPortalProps {
  children: JSX.Element;
  mount?: Node;
}

const BottomSheetPortal: Component<BottomSheetPortalProps> = (props) => {
  const ctx = useBottomSheetContext();
  const portalMount = usePortalMount();
  const mounted = () => ctx.state() !== "closed";
  return (
    <Show when={mounted()}>
      <Portal mount={props.mount ?? portalMount}>{props.children}</Portal>
    </Show>
  );
};

const BottomSheetOverlay: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const ctx = useBottomSheetContext();

  const dataState = () => {
    const s = ctx.state();
    if (s === "closing") return "closing";
    if (s === "opening" || s === "closed") return s;
    return "open";
  };

  return (
    <div
      data-slot="bottom-sheet-overlay"
      data-sheet-overlay=""
      data-state={dataState()}
      aria-hidden="true"
      class={cn(
        `fixed inset-0 touch-none bg-black/80 transition-opacity duration-300 ease-out ${SCRIM_CONTAIN}`,
        "data-[state=closing]:opacity-0 data-[state=open]:opacity-100",
        local.class,
      )}
      style={{ "z-index": Z.sheet }}
      {...rest}
    />
  );
};

interface BottomSheetContentProps extends ComponentProps<"div"> {
  initialFocus?: InitialFocus;
  /** Names a sheet that has no `BottomSheetTitle`. A registered Title wins. */
  ariaLabel?: string;
}

const BottomSheetContent: ParentComponent<BottomSheetContentProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "initialFocus",
    "ariaLabel",
    "style",
  ]);
  const ctx = useBottomSheetContext();
  const labels = createModalLabels();
  let el: HTMLDivElement | undefined;

  const present = createMemo(() => ctx.state() !== "closed");

  effect(present, (on) => (on && el ? coverNow(el) : undefined));

  const clearAnimInline = () => {
    if (!el) return;
    el.style.transition = "";
    el.style.animation = "";
    el.style.transform = "";
  };

  createEffect(() => {
    const s = ctx.state();
    if (s !== "opening" && s !== "closing" && s !== "snapping") return;
    const node = el;
    if (!node) return;
    onCleanup(
      watchMotion(
        node,
        MOTION_EXIT_MS.sheet,
        () => {
          if (s === "opening") ctx.setState("open");
          else {
            ctx.setState(s === "snapping" ? "open" : "closed");
            clearAnimInline();
          }
        },
        isSheetMotion,
      ),
    );
  });

  createEffect(() => {
    const node = ctx.contentRef();
    if (!node) return;
    const handle = attachDrag({
      el: node,
      getState: ctx.state,
      setState: ctx.setState,
      requestClose: () => ctx.setOpen(false),
    });
    onCleanup(() => handle.destroy());
  });

  createEffect(() => {
    const node = ctx.contentRef();
    if (!node) return;
    if (!present()) return;
    const handle = watchKeyboard(node);
    onCleanup(() => handle.destroy());
  });

  const handle = registerLayer({
    element: ctx.contentRef,
    open: ctx.open,
    kind: "modal",
    escape: ctx.dismissible,
    dismiss: () => ctx.setOpen(false),
  });

  createHideOutside({ layer: handle, active: ctx.open });

  createFocusScope({
    container: ctx.contentRef,
    active: () => ctx.state() !== "closed" && ctx.state() !== "closing",
    trapped: () => true,
    initialFocus: local.initialFocus ?? "container",
  });

  createDismiss({
    layer: handle,
    outsidePress: ctx.dismissible,
    onDismiss: (reason) => {
      if (reason === "outside-press" && ctx.state() !== "open") return;
      ctx.setOpen(false);
    },
  });

  const setRef = (node: HTMLDivElement) => {
    el = node;
    ctx.setContentRef(node);
  };

  onCleanup(() => {
    ctx.setContentRef(undefined);
  });

  const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <ModalLabelsProvider value={labels}>
      <div
        {...rest}
        ref={setRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.labelledBy() ? undefined : local.ariaLabel}
        aria-labelledby={labels.labelledBy()}
        aria-describedby={labels.describedBy()}
        tabIndex={-1}
        data-slot="bottom-sheet-content"
        data-sheet-content=""
        data-state={ctx.state()}
        data-reduced-motion={prefersReducedMotion() ? "" : undefined}
        style={{
          ...(typeof local.style === "object" ? local.style : {}),
          "z-index": Z.sheet,
          "will-change": "transform",
          "touch-action": "none",
          "-webkit-tap-highlight-color": "transparent",
        }}
        class={cn(
          "bs-content",
          `fixed inset-x-0 bottom-0 flex ${MODAL_MAX_H} flex-col ${SCROLL_CONTAIN} overflow-hidden rounded-t-xl ${OVERLAY_SURFACE_OPAQUE} outline-none [--glass-edge:transparent]`,
          local.class,
        )}
      >
        {local.children}
      </div>
    </ModalLabelsProvider>
  );
};

const BottomSheetHandle: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="bottom-sheet-handle"
      data-sheet-handle=""
      aria-hidden="true"
      class={cn(
        "flex h-8 w-full shrink-0 touch-none items-center justify-center select-none",
        local.class,
      )}
      {...rest}
    >
      <div class="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
    </div>
  );
};

/* Only the Body: a titled, footed sheet is a ResponsiveDialog, which renders
 * its own Header and Footer around this same surface. */
const { Body: BottomSheetBody } = createModalParts("bottom-sheet");

const BottomSheetTitle: Component<ComponentProps<"h2">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const labels = useModalLabels();
  const id = () => rest.id ?? labels?.titleId;
  createRenderEffect(() => labels?.registerTitle(id()));
  return (
    <h2 data-slot="bottom-sheet-title" id={id()} class={cn(MODAL_TITLE, local.class)} {...rest} />
  );
};

const BottomSheetDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const labels = useModalLabels();
  const id = () => rest.id ?? labels?.descriptionId;
  createRenderEffect(() => labels?.registerDescription(id()));
  return (
    <p
      data-slot="bottom-sheet-description"
      id={id()}
      class={cn(MODAL_DESCRIPTION, local.class)}
      {...rest}
    />
  );
};

const BottomSheetClose: ParentComponent<SheetButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["children", "onClick", "as"]);
  const ctx = useBottomSheetContext();
  return (
    <Polymorphic
      defaultAs="button"
      as={local.as}
      data-slot="bottom-sheet-close"
      onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
        callEventHandler(event, local.onClick);
        ctx.setOpen(false);
      }}
      {...rest}
    >
      {local.children}
    </Polymorphic>
  );
};

export {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHandle,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  BottomSheetTrigger,
};
