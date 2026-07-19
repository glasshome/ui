import { Icon } from "@iconify-icon/solid";
import { type ComponentProps, type JSX, Show, splitProps } from "solid-js";
import { CARD_BLUR, CARD_SURFACE_BASE } from "../lib/card-classes";
import { CountPill } from "./count-pill";
import { SECTION_INNER_RADIUS, SECTION_PADDING, SECTION_ROW_CLASS } from "../lib/section-tokens";

/**
 * Section card kit — the settings/list surface shared by dash and hub. Use these
 * primitives instead of hand-rolling padding, radius, or typography per call
 * site. Surface tokens live in ../lib/section-tokens.
 *
 * Canonical list page:
 *   <SectionCard icon title subtitle count action toolbar>
 *     <div class="space-y-2"> ...<SectionRow/> items... </div>
 *   </SectionCard>
 */

/**
 * Injection point for dash's performant-blur engine (which blurs the background
 * once and paints an aligned slice per surface). Pass the object from dash's
 * `usePerformantBlur()`; when `active()` is true the card gates its own
 * `backdrop-blur` off and paints `style()` instead. Omitted (hub, the default)
 * → an inert noop → a normal frosted `bg-card/60 backdrop-blur-xl` card.
 */
export type GlassSurface = {
	ref?: (el: HTMLElement) => void;
	style?: () => JSX.CSSProperties;
	active?: () => boolean;
};

const NOOP_GLASS: Required<GlassSurface> = {
	ref: () => {},
	style: () => ({}),
	active: () => false,
};

type SectionCardProps = {
	/** Leading icon pill in the header. Optional: omit (with title/action) for a
	 *  headerless plain panel. */
	icon?: string;
	/** Header heading. Optional. */
	title?: JSX.Element;
	/** Muted stats/meta line under the title. */
	subtitle?: JSX.Element;
	/** Small count pill next to the title. Only rendered when not null/undefined. */
	count?: number | string;
	/** Header right side. */
	action?: JSX.Element;
	/** Full-width region below the header, before children, with a top divider.
	 *  Use for a search/filter toolbar row. */
	toolbar?: JSX.Element;
	/** Extra classes on the <header>. */
	headerClass?: string;
	/** Performant-blur injection (dash). Omit for a normal frosted card. */
	glass?: GlassSurface;
	children: JSX.Element;
};

export function SectionCard(props: SectionCardProps) {
	const glass = () => props.glass ?? NOOP_GLASS;
	const active = () => glass().active?.() ?? false;
	const hasHeader = () =>
		props.icon != null || props.title != null || props.action != null || props.count != null;

	return (
		<section
			ref={glass().ref}
			class={`${CARD_SURFACE_BASE} relative overflow-hidden rounded-[var(--radius)] transition-colors [contain:layout_style_paint] hover:border-border`}
			classList={{ [CARD_BLUR]: !active() }}
			style={glass().style?.() ?? {}}
		>
			<Show when={hasHeader()}>
				<header
					class={`${SECTION_PADDING} flex items-center justify-between gap-2 pb-3 md:pb-4 ${props.headerClass ?? ""}`}
				>
					<div class="flex min-w-0 items-center gap-3">
						<Show when={props.icon}>{(icon) => <SectionIcon icon={icon()} />}</Show>
						<div class="min-w-0">
							<div class="flex min-w-0 items-center gap-3">
								<Show when={props.title}>
									<SectionTitle>{props.title}</SectionTitle>
								</Show>
								<Show when={props.count != null}>
									<CountPill>{props.count}</CountPill>
								</Show>
							</div>
							<Show when={props.subtitle}>
								<SectionMeta class="mt-0.5">{props.subtitle}</SectionMeta>
							</Show>
						</div>
					</div>
					{props.action}
				</header>
			</Show>
			<Show when={props.toolbar}>
				<div class={`${SECTION_PADDING} ${hasHeader() ? "border-border/50 border-t pt-3" : ""}`}>
					{props.toolbar}
				</div>
			</Show>
			<div class={`${SECTION_PADDING} ${hasHeader() || props.toolbar != null ? "pt-0" : ""}`}>
				{props.children}
			</div>
		</section>
	);
}

