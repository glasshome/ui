import {
  type Accessor,
  createContext,
  createRenderEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  Show,
  omit,
  untrack,
  useContext,
  createEffect,
  merge,
} from "solid-js";
import { useRequired } from "../context.js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import { LAYER_ROOT } from "../overlay-classes.js";
import { createControllableSignal } from "./controllable.js";
import { createDismiss } from "./dismiss.js";
import { focusedIn, createFocusScope, focusWithoutTracking } from "./focus-scope.js";
import { createHideOutside } from "./hide-outside.js";
import { layerStack, registerLayer } from "./layer-stack.js";
import { Polymorphic } from "./polymorphic.js";
import { Layer } from "./layer.js";
import { createPresence } from "./presence.js";
import { callEventHandler } from "./solid.js";

export type ModalRole = "dialog" | "alertdialog";

export interface ModalRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  keep?: boolean;
  role?: ModalRole;
  children?: JSX.Element;
}

export interface ModalContext {
  isOpen: Accessor<boolean>;
  close: () => void;
  toggle: () => void;
  modal: Accessor<boolean>;
  keep: Accessor<boolean>;
  dormant: Accessor<boolean>;
  bindDormant: (source: Accessor<boolean>) => void;
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

const ModalContextValue = createContext<ModalContext | null>(null);

export function useDialogContext(): ModalContext {
  const context = useRequired(ModalContextValue, "Dialog parts", "Dialog");
  return context;
}

/** Whether the modal around the caller is closed and kept; false outside one, so a ticker inside can pause. */
export function useDialogDormant(): Accessor<boolean> {
  return useContext(ModalContextValue)?.dormant ?? (() => false);
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
  // ModalFrame binds its presence from its own body.
  const [dormantSource, setDormantSource] = createSignal(
    { read: (): boolean => false },
    { ownedWrite: true },
  );
  const context: ModalContext = {
    isOpen,
    close: () => setOpen(false),
    toggle: () => setOpen(!untrack(isOpen)),
    modal: () => props.modal ?? true,
    keep: () => props.keep ?? false,
    dormant: () => dormantSource().read(),
    bindDormant: (source) => setDormantSource({ read: source }),
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
  return <ModalContextValue value={context}>{props.children}</ModalContextValue>;
}

export type ModalPartProps<T extends ValidComponent> = { as?: T } & Omit<ComponentProps<T>, "as">;

export function ModalTrigger<T extends ValidComponent = "button">(
  props: ModalPartProps<T>,
): JSX.Element {
  const ctx = useDialogContext();
  const rest = omit(props as ModalPartProps<ValidComponent>, "as", "ref", "onClick");
  let own: HTMLElement | undefined;
  onCleanup(() => {
    if (own && untrack(ctx.triggerRef) === own) ctx.setTriggerRef(undefined);
  });
  return (
    <Polymorphic
      {...merge(rest, {
        as: props.as,
        defaultAs: "button" as ValidComponent,
        ref: (el: HTMLElement) => {
          own = el;
          ctx.setTriggerRef(el);
          if (typeof props.ref === "function") props.ref(el);
        },
        "aria-haspopup": "dialog",
        get "aria-expanded"() {
          return ctx.isOpen() ? "true" : "false";
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
            props.onClick as JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined,
          );
          ctx.toggle();
        },
      })}
    />
  );
}

function createLabelPart(defaultAs: ValidComponent, register: (id: string) => () => void) {
  return (props: ModalPartProps<ValidComponent>): JSX.Element => {
    const rest = omit(props, "as", "id");
    const fallback = createUniqueId();
    const id = (): string => props.id || fallback;
    createEffect(id, register);
    return (
      <Polymorphic
        {...merge(rest, {
          as: props.as,
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
  "ref" | "style" | "role" | "class" | "slot"
> {
  slot: string;
  panelClass: string;
  scrimClass: string;
  panelStyle?: JSX.CSSProperties;
  ariaLabel?: string;
  ref?: (el: HTMLElement) => void;
  as?: ValidComponent;
  mount?: Element;
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

export function vetoed<E extends Event>(
  handler: ((event: E) => void) | undefined,
  event: E,
): boolean {
  handler?.(event);
  return event.defaultPrevented;
}

const onMac = (): boolean => typeof navigator !== "undefined" && /^Mac/i.test(navigator.platform);

function isContextMenu(event: PointerEvent): boolean {
  const ctrl = onMac() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  return event.button === 2 || (ctrl && event.button === 0);
}

const OUTSIDE_EVENT = "interactoutside";

export function interactOutside<T extends PointerEvent | FocusEvent>(
  original: T,
  handle: (event: CustomEvent<OutsideDetail<T>>) => void,
): CustomEvent<OutsideDetail<T>> {
  const event = new CustomEvent<OutsideDetail<T>>(OUTSIDE_EVENT, {
    cancelable: true,
    detail: {
      originalEvent: original,
      isContextMenu: original.type === "pointerdown" && isContextMenu(original as PointerEvent),
    },
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

// Skipped content stops ticking: an exit the timeout ended early would freeze mid-way, not at rest.
function finishMotion(root: Element): void {
  for (const animation of root.getAnimations?.({ subtree: true }) ?? []) {
    if (animation.playState !== "running") continue;
    if (animation.effect?.getComputedTiming().iterations === Infinity) continue;
    animation.finish();
  }
}

export function ModalFrame(props: ModalFrameProps): JSX.Element {
  const ctx = useDialogContext();
  const rest = omit(
    props,
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
  );
  const fallbackId = createUniqueId();
  const id = (): string => props.id || fallbackId;
  createEffect(id, ctx.registerContent);

  const presence = createPresence({
    present: ctx.isOpen,
    element: ctx.panel,
    get exitMs() {
      return props.exitMs;
    },
    keep: ctx.keep,
  });
  ctx.bindDormant(presence.dormant);
  onCleanup(() => ctx.bindDormant(() => false));
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
    escapeFrom: "document",
    onDismiss: (reason, original) => {
      if (reason === "escape") {
        if (vetoed(props.onEscapeKeyDown, original as KeyboardEvent)) return;
      } else {
        const event = interactOutside(original as PointerEvent, (e) => {
          props.onPointerDownOutside?.(e);
          if (ctx.modal() && e.detail.isContextMenu) e.preventDefault();
          props.onInteractOutside?.(e);
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
      if (!vetoed(props.onOpenAutoFocus, new Event("openautofocus", { cancelable: true })))
        return null;
      const active = focusedIn(container);
      return active instanceof HTMLElement && container.contains(active) ? active : container;
    },
  });

  createEffect(
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
        vetoed(props.onCloseAutoFocus, new Event("closeautofocus", { cancelable: true })) ||
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
        const [container, setContainer] = createSignal<HTMLDivElement>();
        createRenderEffect(
          () => [container(), presence.dormant()] as const,
          ([el, dormant]) => {
            if (!el) return;
            if (dormant) finishMotion(el);
            el.toggleAttribute("data-dormant", dormant);
          },
        );
        return (
          <Layer mount={props.mount} class={LAYER_ROOT} ref={setContainer}>
            <div
              data-slot={`${props.slot}-overlay`}
              class={props.scrimClass}
              data-expanded={expanded() ? "" : undefined}
              data-closed={expanded() ? undefined : ""}
              data-claim="prevent:pointerdown"
              onPointerDown={(event) => {
                // Focus stays in the panel when the scrim is pressed.
                if (event.target === event.currentTarget) event.preventDefault();
              }}
            />
            <Polymorphic
              defaultAs="div"
              as={props.as}
              ref={(el: HTMLElement) => {
                ctx.setPanel(el);
                props.ref?.(el);
              }}
              id={id()}
              role={presence.dormant() ? undefined : ctx.role}
              aria-modal={ctx.modal() && !presence.dormant() ? "true" : undefined}
              tabIndex={-1}
              aria-labelledby={ctx.titleId()}
              aria-label={ctx.titleId() ? undefined : props.ariaLabel}
              aria-describedby={ctx.descriptionId()}
              data-slot={`${props.slot}-content`}
              data-expanded={expanded() ? "" : undefined}
              data-closed={expanded() ? undefined : ""}
              class={props.panelClass}
              style={props.panelStyle}
              {...rest}
            >
              {props.children}
            </Polymorphic>
          </Layer>
        );
      }}
    </Show>
  );
}
