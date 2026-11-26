import { ButtonRoot, type ButtonRootProps } from "../lib/behavior/button-root.js";
import {
  type Accessor,
  children,
  type Component,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onSettled,
  type ParentComponent,
  Show,
  omit,
  useContext,
} from "solid-js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import {
  type InteractOutsideEvent,
  ModalDescription,
  type ModalPartProps,
  type PointerDownOutsideEvent,
  type ModalRole,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from "../lib/behavior/modal-root.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { callEventHandler, forwardRef } from "../lib/behavior/solid.js";
import { busyProps } from "../lib/busy.js";
import { Z_CLASS } from "../lib/layers.js";
import { ANCHORED_MOTION, MODAL_MOTION, SCRIM_MOTION } from "../lib/motion-classes.js";
import {
  OVERLAY_SURFACE,
  SCRIM_CLASS,
  SCRIM_CONTAIN,
  SCROLL_CONTAIN,
} from "../lib/overlay-classes.js";
import { coverOnceOpen } from "../lib/page-cover.js";
import { inShadowRoot } from "../lib/shadow-layer.js";
import { cn } from "../lib/utils.js";
import { usePortalMount } from "./portal-mount.js";
import { SectionIcon } from "./section-card.js";

export interface ModalRootSkinProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Modal toward the page. Defaults to true on the page and false inside a shadow root. */
  modal?: boolean;
  /** Stays mounted and dormant after it closes, so the next open shows the same nodes instead of building them. */
  keep?: boolean;
  children?: JSX.Element;
}

export function createModalRootSkin(role: ModalRole): ParentComponent<ModalRootSkinProps> {
  return (props) => {
    const mount = usePortalMount();
    return (
      <ModalRoot
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        modal={props.modal ?? !inShadowRoot(mount)}
        keep={props.keep}
        role={role}
      >
        {props.children}
      </ModalRoot>
    );
  };
}

export type ModalContentProps = Omit<ComponentProps<"div">, "style" | "role"> & {
  as?: ValidComponent;
  style?: JSX.CSSProperties | string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onInteractOutside?: (event: InteractOutsideEvent) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export interface ModalTextParts {
  Trigger: <T extends ValidComponent = "button">(props: ModalPartProps<T>) => JSX.Element;
  Title: <T extends ValidComponent = "h2">(props: ModalPartProps<T>) => JSX.Element;
  Description: <T extends ValidComponent = "p">(props: ModalPartProps<T>) => JSX.Element;
}

export function createModalTextParts(slot: string): ModalTextParts {
  return {
    Trigger: (props) => (
      <ModalTrigger data-slot={`${slot}-trigger`} {...(props as ModalPartProps<"button">)} />
    ),
    Title: (props) => {
      const rest = omit(props as ModalPartProps<"h2">, "class");
      return (
        <ModalTitle data-slot={`${slot}-title`} class={cn(MODAL_TITLE, props.class)} {...rest} />
      );
    },
    Description: (props) => {
      const rest = omit(props as ModalPartProps<"p">, "class");
      return (
        <ModalDescription
          data-slot={`${slot}-description`}
          class={cn(MODAL_DESCRIPTION, props.class)}
          {...rest}
        />
      );
    },
  };
}

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/* The height cap every modal panel shares. Declared and consumed in one string,
 * so the sheet's keyboard rule in theme.css subtracts from the same length. */
export const MODAL_MAX_H = "[--modal-max-h:85dvh] max-h-[var(--modal-max-h)]";

export const MODAL_WIDTH: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
  full: "max-w-5xl",
};

/* Where the panel sits. Up to lg it centres; xl and full (the workbench
 * dialogs: tabs, steps, editors) hang from the line a full-height panel would
 * start on, so a body that changes height grows downward instead of
 * re-centring and jumping. */
