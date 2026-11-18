import {
  type Accessor,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
  splitProps,
  untrack,
  useContext,
  type ValidComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import { createControllableSignal } from "./controllable";
import { createDismiss } from "./dismiss";
import { createFocusScope, focusWithoutTracking } from "./focus-scope";
import { createHideOutside } from "./hide-outside";
import { layerStack, registerLayer } from "./layer-stack";
import { Polymorphic } from "./polymorphic";
import { createPresence } from "./presence";
import { callEventHandler, effect, merge } from "./solid";

export type ModalRole = "dialog" | "alertdialog";

export interface ModalRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  role?: ModalRole;
  children?: JSX.Element;
}

export interface ModalContext {
  isOpen: Accessor<boolean>;
  close: () => void;
  toggle: () => void;
  modal: Accessor<boolean>;
  readonly role: ModalRole;
  titleId: Accessor<string | undefined>;
  registerTitle: (id: string) => () => void;
  descriptionId: Accessor<string | undefined>;
  registerDescription: (id: string) => () => void;
  contentId: Accessor<string | undefined>;
  registerContent: (id: string) => () => void;
  triggerRef: Accessor<HTMLElement | undefined>;
  setTriggerRef: (el: HTMLElement | undefined) => void;
  panel: Accessor<HTMLElement | undefined>;
  setPanel: (el: HTMLElement | undefined) => void;
}

const ModalContextValue = createContext<ModalContext>();

export function useDialogContext(): ModalContext {
  const context = useContext(ModalContextValue);
  if (!context) throw new Error("Dialog parts must be used within <Dialog>");
  return context;
}

function createRegistry(): [Accessor<string | undefined>, (id: string) => () => void] {
  const [current, setCurrent] = createSignal<string>();
  const register = (id: string) => {
    setCurrent(id);
    return () => {
      if (untrack(current) === id) setCurrent(undefined);
    };
  };
  return [current, register];
}

