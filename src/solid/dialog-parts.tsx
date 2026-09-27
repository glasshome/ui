import { Button as KobalteButton } from "@kobalte/core/button";
import { useDialogContext } from "@kobalte/core/dialog";
import {
	type Accessor,
	type Component,
	type ComponentProps,
	createContext,
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
import { Dynamic } from "solid-js/web";
import { Z_CLASS } from "../lib/layers.js";
import { ANCHORED_MOTION, MODAL_MOTION, SCRIM_MOTION } from "../lib/motion-classes.js";
import { OVERLAY_SURFACE, SCRIM_CLASS } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { acquireScrollLock, releaseScrollLock } from "./bottom-sheet/scroll-lock.js";

/* kobalte 0.13.13 builds AlertDialog with Object.assign(DialogRoot, ...), the
 * same object Dialog is built from, so whichever of the two modules a bundle
 * evaluates last owns .Content for both. Every family therefore states its own
 * role instead of trusting the primitive's default. */

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
export const MODAL_PANEL = `${OVERLAY_SURFACE} ${MODAL_MOTION} fixed left-1/2 flex ${MODAL_MAX_H} w-[calc(100%-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-lg outline-none ${Z_CLASS.overlay}`;

/* A panel anchored on the element that opened it: placed and sized inline (lib/anchor-placement),
 * so it drops the centring, and it unrolls out of that element instead of rising in. */
export const ANCHORED_PANEL = `${OVERLAY_SURFACE} ${ANCHORED_MOTION} fixed flex ${MODAL_MAX_H} flex-col overflow-hidden rounded-lg outline-none ${Z_CLASS.overlay}`;

export const MODAL_SCRIM = `${SCRIM_MOTION} fixed inset-0 ${Z_CLASS.overlay} ${SCRIM_CLASS}`;

const MODAL_HEADER = "flex shrink-0 items-start gap-4 px-6 pt-6 pb-3";
const MODAL_HEADER_MEDIA = "flex shrink-0 items-center";
/* `grow`, not `flex-1`: a zero basis would make the text column shrink to a
 * word per line beside a wide action instead of pushing it onto the next line
 * when the Header wraps. */
const MODAL_HEADER_TEXT = "flex min-w-0 grow flex-col gap-1.5 text-left";
const MODAL_HEADER_ACTION = "flex shrink-0 items-center gap-2";

/* The only scroll container.
 * - The inset is the full one and a Header or Footer sibling shortens it, keyed
 *   on data-slot rather than on position: kobalte parks a focus-trap <span> at
 *   each end of the panel, and Sheet's `above` and the sheet handle add more
 *   element siblings, so `first:`/`first-of-type:` all lie.
 * - `pan-y pinch-zoom` leaves the single-finger vertical gesture to the sheet's
 *   drag arbitration without taking two-finger zoom away.
 * - The reserved scrollbar lives inside the right inset, so the content column
 *   ends where the Header's and Footer's do. */
const MODAL_BODY =
	"gh-scroll gh-stagger flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain [touch-action:pan-y_pinch-zoom] [scrollbar-gutter:stable] pl-6 pr-[calc(var(--spacing)*6-var(--scrollbar-w))] pt-6 pb-6 [[data-slot$='-header']~&]:pt-3 [&:has(~[data-slot$='-footer'])]:pb-3";

const MODAL_FOOTER =
	"gh-stagger flex shrink-0 flex-col-reverse gap-2 px-6 pt-3 pb-6 sm:flex-row sm:justify-end";

export const MODAL_TITLE = "font-semibold text-foreground text-lg leading-none tracking-tight";
export const MODAL_DESCRIPTION = "text-muted-foreground text-sm";

type ModalHeaderProps = ComponentProps<"div"> & {
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
		return (
			<div
				data-slot={`${slot}-header`}
				class={cn(MODAL_HEADER, local.wrap && "flex-wrap", local.class)}
				{...rest}
			>
				<Show when={local.media}>
					<div data-slot={`${slot}-header-media`} class={MODAL_HEADER_MEDIA}>
						{local.media}
					</div>
				</Show>
				<div data-slot={`${slot}-header-text`} class={MODAL_HEADER_TEXT}>
					{local.children}
				</div>
				<Show when={local.action}>
					<div data-slot={`${slot}-header-action`} class={MODAL_HEADER_ACTION}>
						{local.action}
					</div>
				</Show>
			</div>
		);
	};

	/* data-sheet-scroll is the bottom sheet's drag arbitration marker: a Body
	 * inside a sheet must yield the gesture to its own scroll, whichever family
	 * rendered it. */
	const Body: Component<ModalBodyProps> = (props) => {
		const [local, rest] = splitProps(props, ["class", "as"]);
		return (
			<Dynamic
				component={local.as ?? "div"}
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

/** Solid's handler prop is a union: a plain function, or the bound
 *  `[handler, data]` form that calls `handler(data, event)`. A wrapper that
 *  only checks for a function silently drops the bound one. */
export function callEventHandler<T, E extends Event>(
	event: E & { currentTarget: T; target: Element },
	handler: JSX.EventHandlerUnion<T, E> | undefined,
): void {
	if (!handler) return;
	if (typeof handler === "function") handler(event);
	else handler[0](handler[1], event);
}

export type ModalDismissProps = ComponentProps<typeof KobalteButton>;

/* Not kobalte's own CloseButton: that one hard-defaults aria-label to its
 * "Dismiss" translation, and an aria-label outranks the visible text, so every
 * labelled button in every modal answered to "Dismiss". Here a name is set only
 * when the caller passes one. AlertDialog is built on the Dialog context, so
 * one factory serves both families. */
export function createModalDismiss(slot: string): ParentComponent<ModalDismissProps> {
	return (props) => {
		const [local, rest] = splitProps(props, ["onClick"]);
		const context = useDialogContext();
		return (
			<KobalteButton
				data-slot={slot}
				onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
					callEventHandler(event, local.onClick);
					context.close();
				}}
				{...rest}
			/>
		);
	};
}

/** Renderless. Mounted inside a portal that exists only while the modal is
 *  open, so the refcounted page lock follows the modal's real lifetime. */
export const ModalScrollLock: Component = () => {
	onMount(acquireScrollLock);
	onCleanup(releaseScrollLock);
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

/** Kobalte wires title/description ids for its own families; the hand-rolled
 *  surfaces (BottomSheet) wire them through this. The part registers the id it
 *  actually rendered, so a caller's own `id` still labels the panel. */
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