const MODAL_CENTER = "top-1/2 -translate-y-1/2";
const MODAL_HANG = "top-[calc((100dvh-var(--modal-max-h))/2)] translate-y-0";
export const MODAL_ANCHOR: Record<ModalSize, string> = {
  sm: MODAL_CENTER,
  md: MODAL_CENTER,
  lg: MODAL_CENTER,
  xl: MODAL_HANG,
  full: MODAL_HANG,
};

/* The panel: it clips, it never scrolls, and it carries no padding. Every inset
 * belongs to Header, Body or Footer, so the Body scrollbar rides inside the
 * panel edge instead of under the header. */
export const MODAL_PANEL = `${OVERLAY_SURFACE} ${MODAL_MOTION} fixed left-1/2 flex ${MODAL_MAX_H} w-[calc(100%-2rem)] -translate-x-1/2 flex-col overflow-hidden ${SCROLL_CONTAIN} rounded-lg outline-none ${Z_CLASS.overlay}`;

/* A panel anchored on the element that opened it: placed and sized inline (lib/anchor-placement),
 * so it drops the centring, and it unrolls out of that element instead of rising in. */
export const ANCHORED_PANEL = `${OVERLAY_SURFACE} ${ANCHORED_MOTION} fixed flex ${MODAL_MAX_H} flex-col overflow-hidden ${SCROLL_CONTAIN} rounded-lg outline-none ${Z_CLASS.overlay}`;

export const MODAL_SCRIM = `${SCRIM_MOTION} fixed inset-0 ${Z_CLASS.overlay} ${SCRIM_CLASS} ${SCRIM_CONTAIN}`;

const MODAL_HEADER =
  "flex shrink-0 items-start gap-4 px-6 pt-6 pb-3 in-data-[slot=bottom-sheet-content]:px-4 [[data-slot=bottom-sheet-handle]+&]:pt-1";
const MODAL_HEADER_MEDIA = "flex shrink-0 items-center";
/* `grow`, not `flex-1`: a zero basis would make the text column shrink to a
 * word per line beside a wide action instead of pushing it onto the next line
 * when the Header wraps. */
const MODAL_HEADER_TEXT = "flex min-w-0 grow flex-col gap-1.5 text-left";
const MODAL_HEADER_ACTION = "flex shrink-0 items-center gap-2";

/* The only scroll container.
 * - The inset is the full one and a Header or Footer sibling shortens it, keyed
 *   on data-slot rather than on position: Sheet's `above` and the sheet handle
 *   add element siblings, so `first:`/`first-of-type:` lie.
 * - `pan-y pinch-zoom` leaves the single-finger vertical gesture to the sheet's
 *   drag arbitration without taking two-finger zoom away.
 * - The reserved scrollbar lives inside the right inset, so the content column
 *   ends where the Header's and Footer's do. */
const MODAL_BODY =
  "gh-scroll relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain [touch-action:pan-y_pinch-zoom] [scrollbar-gutter:stable] pl-6 pr-[calc(var(--spacing)*6-var(--scrollbar-gutter,var(--scrollbar-w)))] pt-6 pb-6 [[data-slot$='-header']~&]:pt-3 [&:has(~[data-slot$='-footer'])]:pb-3 in-data-[slot=bottom-sheet-content]:pl-4 in-data-[slot=bottom-sheet-content]:pr-[calc(var(--spacing)*4-var(--scrollbar-gutter,var(--scrollbar-w)))] [[data-slot=bottom-sheet-handle]+&]:pt-1";

// Out of flow, so content keeps its gap and its first child; it marks where the scroll starts.
const MODAL_BODY_TOP = "pointer-events-none absolute inset-x-0 top-0 h-px";

const MODAL_FOOTER =
  "flex shrink-0 flex-col-reverse gap-2 px-6 pt-3 pb-6 sm:flex-row sm:justify-end in-data-[slot=bottom-sheet-content]:px-4";