export function ModalRoot(props: ModalRootProps): JSX.Element {
  const [isOpen, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const [titleId, registerTitle] = createRegistry();
  const [descriptionId, registerDescription] = createRegistry();
  const [contentId, registerContent] = createRegistry();
  const [triggerRef, setTriggerRef] = createSignal<HTMLElement>();
  const [panel, setPanel] = createSignal<HTMLElement>();
  const context: ModalContext = {
    isOpen,
    close: () => setOpen(false),
    toggle: () => setOpen(!untrack(isOpen)),
    modal: () => props.modal ?? true,
    get role() {
      return props.role ?? "dialog";
    },
    titleId,
    registerTitle,
    descriptionId,
    registerDescription,
    contentId,
    registerContent,
    triggerRef,
    setTriggerRef: (el) => setTriggerRef(el),
    panel,
    setPanel: (el) => setPanel(el),
  };
  return <ModalContextValue.Provider value={context}>{props.children}</ModalContextValue.Provider>;
}

export type ModalPartProps<T extends ValidComponent> = { as?: T } & Omit<ComponentProps<T>, "as">;

export function ModalTrigger<T extends ValidComponent = "button">(
  props: ModalPartProps<T>,
): JSX.Element {
  const ctx = useDialogContext();
  const [local, rest] = splitProps(props as ModalPartProps<ValidComponent>, [
    "as",
    "ref",
    "onClick",
  ]);
  let own: HTMLElement | undefined;
  onCleanup(() => {
    if (own && untrack(ctx.triggerRef) === own) ctx.setTriggerRef(undefined);
  });
  return (
    <Polymorphic
      {...merge(rest, {
        as: local.as,
        defaultAs: "button" as ValidComponent,
        ref: (el: HTMLElement) => {
          own = el;
          ctx.setTriggerRef(el);
          if (typeof local.ref === "function") local.ref(el);
        },
        "aria-haspopup": "dialog",
        get "aria-expanded"() {
          return ctx.isOpen();
        },
        get "aria-controls"() {
          return ctx.isOpen() ? ctx.contentId() : undefined;
        },
        get "data-expanded"() {
          return ctx.isOpen() ? "" : undefined;
        },
        get "data-closed"() {
          return ctx.isOpen() ? undefined : "";
        },
        onClick: (event: MouseEvent & { currentTarget: HTMLElement; target: Element }) => {
          callEventHandler(
            event,
            local.onClick as JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined,
          );
          ctx.toggle();
        },
      })}
    />
  );
}

function createLabelPart(defaultAs: ValidComponent, register: (id: string) => () => void) {
  return (props: ModalPartProps<ValidComponent>): JSX.Element => {
    const [local, rest] = splitProps(props, ["as", "id"]);
    const fallback = createUniqueId();
    const id = (): string => local.id ?? fallback;
    effect(id, register);
    return (
      <Polymorphic
        {...merge(rest, {
          as: local.as,
          defaultAs,
          get id() {
            return id();
          },
        })}
      />
    );
  };
}

export function ModalTitle<T extends ValidComponent = "h2">(props: ModalPartProps<T>): JSX.Element {
  const ctx = useDialogContext();
  return createLabelPart("h2", ctx.registerTitle)(props as ModalPartProps<ValidComponent>);
}

export function ModalDescription<T extends ValidComponent = "p">(
  props: ModalPartProps<T>,
): JSX.Element {
  const ctx = useDialogContext();
  return createLabelPart("p", ctx.registerDescription)(props as ModalPartProps<ValidComponent>);
}

export interface ModalFrameProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "ref" | "style" | "role" | "class"
> {
  slot: string;
  panelClass: string;
  scrimClass: string;
  panelStyle?: JSX.CSSProperties;
  ariaLabel?: string;
  ref?: (el: HTMLElement) => void;
  as?: ValidComponent;
  mount?: Node;
  exitMs: number;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onInteractOutside?: (event: InteractOutsideEvent) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

interface OutsideDetail<T extends Event> {
  originalEvent: T;
  isContextMenu: boolean;
}
export type PointerDownOutsideEvent = CustomEvent<OutsideDetail<PointerEvent>>;
export type FocusOutsideEvent = CustomEvent<OutsideDetail<FocusEvent>>;
export type InteractOutsideEvent = PointerDownOutsideEvent | FocusOutsideEvent;

function vetoed<E extends Event>(handler: ((event: E) => void) | undefined, event: E): boolean {
  handler?.(event);
  return event.defaultPrevented;
}

const onMac = (): boolean => typeof navigator !== "undefined" && /^Mac/i.test(navigator.platform);

function isContextMenu(event: PointerEvent): boolean {
  const ctrl = onMac() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  return event.button === 2 || (ctrl && event.button === 0);
}

const OUTSIDE_EVENT = "interactoutside";

function pointerDownOutside(
  original: PointerEvent,
  handle: (event: PointerDownOutsideEvent) => void,
): PointerDownOutsideEvent {
  const event: PointerDownOutsideEvent = new CustomEvent(OUTSIDE_EVENT, {
    cancelable: true,
    detail: { originalEvent: original, isContextMenu: isContextMenu(original) },
  });
  const target = original.target;
  // Dispatched on the pressed node so handlers read its target, as Kobalte's did.
  if (!target) handle(event);
  else {
    target.addEventListener(OUTSIDE_EVENT, () => handle(event), { once: true });
    target.dispatchEvent(event);
  }
  return event;
}

function inside(container: Element, node: Element | undefined): boolean {
  for (
    let n: Node | null | undefined = node;
    n;
    n = n instanceof ShadowRoot ? n.host : n.parentNode
  )
    if (n === container) return true;
  return false;
}

export function ModalFrame(props: ModalFrameProps): JSX.Element {
  const ctx = useDialogContext();
  const [local, rest] = splitProps(props, [
    "slot",
    "panelClass",
    "scrimClass",
    "panelStyle",
    "ariaLabel",
    "ref",
    "as",
    "mount",
    "exitMs",
    "onEscapeKeyDown",
    "onPointerDownOutside",
    "onInteractOutside",
    "onOpenAutoFocus",
    "onCloseAutoFocus",
    "children",
    "id",
  ]);
  const fallbackId = createUniqueId();
  const id = (): string => local.id ?? fallbackId;
  effect(id, ctx.registerContent);

  const presence = createPresence({
    present: ctx.isOpen,
    element: ctx.panel,
    exitMs: untrack(() => local.exitMs),
  });
  const expanded = () => presence.phase() === "opening" || presence.phase() === "open";

  const handle = registerLayer({
    element: ctx.panel,
    open: ctx.isOpen,
    kind: "modal",
    escape: () => true,
    dismiss: () => ctx.close(),
    trigger: ctx.triggerRef,
  });

  let closedByOutside = false;
  createDismiss({
    layer: handle,
    onDismiss: (reason, original) => {
      if (reason === "escape") {
        if (vetoed(local.onEscapeKeyDown, original as KeyboardEvent)) return;
      } else {
        const event = pointerDownOutside(original as PointerEvent, (e) => {
          local.onPointerDownOutside?.(e);
          local.onInteractOutside?.(e);
        });
        if (event.defaultPrevented) return;
        closedByOutside = true;
      }
      ctx.close();
      // A controlled `open` refused the close.
      if (untrack(ctx.isOpen)) closedByOutside = false;
    },
  });

  createHideOutside({ layer: handle, active: () => ctx.isOpen() && ctx.modal() });

  const [trapping, setTrapping] = createSignal(false);
  const scope = createFocusScope({
    container: ctx.panel,
    active: trapping,
    trapped: () => true,
    initialFocus: (container) => {
      if (!vetoed(local.onOpenAutoFocus, new Event("openautofocus", { cancelable: true })))
        return null;
      const active = (container.getRootNode() as Document | ShadowRoot).activeElement;
      return active instanceof HTMLElement && container.contains(active) ? active : container;
    },
  });

  effect(
    () => ctx.isOpen() && ctx.panel() !== undefined,
    (open) => {
      if (open) {
        closedByOutside = false;
        setTrapping(true);
        return;
      }
      const panel = ctx.panel();
      if (panel) {
        // Newest first: a list opened from inside goes before the one it came from.
        for (const layer of [...layerStack.layers()].reverse()) {
          if (inside(panel, layer.trigger()) || inside(panel, layer.element())) layer.dismiss?.();
        }
      }
      if (!trapping()) return;
      scope.untrap();
      const kept =
        vetoed(local.onCloseAutoFocus, new Event("closeautofocus", { cancelable: true })) ||
        (closedByOutside && !ctx.modal());
      const trigger = ctx.triggerRef();
      const toTrigger = !kept && trigger?.isConnected === true;
      if (kept || toTrigger) scope.skipRestore();
      setTrapping(false);
      if (toTrigger) queueMicrotask(() => focusWithoutTracking(trigger));
    },
  );

  return (
    <Show when={presence.mounted()}>
      {(_) => {
        onCleanup(() => ctx.setPanel(undefined));
        return (
          <Portal
            mount={local.mount}
            // A modal Kobalte layer underneath leaves body pointer-events: none behind.
            ref={(container: HTMLDivElement) => {
              container.style.pointerEvents = "auto";
            }}
          >
            <div
              data-slot={`${local.slot}-overlay`}
              class={local.scrimClass}
              data-expanded={expanded() ? "" : undefined}
              data-closed={expanded() ? undefined : ""}
              onPointerDown={(event) => {
                // Focus stays in the panel when the scrim is pressed.
                if (event.target === event.currentTarget) event.preventDefault();
              }}
            />
            <Polymorphic
              defaultAs="div"
              as={local.as}
              ref={(el: HTMLElement) => {
                ctx.setPanel(el);
                local.ref?.(el);
              }}
              id={id()}
              role={ctx.role}
              aria-modal={ctx.modal() ? "true" : undefined}
              tabIndex={-1}
              aria-labelledby={ctx.titleId()}
              aria-label={ctx.titleId() ? undefined : local.ariaLabel}
              aria-describedby={ctx.descriptionId()}
              data-slot={`${local.slot}-content`}
              data-expanded={expanded() ? "" : undefined}
              data-closed={expanded() ? undefined : ""}
              class={local.panelClass}
              style={local.panelStyle}
              {...rest}
            >
              {local.children}
            </Polymorphic>
          </Portal>
        );
      }}
    </Show>
  );
}
