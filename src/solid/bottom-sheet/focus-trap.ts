const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type InitialFocus = "container" | "first" | ((root: HTMLElement) => HTMLElement | null);

interface TrapHandle {
	release: () => void;
}

export function trapFocus(root: HTMLElement, initial: InitialFocus = "container"): TrapHandle {
	const previouslyFocused = (document.activeElement as HTMLElement | null) ?? null;

	const focusTarget: HTMLElement | null =
		initial === "container"
			? root
			: initial === "first"
				? (root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? root)
				: initial(root);

	focusTarget?.focus({ preventScroll: true });

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== "Tab") return;
		const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
			(el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
		);
		if (focusable.length === 0) {
			e.preventDefault();
			root.focus({ preventScroll: true });
			return;
		}
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement | null;
		if (e.shiftKey) {
			if (active === first || active === root || !root.contains(active)) {
				e.preventDefault();
				last?.focus({ preventScroll: true });
			}
		} else {
			if (active === last) {
				e.preventDefault();
				first?.focus({ preventScroll: true });
			}
		}
	};

	document.addEventListener("keydown", onKeyDown);

	return {
		release() {
			document.removeEventListener("keydown", onKeyDown);
			previouslyFocused?.focus?.({ preventScroll: true });
		},
	};
}
