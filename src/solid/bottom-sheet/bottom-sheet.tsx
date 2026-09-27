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
import { Dynamic, Portal } from "solid-js/web";
import { Z } from "../../lib/layers.js";
import { OVERLAY_SURFACE_OPAQUE } from "../../lib/overlay-classes.js";
import { cn } from "../../lib/utils.js";
import {
	callEventHandler,
	createModalLabels,
	createModalParts,
	MODAL_DESCRIPTION,
	MODAL_MAX_H,
	MODAL_TITLE,
	ModalLabelsProvider,
	useModalLabels,
} from "../dialog-parts.js";
import { EASE, TRANSITION_MS } from "./constants.js";
import { attachDrag } from "./drag-controller.js";
import { type InitialFocus, trapFocus } from "./focus-trap.js";
import { watchKeyboard } from "./keyboard.js";
import { acquireScrollLock, releaseScrollLock } from "./scroll-lock.js";
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
	const [uncontrolled, setUncontrolled] = createSignal(props.defaultOpen ?? false);
	const [state, setStateRaw] = createSignal<SheetState>("closed");
	const [contentRef, setContentRef] = createSignal<HTMLDivElement | undefined>(undefined);

	const isControlled = () => props.open !== undefined;
	const open = (): boolean => (isControlled() ? props.open === true : uncontrolled());

	const setOpen = (next: boolean) => {
		if (!isControlled()) setUncontrolled(next);
		props.onOpenChange?.(next);
	};

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
	const component = () => local.as ?? "button";
	return (
		<Dynamic
			component={component()}
			type={component() === "button" ? "button" : undefined}
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
		</Dynamic>
	);
};

interface BottomSheetPortalProps {
	children: JSX.Element;
	mount?: Node;
}

