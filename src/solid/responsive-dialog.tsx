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
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetHandle,
	BottomSheetOverlay,
	BottomSheetPortal,
} from "./bottom-sheet";
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
	const open = () => (isControlled() ? props.open === true : uncontrolledOpen());

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

const ResponsiveDialogTrigger: ParentComponent<ComponentProps<"button">> = (props) => {
	const [local, rest] = splitProps(props, ["children", "class"]);
	const { setOpen } = useDialogContext();

	return (
		<button type="button" onClick={() => setOpen(true)} class={local.class} {...rest}>
			{local.children}
		</button>
	);
};

const ResponsiveDialogContent: ParentComponent<ComponentProps<"div">> = (props) => {
	const ctx = useDialogContext();
	return (
		<Show when={ctx.isMobile()} fallback={<DesktopContent {...props} />}>
			<MobileContent {...props} />
		</Show>
	);
};

// Desktop: centered modal with manual overlay + close animation
const DesktopContent: ParentComponent<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["children", "class"]);
	const ctx = useDialogContext();
	const { open, setOpen } = ctx;
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
				requestAnimationFrame(() => setIsOpening(false));
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
					<div
						class={cn(
							"fixed inset-0 bg-black/80 transition-opacity duration-100 ease-out",
							isClosing() || isOpening() ? "opacity-0" : "opacity-100",
						)}
						onClick={handleClose}
						aria-hidden="true"
					/>
					{/* Click-outside dismiss layer; Escape is handled by a document listener above. */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: see above */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
					<div
						class="fixed inset-0 flex items-start justify-center p-4 pt-[15vh]"
						onClick={handleClose}
					>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation guard so content clicks don't dismiss; not an action. */}
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
				</div>
			</Portal>
		</Show>
	);
};

// Mobile: in-house BottomSheet (drag-to-dismiss + velocity + scroll handoff)
const MobileContent: ParentComponent<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["children", "class"]);
	const ctx = useDialogContext();
	ctx.close = () => ctx.setOpen(false);

	return (
		<BottomSheet open={ctx.open()} onOpenChange={ctx.setOpen}>
			<BottomSheetPortal>
				<BottomSheetOverlay />
				<BottomSheetContent class={local.class} {...rest}>
					<BottomSheetHandle />
					<BottomSheetBody class="pt-2">{local.children}</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheetPortal>
		</BottomSheet>
	);
};

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

const ResponsiveDialogClose: ParentComponent<ComponentProps<"button">> = (props) => {
	const [local, rest] = splitProps(props, ["children", "class"]);
	const { close } = useDialogContext();

	return (
		<Button variant="outline" onClick={() => close()} class={local.class} {...rest}>
			{local.children ?? "Close"}
		</Button>
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
