import {
  type Component,
  type ComponentProps,
  createContext,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/utils";
import { Button } from "./button";

const MOBILE_BREAKPOINT = 640;

function createIsMobileDialog(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = createSignal(
    typeof window !== "undefined" && window.innerWidth < breakpoint,
  );

  onMount(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    onCleanup(() => window.removeEventListener("resize", check));
  });

  return isMobile;
}

interface DialogContextType {
  open: () => boolean;
  setOpen: (open: boolean) => void;
  close: () => void;
  isMobile: () => boolean;
}

const DialogContext = createContext<DialogContextType>();

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within ResponsiveDialog");
  return ctx;
}

// Root
interface ResponsiveDialogProps {
  children: JSX.Element;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

const ResponsiveDialog: ParentComponent<ResponsiveDialogProps> = (props) => {
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(props.defaultOpen ?? false);
  const isMobile = createIsMobileDialog();

  const isControlled = () => props.open !== undefined;
  const open = () => (isControlled() ? props.open! : uncontrolledOpen());

  const setOpen = (newOpen: boolean) => {
    if (!isControlled()) setUncontrolledOpen(newOpen);
    props.onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen, close: () => setOpen(false), isMobile }}>
      {props.children}
    </DialogContext.Provider>
  );
};

// Trigger
const ResponsiveDialogTrigger: ParentComponent<ComponentProps<"button">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const { setOpen } = useDialogContext();

  return (
    <button type="button" onClick={() => setOpen(true)} class={local.class} {...rest}>
      {local.children}
    </button>
  );
};

// Content
const ResponsiveDialogContent: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const ctx = useDialogContext();
  const { open, setOpen, isMobile } = ctx;
  const [isClosing, setIsClosing] = createSignal(false);
  const [isOpening, setIsOpening] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;
  let previousActiveElement: HTMLElement | null = null;

  const handleClose = () => {
    if (isClosing()) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
      previousActiveElement?.focus();
    }, 300);
  };

  ctx.close = handleClose;

  createEffect(() => {
    if (open()) {
      setIsOpening(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpening(false);
        });
      });
    }
  });

  createEffect(() => {
    if (open()) {
      previousActiveElement = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => contentRef?.focus(), 0);
    }

    onCleanup(() => {
      document.body.style.overflow = "";
    });
  });

  // Escape key
  createEffect(() => {
    if (!open()) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
  });

  // Focus trap
  createEffect(() => {
    if (!open() || !contentRef) return;

    const onTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !contentRef) return;

      const focusable = contentRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", onTabKey);
    onCleanup(() => document.removeEventListener("keydown", onTabKey));
  });

  const visible = () => open() || isClosing();

  return (
    <Show when={visible()}>
      <Portal>
        <div class="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            class={cn(
              "fixed inset-0 bg-black/80 transition-opacity duration-100 ease-out",
              isClosing() || isOpening() ? "opacity-0" : "opacity-100",
            )}
            onClick={handleClose}
            aria-hidden="true"
          />

          <Show
            when={isMobile()}
            fallback={
              /* Desktop: Centered Dialog */
              <div
                class="fixed inset-0 flex items-start justify-center p-4 pt-[15vh]"
                onClick={handleClose}
              >
                <div
                  ref={contentRef}
                  role="dialog"
                  aria-modal="true"
                  tabIndex={-1}
                  class={cn(
                    "relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg outline-none transition-all duration-50 ease-out",
                    isClosing() || isOpening() ? "scale-95 opacity-0" : "scale-100 opacity-100",
                    local.class,
                  )}
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                  {...rest}
                >
                  {local.children}
                </div>
              </div>
            }
          >
            {/* Mobile: Bottom Sheet */}
            <MobileSheet
              ref={(el) => (contentRef = el)}
              class={local.class}
              isClosing={isClosing()}
              isOpening={isOpening()}
              onDismiss={handleClose}
            >
              {local.children}
            </MobileSheet>
          </Show>
        </div>
      </Portal>
    </Show>
  );
};

// Header
const ResponsiveDialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="responsive-dialog-header"
      class={cn("flex flex-col space-y-1.5 pb-4 text-left", local.class)}
      {...rest}
    />
  );
};

// Title
const ResponsiveDialogTitle: Component<ComponentProps<"h2">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <h2
      data-slot="responsive-dialog-title"
      class={cn("font-semibold text-foreground text-lg leading-none tracking-tight", local.class)}
      {...rest}
    />
  );
};

// Description
const ResponsiveDialogDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <p
      data-slot="responsive-dialog-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

// Footer
const ResponsiveDialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="responsive-dialog-footer"
      class={cn("flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end", local.class)}
      {...rest}
    />
  );
};

// Close Button
const ResponsiveDialogClose: ParentComponent<ComponentProps<"button">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const { close } = useDialogContext();

  return (
    <Button variant="outline" onClick={() => close()} class={local.class} {...rest}>
      {local.children ?? "Close"}
    </Button>
  );
};

// Swipe-to-close bottom sheet for mobile
const CLOSE_THRESHOLD = 80;

const MobileSheet: ParentComponent<{
  class?: string;
  isClosing: boolean;
  isOpening: boolean;
  onDismiss: () => void;
  ref?: (el: HTMLDivElement) => void;
}> = (props) => {

  const [dragY, setDragY] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);
  let startY = 0;
  let sheetRef: HTMLDivElement | undefined;

  function onPointerDown(e: PointerEvent) {
    const target = e.target as HTMLElement;
    // Only start drag from the handle area (top 32px of sheet)
    const rect = sheetRef?.getBoundingClientRect();
    if (!rect || e.clientY > rect.top + 40) return;
    // Don't drag if touching an interactive element
    if (target.closest("button, input, select, textarea, a, [role=button]")) return;

    startY = e.clientY;
    setIsDragging(true);
    setDragY(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging()) return;
    const dy = Math.max(0, e.clientY - startY);
    setDragY(dy);
  }

  function onPointerUp() {
    if (!isDragging()) return;
    setIsDragging(false);
    if (dragY() > CLOSE_THRESHOLD) {
      props.onDismiss();
    }
    setDragY(0);
  }

  return (
    <div class="fixed inset-0 flex flex-col justify-end" onClick={props.onDismiss}>
      <div
        ref={(el) => {
          sheetRef = el;
          props.ref?.(el);
        }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        class={cn(
          "relative max-h-[85vh] w-full overflow-y-auto rounded-t-xl border-border border-x border-t bg-background p-6 shadow-lg outline-none",
          !isDragging() && "transition-transform duration-300 ease-out",
          props.isClosing || props.isOpening ? "translate-y-full" : "translate-y-0",
          props.class,
        )}
        style={{
          transform:
            isDragging() || dragY() > 0 ? `translateY(${dragY()}px)` : undefined,
        }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => onPointerUp()}
      >
        {/* Drag handle */}
        <div class="absolute top-0 left-0 flex h-8 w-full cursor-grab items-center justify-center active:cursor-grabbing">
          <div class="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>
        <div class="pt-4">{props.children}</div>
      </div>
    </div>
  );
};

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