const BottomSheetPortal: Component<BottomSheetPortalProps> = (props) => {
	const ctx = useBottomSheetContext();
	const mounted = () => ctx.state() !== "closed";
	return (
		<Show when={mounted()}>
			<Portal mount={props.mount}>{props.children}</Portal>
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
				"fixed inset-0 bg-black/80 transition-opacity duration-300 ease-out",
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

	/* Keyed on presence, not on mount: a sheet rendered without
	 * BottomSheetPortal stays in the tree while closed and must not hold the
	 * page lock. Release also runs on unmount, so no animation can strand it. */
	const present = createMemo(() => ctx.state() !== "closed");
	createEffect(() => {
		if (!present()) return;
		acquireScrollLock();
		onCleanup(releaseScrollLock);
	});

	const clearAnimInline = () => {
		if (!el) return;
		el.style.transition = "";
		el.style.animation = "";
		el.style.transform = "";
	};

	const onAnimationEnd = (e: AnimationEvent) => {
		if (e.target !== el) return;
		const s = ctx.state();
		if (s === "opening" && e.animationName === "bs-slide-up") ctx.setState("open");
		else if (s === "closing" && e.animationName === "bs-slide-down") ctx.setState("closed");
	};

	const onTransitionEnd = (e: TransitionEvent) => {
		if (e.target !== el) return;
		if (e.propertyName !== "transform") return;
		const s = ctx.state();
		if (s === "snapping") {
			ctx.setState("open");
			clearAnimInline();
		} else if (s === "closing") {
			ctx.setState("closed");
			clearAnimInline();
		}
	};

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
		if (ctx.state() === "closed") return;
		const handle = watchKeyboard(node);
		onCleanup(() => handle.destroy());
	});

	createEffect(() => {
		const s = ctx.state();
		if (s !== "open" && s !== "opening") return;
		if (!el) return;
		const handle = trapFocus(el, local.initialFocus ?? "container");
		onCleanup(() => handle.release());
	});

	createEffect(() => {
		if (ctx.state() === "closed") return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			if (!ctx.dismissible()) return;
			e.preventDefault();
			ctx.setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		onCleanup(() => document.removeEventListener("keydown", onKey));
	});

	// setTimeout(0) lets the click that opened the sheet finish bubbling
	// before the dismiss listener is attached. Touch defers to `click` so
	// drag/scroll intent can be detected first.
	createEffect(() => {
		if (ctx.state() === "closed") return;
		if (!ctx.dismissible()) return;

		let attached = false;
		let pendingClick: ((e: MouseEvent) => void) | null = null;

		const PORTAL_LAYER_SELECTOR =
			'[data-kb-top-layer], [role="dialog"], [role="menu"], [role="listbox"], [role="combobox"], [role="tooltip"]';
		const isOutside = (target: EventTarget | null): boolean => {
			if (!(target instanceof Element) || !el) return false;
			if (el.contains(target)) return false;
			if (target.closest("[data-sheet-content]")) return false;
			if (target.closest(PORTAL_LAYER_SELECTOR)) return false;
			return true;
		};

		const onPointerDown = (e: PointerEvent) => {
			if (!isOutside(e.target)) return;
			const dismiss = () => {
				if (ctx.state() === "open") ctx.setOpen(false);
			};
			if (e.pointerType === "touch") {
				if (pendingClick) document.removeEventListener("click", pendingClick);
				pendingClick = () => {
					dismiss();
					pendingClick = null;
				};
				document.addEventListener("click", pendingClick, { once: true });
			} else {
				dismiss();
			}
		};

		const timer = window.setTimeout(() => {
			document.addEventListener("pointerdown", onPointerDown, true);
			attached = true;
		}, 0);

		onCleanup(() => {
			window.clearTimeout(timer);
			if (attached) document.removeEventListener("pointerdown", onPointerDown, true);
			if (pendingClick) document.removeEventListener("click", pendingClick);
		});
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
				onAnimationEnd={onAnimationEnd}
				onTransitionEnd={onTransitionEnd}
				style={{
					...(typeof local.style === "object" ? local.style : {}),
					"z-index": Z.sheet,
					"--bs-duration": `${TRANSITION_MS}ms`,
					"--bs-ease": EASE,
					"will-change": "transform",
					"touch-action": "pan-y",
					"-webkit-tap-highlight-color": "transparent",
				}}
				class={cn(
					"bs-content",
					`fixed inset-x-0 bottom-0 flex ${MODAL_MAX_H} flex-col rounded-t-xl ${OVERLAY_SURFACE_OPAQUE} outline-none`,
					"after:absolute after:inset-x-0 after:top-full after:h-1/2 after:bg-inherit",
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
				"flex h-8 w-full shrink-0 touch-none select-none items-center justify-center",
				local.class,
			)}
			{...rest}
		>
			<div class="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
		</div>
	);
};

/* Only the Body: a titled, footed sheet is a ResponsiveDialog, which renders
 * its own Header and Footer around this same surface. */
const {
	Header: BottomSheetHeader,
	Body: BottomSheetBody,
	Footer: BottomSheetFooter,
} = createModalParts("bottom-sheet");

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
	const component = () => local.as ?? "button";
	return (
		<Dynamic
			component={component()}
			type={component() === "button" ? "button" : undefined}
			data-slot="bottom-sheet-close"
			onClick={(event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => {
				callEventHandler(event, local.onClick);
				ctx.setOpen(false);
			}}
			{...rest}
		>
			{local.children}
		</Dynamic>
	);
};

/** @deprecated the shared modal parts; `BottomSheetHeader` and `BottomSheetFooter` stay as aliases. */
export {
	BottomSheet,
	BottomSheetBody,
	BottomSheetClose,
	BottomSheetContent,
	BottomSheetDescription,
	BottomSheetFooter,
	BottomSheetHandle,
	BottomSheetHeader,
	BottomSheetOverlay,
	BottomSheetPortal,
	BottomSheetTitle,
	BottomSheetTrigger,
};
