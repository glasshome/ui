import { Button as KobalteButton } from "@kobalte/core/button";
import {
  type Accessor,
  children,
  type Component,
  type ComponentProps,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import {
  ModalDescription,
  type ModalPartProps,
  type ModalRole,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from "../lib/behavior/modal-root.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { callEventHandler } from "../lib/behavior/solid.js";
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

export function createModalRootSkin(role: ModalRole): ParentComponent<ModalRootSkinProps> {
  return (props) => {
    const mount = usePortalMount();
    return (
      <ModalRoot
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        modal={props.modal ?? !inShadowRoot(mount)}
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
  onPointerDownOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  /** @deprecated No effect; focus never leaves an open dialog. */
  onFocusOutside?: (event: Event) => void;
  /** @deprecated No effect; the panel stays mounted through its exit on its own. */
  forceMount?: boolean;
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
      const [local, rest] = splitProps(props as ModalPartProps<"h2">, ["class"]);
      return (
        <ModalTitle data-slot={`${slot}-title`} class={cn(MODAL_TITLE, local.class)} {...rest} />
      );
    },
    Description: (props) => {
      const [local, rest] = splitProps(props as ModalPartProps<"p">, ["class"]);
      return (
        <ModalDescription
          data-slot={`${slot}-description`}
          class={cn(MODAL_DESCRIPTION, local.class)}
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
  "gh-scroll gh-stagger flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain [touch-action:pan-y_pinch-zoom] [scrollbar-gutter:stable] pl-6 pr-[calc(var(--spacing)*6-var(--scrollbar-gutter,var(--scrollbar-w)))] pt-6 pb-6 [[data-slot$='-header']~&]:pt-3 [&:has(~[data-slot$='-footer'])]:pb-3 in-data-[slot=bottom-sheet-content]:pl-4 in-data-[slot=bottom-sheet-content]:pr-[calc(var(--spacing)*4-var(--scrollbar-gutter,var(--scrollbar-w)))] [[data-slot=bottom-sheet-handle]+&]:pt-1";

const MODAL_FOOTER =
  "gh-stagger flex shrink-0 flex-col-reverse gap-2 px-6 pt-3 pb-6 sm:flex-row sm:justify-end in-data-[slot=bottom-sheet-content]:px-4";

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
    const [local, rest] = splitProps(props, ["class", "media", "action", "wrap", "children"]);
    const media = children(() => local.media);
    const action = children(() => local.action);
    return (
      <div
        data-slot={`${slot}-header`}
        class={cn(MODAL_HEADER, local.wrap && "flex-wrap", local.class)}
        {...rest}
      >
        <Show when={media()}>
          <div data-slot={`${slot}-header-media`} class={MODAL_HEADER_MEDIA}>
            {media()}
          </div>
        </Show>
        <div data-slot={`${slot}-header-text`} class={MODAL_HEADER_TEXT}>
          {local.children}
        </div>
        <Show when={action()}>
          <div data-slot={`${slot}-header-action`} class={MODAL_HEADER_ACTION}>
            {action()}
          </div>
        </Show>
      </div>
    );
  };

  /* data-sheet-scroll is the bottom sheet's drag arbitration marker: a Body
   * inside a sheet must yield the gesture to its own scroll, whichever family
   * rendered it. */
  const Body: Component<ModalBodyProps> = (props) => {
    const [local, rest] = splitProps(props, ["class", "as", "ref"]);
    let el: HTMLElement | undefined;
    // Overlay scrollbars reserve no gutter, so the right inset subtracts what the platform actually reserved.
    onMount(() => {
      if (el) el.style.setProperty("--scrollbar-gutter", `${el.offsetWidth - el.clientWidth}px`);
    });
    return (
      <Polymorphic
        defaultAs="div"
        as={local.as}
        ref={(node: HTMLElement) => {
          el = node;
          if (typeof local.ref === "function") local.ref(node as HTMLDivElement);
        }}
        data-slot={`${slot}-body`}
        data-sheet-scroll=""
        class={cn(MODAL_BODY, local.class)}
        {...rest}
      />
    );
  };

  const Footer: Component<ComponentProps<"div">> = (props) => {
    const [local, rest] = splitProps(props, ["class"]);
    return <div data-slot={`${slot}-footer`} class={cn(MODAL_FOOTER, local.class)} {...rest} />;
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

export type ModalDismissProps = ComponentProps<typeof KobalteButton> & {
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
    const [local, rest] = splitProps(props, ["onClick", "busy"]);
    const context = useCloser();
    return (
      <KobalteButton
        data-slot={slot}
        onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
          callEventHandler(event, local.onClick);
          context.close();
        }}
        {...rest}
        {...(local.busy ? busyProps : undefined)}
      />
    );
  };
}

/** Renderless, inside the modal's portal: the panel covers the page from the end of its open animation until the portal leaves. */
export const ModalCover: Component<{
  panel: Accessor<Element | undefined>;
  open: Accessor<boolean>;
}> = (props) => {
  createEffect(() => {
    const panel = props.panel();
    if (panel) onCleanup(coverOnceOpen(panel, props.open));
  });
  return null;
};

export interface ModalLabels {
  titleId: string;
  descriptionId: string;
  labelledBy: Accessor<string | undefined>;
  describedBy: Accessor<string | undefined>;
  registerTitle: (id: string | undefined) => void;
  registerDescription: (id: string | undefined) => void;
}

const ModalLabelsContext = createContext<ModalLabels>();

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
    onCleanup(() => set(undefined));
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

export const ModalLabelsProvider = ModalLabelsContext.Provider;

export function useModalLabels(): ModalLabels | undefined {
  return useContext(ModalLabelsContext);
}