/** Inner card sitting flush against section padding. Use instead of
 *  hand-rolling `border bg-card p-3` + radius math. */
export function SectionRow(props: ComponentProps<"div">) {
	const [local, rest] = splitProps(props, ["class"]);
	return <div class={`${SECTION_ROW_CLASS} ${local.class ?? ""}`} {...rest} />;
}

type SectionIconSize = "sm" | "md" | "lg";

const ICON_DIMENSIONS: Record<SectionIconSize, string> = {
	sm: "size-7 [&>iconify-icon]:text-[16px]",
	md: "size-10 sm:size-11 md:size-12 [&>iconify-icon]:text-[20px] sm:[&>iconify-icon]:text-[22px] md:[&>iconify-icon]:text-[24px]",
	lg: "size-12 sm:size-14 [&>iconify-icon]:text-[24px] sm:[&>iconify-icon]:text-[28px]",
};

const ICON_TONES = {
	/** Default: neutral chip (settings/list). */
	neutral: "bg-foreground/10 text-foreground/80",
	/** Branded: primary-tinted chip (the pill hand-inlined across widget/org rows). */
	primary: "bg-primary/10 text-primary",
} as const;

export function SectionIcon(props: {
	/** Iconify icon name. Ignored when `children` is provided. */
	icon?: string;
	/** Custom glyph (e.g. a lucide-solid component), overrides `icon`. */
	children?: JSX.Element;
	size?: SectionIconSize;
	tone?: keyof typeof ICON_TONES;
	class?: string;
}) {
	return (
		<span
			class={`${SECTION_INNER_RADIUS} ${ICON_DIMENSIONS[props.size ?? "md"]} ${ICON_TONES[props.tone ?? "neutral"]} flex shrink-0 items-center justify-center ${props.class ?? ""}`}
			style={{ "box-shadow": "inset 0 1px 0 oklch(1 0 0 / 0.08)" }}
		>
			<Show when={props.children} fallback={props.icon ? <Icon icon={props.icon} /> : null}>
				{props.children}
			</Show>
		</span>
	);
}

/** Main section heading, sits next to SectionIcon. Responsive. */
export function SectionTitle(props: { children: JSX.Element; class?: string }) {
	return (
		<h2
			class={`truncate font-bold text-foreground text-lg tracking-tight sm:text-xl md:text-2xl ${props.class ?? ""}`}
		>
			{props.children}
		</h2>
	);
}

/** Title for a SectionRow / item. */
export function SectionSubtitle(props: { children: JSX.Element; class?: string }) {
	return (
		<h3 class={`font-semibold text-base leading-tight ${props.class ?? ""}`}>{props.children}</h3>
	);
}

/** Group label sitting above a stack of rows. Micro caps. */
export function SectionLabel(props: { children: JSX.Element; class?: string }) {
	return (
		<p
			class={`px-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wider ${props.class ?? ""}`}
		>
			{props.children}
		</p>
	);
}

/** Muted helper text (descriptions, captions). */
export function SectionMeta(props: { children: JSX.Element; class?: string }) {
	return <p class={`text-muted-foreground text-xs ${props.class ?? ""}`}>{props.children}</p>;
}

/** Pulsing placeholder shaped like SectionRow. Use as loading fallback. */
export function SectionRowSkeleton(props: { class?: string }) {
	return (
		<div
			aria-hidden="true"
			class={`${SECTION_ROW_CLASS} h-14 animate-pulse border-border/40 bg-foreground/[0.03] ${props.class ?? ""}`}
		/>
	);
}

/** Stack of N row skeletons. */
export function SectionRowSkeletons(props: { count?: number }) {
	const n = props.count ?? 3;
	return (
		<div class="space-y-2" aria-busy="true">
			{Array.from({ length: n }, () => (
				<SectionRowSkeleton />
			))}
		</div>
	);
}