export const MODAL_TITLE = "font-semibold text-foreground text-lg leading-none tracking-tight";
export const MODAL_DESCRIPTION = "text-muted-foreground text-sm";

export type ModalHeaderProps = ComponentProps<"div"> & {
  /** Avatar or icon, rendered ahead of the title column. */
  media?: JSX.Element;
  action?: JSX.Element;
  /** Lets a wide action (a tab row) drop below the title instead of squeezing
   *  it; a phone has no room for both on one line. */
  wrap?: boolean;
};

/** `as="form"` makes the scroll container the form, so a footer submit button
 *  reaches it through `form="<id>"` with no wrapper in between. */
type ModalBodyProps = ComponentProps<"div"> & { as?: ValidComponent };

export interface ModalParts {
  Header: Component<ModalHeaderProps>;
  Body: Component<ModalBodyProps>;
  Footer: Component<ComponentProps<"div">>;
}

export function createModalParts(slot: string): ModalParts {
  const Header: Component<ModalHeaderProps> = (props) => {
    const rest = omit(props, "class", "media", "action", "wrap", "children");
    const media = children(() => props.media);
    const action = children(() => props.action);
    return (
      <div
        data-slot={`${slot}-header`}
        class={cn(MODAL_HEADER, props.wrap && "flex-wrap", props.class)}
        {...rest}
      >
        <Show when={media()}>
          <div data-slot={`${slot}-header-media`} class={MODAL_HEADER_MEDIA}>
            {media()}
          </div>
        </Show>
        <div data-slot={`${slot}-header-text`} class={MODAL_HEADER_TEXT}>
          {props.children}
        </div>
        <Show when={action()}>
          <div data-slot={`${slot}-header-action`} class={MODAL_HEADER_ACTION}>
            {action()}
          </div>
        </Show>
      </div>
    );
  };

  const Body: Component<ModalBodyProps> = (props) => {
    const rest = omit(props, "class", "as", "ref", "children");
    let el: HTMLElement | undefined;
    let top: HTMLSpanElement | undefined;
    // Overlay scrollbars reserve no gutter, so the right inset subtracts what the platform actually reserved.
    onSettled(() => {
      if (el) el.style.setProperty("--scrollbar-gutter", `${el.offsetWidth - el.clientWidth}px`);
    });
    // data-scrolled comes from an observer, since a sealed widget cannot read scrollTop; made on the first scroll, as an observer costs a call to the page.
    let observer: IntersectionObserver | undefined;
    const watchTop = () => {
      const box = el;
      if (!box || !top || observer) return;
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (entry) box.toggleAttribute("data-scrolled", entry.intersectionRatio < 0.99);
        },
        { root: box, threshold: [0.99] },
      );
      observer.observe(top);
    };
    onSettled(() => el?.addEventListener("scroll", watchTop, { once: true, passive: true }));
    onCleanup(() => {
      el?.removeEventListener("scroll", watchTop);
      observer?.disconnect();
    });
    return (
      <Polymorphic
        defaultAs="div"
        as={props.as}
        ref={(node: HTMLElement) => {
          el = node;
          forwardRef(() => props.ref, node);
        }}
        data-slot={`${slot}-body`}
        class={cn(MODAL_BODY, props.class)}
        {...rest}
      >
        <span ref={top} aria-hidden="true" class={MODAL_BODY_TOP} />
        {props.children}
      </Polymorphic>
    );
  };

  const Footer: Component<ComponentProps<"div">> = (props) => {
    const rest = omit(props, "class");
    return <div data-slot={`${slot}-footer`} class={cn(MODAL_FOOTER, props.class)} {...rest} />;
  };

  return { Header, Body, Footer };
}

export type ModalMedia =
  | { icon: string; tone?: string; avatar?: never }
  | { avatar: JSX.Element; icon?: never; tone?: never };

