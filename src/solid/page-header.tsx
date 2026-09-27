import { type JSX, Show } from "solid-js";
import { CARD_BLUR, CARD_SURFACE_BASE } from "../lib/card-classes.js";
import { SECTION_OUTER_RADIUS } from "../lib/section-tokens.js";
import { cn } from "../lib/utils.js";
import { CountPill } from "./count-pill.js";
import { type GlassSurface, NOOP_GLASS, SectionIcon } from "./section-card.js";

/**
 * Page banner header, shared by dash and hub: the card surface with a display
 * title and an optional logo watermark. Content is a superset API: icon/iconNode
 * + title + count pill + subtitle on the left, actions on the right. The caller
 * owns the space around it.
 *
 * `glass` is dash's performant-blur injection (like SectionCard); omit (hub) for
 * a normal frosted banner. `logo` is the watermark image src; omit for no
 * watermark (the package ships no asset).
 */
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
			data-slot="page-header"
			ref={glass().ref}
			class={cn(CARD_SURFACE_BASE, SECTION_OUTER_RADIUS, "relative overflow-hidden")}
			classList={{ [CARD_BLUR]: !(glass().active?.() ?? false) }}
			style={glass().style?.() ?? {}}
		>
			<Show when={props.logo}>
				{(logo) => (
					<img
						data-slot="page-header-watermark"
						src={logo()}
						alt=""
						class="pointer-events-none absolute -top-4 -right-8 size-48 rotate-[14deg] opacity-[0.13] [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_80%)]"
					/>
				)}
			</Show>
			<div data-slot="page-header-row" class="relative flex items-center gap-3 p-4 sm:gap-5 sm:p-6">
				<Show
					when={props.iconNode}
					fallback={
						<Show when={props.icon}>
							{(icon) => (
								<SectionIcon icon={icon()} size="lg" tone="var(--primary)" class="shrink-0" />
							)}
						</Show>
					}
				>
					{props.iconNode}
				</Show>
				<div data-slot="page-header-headings" class="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
					<div data-slot="page-header-headline" class="flex min-w-0 items-center gap-2 sm:gap-3">
						<h1
							data-slot="page-header-title"
							class="min-w-0 truncate pb-0.5 font-bold text-[1.75rem] text-foreground leading-none tracking-[-0.035em] sm:text-[2.5rem]"
						>
							{props.title}
						</h1>
						<Show when={props.count != null}>
							<CountPill>{props.count}</CountPill>
						</Show>
					</div>
					<Show when={props.subtitle}>
						<div
							data-slot="page-header-subtitle"
							class="flex items-center gap-2 text-muted-foreground text-sm"
						>
							{props.subtitle}
						</div>
					</Show>
				</div>
				<Show when={props.actions}>
					<div data-slot="page-header-actions" class="flex shrink-0 items-center gap-2">
						{props.actions}
					</div>
				</Show>
			</div>
		</div>
	);
}
