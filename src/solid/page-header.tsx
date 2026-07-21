import { Icon } from "@iconify-icon/solid";
import { type JSX, Show } from "solid-js";
import { CountPill } from "./count-pill.js";
import type { GlassSurface } from "./section-card.js";

/**
 * Page banner header, shared by dash and hub. The glassy banner (gradient fill,
 * primary glow, optional logo watermark, top-inset + bottom hairline) is the
 * canonical design; content is a superset API: icon/iconNode + title + count
 * pill + subtitle on the left, actions on the right.
 *
 * `glass` is dash's performant-blur injection (like SectionCard) — omit (hub) for
 * a normal frosted banner. `logo` is the watermark image src; omit for no
 * watermark (the package ships no asset).
 */
const NOOP_GLASS: Required<GlassSurface> = {
	ref: () => {},
	style: () => ({}),
	active: () => false,
};

export function PageHeader(props: {
	/** Iconify icon name for the banner glyph. */
	icon?: string;
	/** Custom glyph, overrides `icon`. */
	iconNode?: JSX.Element;
	title: JSX.Element;
	subtitle?: JSX.Element;
	/** Small count pill next to the title. Rendered only when not null/undefined. */
	count?: number | string;
	/** Right-side actions. */
	actions?: JSX.Element;
	/** Watermark image src (e.g. the app logo). Omit for no watermark. */
	logo?: string;
	/** Performant-blur injection (dash). Omit for a normal frosted banner. */
	glass?: GlassSurface;
}) {
	const glass = () => props.glass ?? NOOP_GLASS;
	return (
		<div
			ref={glass().ref}
			class="relative mt-3 mb-5 overflow-hidden rounded-xl border border-white/[0.06] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.06),0_8px_24px_-12px_rgb(0_0_0_/_0.4)]"
			classList={{
				"bg-gradient-to-br from-card/55 via-card/25 to-card/10 backdrop-blur-xl": !(
					glass().active?.() ?? false
				),
			}}
			style={glass().style?.() ?? {}}
		>
			<div class="pointer-events-none absolute top-0 left-0 h-48 w-72 -translate-x-1/3 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
			<Show when={props.logo}>
				{(logo) => (
					<img
						src={logo()}
						alt=""
						class="pointer-events-none absolute -top-4 -right-8 size-48 rotate-[14deg] opacity-[0.13] [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_80%)]"
					/>
				)}
			</Show>
			<div class="relative flex min-h-[64px] items-center justify-between gap-2 px-4 py-3 sm:min-h-[80px] sm:gap-4 sm:px-6 sm:py-5">
				<div class="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
					<Show
						when={props.iconNode}
						fallback={
							<Show when={props.icon}>
								{(icon) => (
									<Icon icon={icon()} class="shrink-0 text-[28px] text-primary sm:text-[32px]" />
								)}
							</Show>
						}
					>
						{props.iconNode}
					</Show>
					<div class="min-w-0">
						<div class="flex min-w-0 items-center gap-3">
							<h1 class="min-w-0 truncate font-bold text-foreground text-xl tracking-[-0.02em] sm:text-2xl">
								{props.title}
							</h1>
							<Show when={props.count != null}>
								<CountPill>{props.count}</CountPill>
							</Show>
						</div>
						<Show when={props.subtitle}>
							<div class="mt-0.5 flex items-center gap-2 text-muted-foreground text-sm">
								{props.subtitle}
							</div>
						</Show>
					</div>
				</div>
				<Show when={props.actions}>
					<div class="flex shrink-0 items-center gap-2">{props.actions}</div>
				</Show>
			</div>
			<div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
		</div>
	);
}
