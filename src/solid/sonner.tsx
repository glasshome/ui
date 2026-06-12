import {
	type Component,
	type ComponentProps,
	createSignal,
	mergeProps,
	onCleanup,
	onMount,
} from "solid-js";
import { Toaster as SolidSonner } from "solid-sonner";

type Position = ComponentProps<typeof SolidSonner>["position"];

function useIsMobile(breakpoint = 768) {
	const [mobile, setMobile] = createSignal(
		typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
	);

	onMount(() => {
		const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
		setMobile(mq.matches);
		const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
		mq.addEventListener("change", handler);
		onCleanup(() => mq.removeEventListener("change", handler));
	});

	return mobile;
}

const Toaster: Component<ComponentProps<typeof SolidSonner>> = (rawProps) => {
	const isMobile = useIsMobile();
	const props = mergeProps(
		{
			theme: "dark" as const,
			duration: 3000,
			gap: 8,
			visibleToasts: 3,
		},
		rawProps,
	);

	const position = (): Position => props.position ?? (isMobile() ? "top-center" : "bottom-right");

	return (
		<SolidSonner
			{...props}
			position={position()}
			class="toaster group"
			toastOptions={{
				classes: {
					toast:
						"group toast group-[.toaster]:!bg-card group-[.toaster]:!text-foreground group-[.toaster]:!border-border group-[.toaster]:!shadow-lg group-[.toaster]:!rounded-xl group-[.toaster]:!text-sm group-[.toaster]:!py-3 group-[.toaster]:!px-4",
					description: "group-[.toast]:!text-muted-foreground group-[.toast]:!text-xs",
					actionButton: "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground",
					cancelButton: "group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground",
				},
				...props.toastOptions,
			}}
		/>
	);
};

export { toast } from "solid-sonner";
export { Toaster };