export type ModalHeadProps = ModalMedia & {
  /** A few words: the outcome or the question. */
  title: string;
  /** One line under the title; a `Term` goes here. */
  line?: JSX.Element;
  /** Badges after the title. */
  status?: JSX.Element;
  /** The title is a key or an id: mono, breaks anywhere. */
  mono?: boolean;
  /** A step indicator, tabs, a close or a link; the work's buttons live in the Footer. */
  action?: JSX.Element;
  wrap?: boolean;
};

/** The header door: media, a title and one line, no free children. A family
 *  hands in its own Header, Title and Description so ResponsiveDialog still
 *  switches between dialog and sheet parts at render time. */
export function createModalHead<P extends ModalHeadProps = ModalHeadProps>(
  Header: Component<ModalHeaderProps>,
  Title: Component<ComponentProps<"h2">>,
  Description: Component<ComponentProps<"p">>,
): Component<P> {
  return (props) => {
    const line = children(() => props.line);
    const status = children(() => props.status);
    return (
      <Header
        wrap={props.wrap}
        action={props.action}
        media={props.avatar ?? <SectionIcon icon={props.icon} tone={props.tone} size="md" />}
      >
        <Title
          class={cn(status() && "flex items-center gap-2", props.mono && "font-mono break-all")}
        >
          {props.title}
          {status()}
        </Title>
        <Show when={line()}>
          <Description>{line()}</Description>
        </Show>
      </Header>
    );
  };
}

export type ModalDismissProps = ButtonRootProps<ValidComponent> & {
  /** Presses do nothing, the dialog stays open and focus stays put; see Button. */
  busy?: boolean;
};

/* A name is set only when the caller passes one: an aria-label outranks the
 * visible text, so a default label would rename every close button. Each
 * family hands in the context its parts close through. */
export function createModalDismiss(
  slot: string,
  useCloser: () => { close(): void },
): ParentComponent<ModalDismissProps> {
  return (props) => {
    const rest = omit(props, "onClick", "busy");
    const context = useCloser();
    return (
      <ButtonRoot
        data-slot={slot}
        onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
          callEventHandler(event, props.onClick);
          context.close();
        }}
        {...rest}
        {...(props.busy ? busyProps : undefined)}
      />
    );
  };
}

/** Renderless, inside the modal's portal: the panel covers the page from the end of its open animation until the portal leaves. */
export const ModalCover: Component<{
  panel: Accessor<Element | undefined>;
  open: Accessor<boolean>;
  dormant: Accessor<boolean>;
}> = (props) => {
  createEffect(
    () => (props.dormant() ? undefined : props.panel()),
    (panel) => (panel ? coverOnceOpen(panel, props.open) : undefined),
  );
  return null;
};

export interface ModalLabels {
  titleId: string;
  descriptionId: string;
  labelledBy: Accessor<string | undefined>;
  describedBy: Accessor<string | undefined>;
  registerTitle: (id: string | undefined) => () => void;
  registerDescription: (id: string | undefined) => () => void;
}

const ModalLabelsContext = createContext<ModalLabels | null>(null);

/** ModalRoot wires title/description ids for its families; BottomSheet wires
 *  them through this. The part registers the id it actually rendered, so a
 *  caller's own `id` still labels the panel. */
export function createModalLabels(): ModalLabels {
  const titleId = createUniqueId();
  const descriptionId = createUniqueId();
  const [labelledBy, setLabelledBy] = createSignal<string>();
  const [describedBy, setDescribedBy] = createSignal<string>();
  const register = (set: (id: string | undefined) => void, id: string | undefined) => {
    set(id);
    return () => set(undefined);
  };
  return {
    titleId,
    descriptionId,
    labelledBy,
    describedBy,
    registerTitle: (id) => register(setLabelledBy, id),
    registerDescription: (id) => register(setDescribedBy, id),
  };
}

export const ModalLabelsProvider = ModalLabelsContext;

export function useModalLabels(): ModalLabels | undefined {
  return useContext(ModalLabelsContext) ?? undefined;
}
