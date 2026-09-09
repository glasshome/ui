import { type ComponentProps, children, type JSX, Show, splitProps } from "solid-js";
import {
	CARD_BLUR,
	CARD_SURFACE_BASE,
	SECTION_ROW_INTERACTIVE,
	SECTION_ROW_SURFACE,
} from "../lib/card-classes.js";
import { ICON_PILL, ICON_PILL_TINT } from "../lib/pill-classes.js";
import {
	SECTION_INNER_RADIUS,
	SECTION_OUTER_RADIUS,
	SECTION_PADDING,
} from "../lib/section-tokens.js";
import { cn } from "../lib/utils.js";
import { CountPill } from "./count-pill.js";
import { Icon } from "./icon.js";

/* Performant-blur injection (dash): when active() the card gates CARD_BLUR off
 * and paints the engine's precomputed slice via style() instead. */
export type GlassSurface = {
	ref?: (el: HTMLElement) => void;
	style?: () => JSX.CSSProperties;
	active?: () => boolean;
};

export const NOOP_GLASS: Required<GlassSurface> = {
	ref: () => {},
	style: () => ({}),
	active: () => false,
};

type SectionCardProps = {
	icon?: string;
	title?: JSX.Element;
	subtitle?: JSX.Element;
	count?: number | string;
	action?: JSX.Element;
	toolbar?: JSX.Element;
	headerClass?: string;
	subtitleClass?: string;
	class?: string;
	glass?: GlassSurface;
	children?: JSX.Element;
};

// The section owns every gap; the header, toolbar and rows inside it add none.
export function SectionCard(props: SectionCardProps) {
	const glass = () => props.glass ?? NOOP_GLASS;
	const active = () => glass().active?.() ?? false;
	const hasHeader = () =>
		props.icon != null || props.title != null || props.action != null || props.count != null;
	// Resolved once: a header-only card must not pay the section gap for an
	// empty body slot, and reading props.children twice would build it twice.
	const body = children(() => props.children);
	const hasBody = () => body.toArray().some((child) => child != null && child !== false);

	return (
		<section
			data-slot="section-card"
			ref={glass().ref}
			class={cn(
				CARD_SURFACE_BASE,
				SECTION_OUTER_RADIUS,
				SECTION_PADDING,
				"relative flex flex-col gap-3 overflow-hidden transition-glass [contain:layout_style_paint] md:gap-4",
				props.class,
			)}
			classList={{ [CARD_BLUR]: !active() }}
			style={glass().style?.() ?? {}}
		>
			<Show when={hasHeader()}>
				<header
					data-slot="section-card-header"
					class={cn("flex items-center gap-2 sm:gap-3", props.headerClass)}
				>
					<Show when={props.icon}>{(icon) => <SectionIcon icon={icon()} />}</Show>
					<div data-slot="section-card-headings" class="flex min-w-0 flex-1 flex-col gap-0.5">
						<div data-slot="section-card-headline" class="flex min-w-0 items-center gap-2 sm:gap-3">
							<Show when={props.title}>
								<SectionTitle>{props.title}</SectionTitle>
							</Show>
							<Show when={props.count != null}>
								<CountPill>{props.count}</CountPill>
							</Show>
						</div>
						<Show when={props.subtitle}>
							<SectionMeta class={props.subtitleClass}>{props.subtitle}</SectionMeta>
						</Show>
					</div>
					<Show when={props.action}>
						<div data-slot="section-card-actions" class="flex shrink-0 items-center gap-2">
							{props.action}
						</div>
					</Show>
				</header>
			</Show>
			<Show when={props.toolbar}>
				<div
					data-slot="section-card-toolbar"
					class={cn(hasHeader() && "border-border/50 border-t pt-3")}
				>
					{props.toolbar}
				</div>
			</Show>
			<Show when={hasBody()}>
				<div data-slot="section-card-body">{body()}</div>
			</Show>
		</section>
	);
}

export function SectionRow(props: ComponentProps<"div"> & { interactive?: boolean }) {
	const [local, rest] = splitProps(props, ["class", "interactive"]);
	return (
		<div
			data-slot="section-row"
			class={cn(
				SECTION_ROW_SURFACE,
				SECTION_INNER_RADIUS,
				SECTION_PADDING,
				local.interactive && SECTION_ROW_INTERACTIVE,
				local.class,
			)}
			{...rest}
		/>
	);
}

type ListRowProps = {
	/** Leading visual: SectionIcon, Avatar, drag handle. */
	leading?: JSX.Element;
	title: JSX.Element;
	/** Chips inline after the title. */
	badges?: JSX.Element;
	subtitle?: JSX.Element;
	/** Quiet trailing text: versions, timestamps, counts. */
	meta?: JSX.Element;
	/** Controls at the row's end. Stacked above the open overlay. */
	actions?: JSX.Element;
	/** Activates the whole row. Renders a chevron when there are no actions. */
	onOpen?: () => void;
	/** The whole row is a link. Same chevron and press target as onOpen. */
	href?: string;
	/** Accessible name for the whole-row activation; required with href or onOpen. */
	openLabel?: string;
	class?: string;
};

/**
 * One item in a settings list. Fixed slots so every list reads the same
 * whatever it holds; the row itself, not a nested button, is what you press.
 */
export function ListRow(props: ListRowProps) {
	const opens = () => props.onOpen !== undefined || props.href !== undefined;
	return (
		<SectionRow
			interactive={opens()}
			class={cn("@container/list-row relative flex items-center gap-3", props.class)}
		>
			<Show when={props.href}>
				{(href) => (
					<a href={href()} class="absolute inset-0 rounded-[inherit] outline-none">
						<span class="sr-only">{props.openLabel}</span>
					</a>
				)}
			</Show>
			<Show when={props.href === undefined && props.onOpen}>
				<button
					type="button"
					class="absolute inset-0 rounded-[inherit] outline-none"
					aria-label={props.openLabel}
					onClick={() => props.onOpen?.()}
				/>
			</Show>
			<Show when={props.leading}>
				<span class="flex shrink-0 items-center gap-2">{props.leading}</span>
			</Show>
			{/* Identity column. The floor is what gives the name priority: without
			    it this is the only shrinkable child, so flex crushes it to an
			    ellipsis and hands every spare pixel to meta. Sized to hold a name
			    plus its badge. */}
			<div class="min-w-[9rem] flex-1">
				<div class="flex min-w-0 items-center gap-2">
					<p class="truncate font-semibold text-sm leading-tight">{props.title}</p>
					{props.badges}
				</div>
				<Show when={props.subtitle}>
					<p class="mt-1 truncate text-muted-foreground text-xs">{props.subtitle}</p>
				</Show>
			</div>
			{/* Trailing meta, centred across both identity lines. shrink-0, because
			    a squeeze-driven wrap fires off whichever meta happens to be widest
			    while the flex-1 identity column still holds unused slack. Meta that
			    wants to reflow reads @container/list-row and says so itself. */}
			<Show when={props.meta}>
				<div class="shrink-0 text-muted-foreground text-xs">{props.meta}</div>
			</Show>
			<Show when={props.actions}>
				<div class="relative flex shrink-0 items-center gap-1">{props.actions}</div>
			</Show>
			<Show when={opens() && props.actions === undefined}>
				<Icon
					icon="lucide:chevron-right"
					width={16}
					height={16}
					class="shrink-0 text-muted-foreground"
					aria-hidden="true"
				/>
			</Show>
		</SectionRow>
	);
}

type SectionIconSize = "sm" | "md" | "lg";

const ICON_DIMENSIONS: Record<SectionIconSize, string> = {
	sm: "size-7 [&>[data-slot=icon]]:text-[16px]",
	md: "size-10 sm:size-11 [&>[data-slot=icon]]:text-[20px] sm:[&>[data-slot=icon]]:text-[22px]",
	lg: "size-12 sm:size-14 [&>[data-slot=icon]]:text-[24px] sm:[&>[data-slot=icon]]:text-[28px]",
};

/** @deprecated pass a CSS color to `tone` instead. */
const LEGACY_TONES: Record<string, string | undefined> = {
	neutral: undefined,
	primary: "var(--primary)",
};

export function SectionIcon(props: {
	icon?: string;
	children?: JSX.Element;
	size?: SectionIconSize;
	/** Any CSS color. `"neutral"` and `"primary"` are the deprecated old enum. */
	tone?: string;
	class?: string;
}) {
	const tone = () => {
		const t = props.tone;
		if (t == null) return undefined;
		return t in LEGACY_TONES ? LEGACY_TONES[t] : t;
	};
	return (
		<span
			data-slot="section-icon"
			class={cn(
				tone() ? ICON_PILL_TINT : `${ICON_PILL} text-foreground/80`,
				SECTION_INNER_RADIUS,
				ICON_DIMENSIONS[props.size ?? "md"],
				props.class,
			)}
			style={tone() ? { "--glass-tone": tone() } : undefined}
		>
			<Show when={props.children} fallback={props.icon ? <Icon icon={props.icon} /> : null}>
				{props.children}
			</Show>
		</span>
	);
}

export function SectionTitle(props: { children: JSX.Element; class?: string }) {
	return (
		<h2
			data-slot="section-title"
			class={cn(
				"truncate font-bold text-foreground text-lg tracking-tight sm:text-xl",
				props.class,
			)}
		>
			{props.children}
		</h2>
	);
}

function SectionHeading(props: { children: JSX.Element; class?: string }) {
	return (
		<h3
			data-slot="section-subtitle"
			class={cn("font-semibold text-base leading-tight", props.class)}
		>
			{props.children}
		</h3>
	);
}

/** @deprecated A bare heading has no owner: `SectionGroup` for a labelled group
 *  inside a card, `FieldLegend` for a titled group of form rows. */
export function SectionSubtitle(props: { children: JSX.Element; class?: string }) {
	return <SectionHeading class={props.class}>{props.children}</SectionHeading>;
}

/** One labelled group inside a `SectionCard`: icon, label, optional count and
 *  action, then its rows. Proximity does the grouping, so a label sits close to
 *  its own rows and far from the group above; no rule is drawn. A zero count
 *  renders no pill: the empty group below already says it. */
export function SectionGroup(props: {
	icon: string;
	label: JSX.Element;
	count?: number | string;
	action?: JSX.Element;
	class?: string;
	children: JSX.Element;
}) {
	return (
		<section data-slot="section-group" class={cn("mt-7 first:mt-3", props.class)}>
			<header
				data-slot="section-group-header"
				class="mb-2 flex flex-wrap items-center justify-between gap-2"
			>
				<div data-slot="section-group-heading" class="flex min-w-0 items-center gap-2">
					<SectionIcon icon={props.icon} size="sm" />
					<SectionHeading>{props.label}</SectionHeading>
					<Show when={props.count}>
						<CountPill>{props.count}</CountPill>
					</Show>
				</div>
				{props.action}
			</header>
			{props.children}
		</section>
	);
}

/** @deprecated SectionMeta, or FieldLegend for a titled group of rows. */
export function SectionLabel(props: { children: JSX.Element; class?: string }) {
	return <SectionMeta class={cn("font-medium", props.class)}>{props.children}</SectionMeta>;
}

export function SectionMeta(props: { children: JSX.Element; class?: string }) {
	return (
		<p data-slot="section-meta" class={cn("text-muted-foreground text-xs", props.class)}>
			{props.children}
		</p>
	);
}

export function SectionRowSkeleton(props: { class?: string }) {
	return (
		<div
			data-slot="section-row-skeleton"
			aria-hidden="true"
			class={cn(
				SECTION_ROW_SURFACE,
				SECTION_INNER_RADIUS,
				"h-14 animate-pulse [--glass-rim:0.15]",
				props.class,
			)}
		/>
	);
}

export function SectionRowSkeletons(props: { count?: number }) {
	const n = props.count ?? 3;
	return (
		<div data-slot="section-row-skeletons" class="flex flex-col gap-2" aria-busy="true">
			{Array.from({ length: n }, () => (
				<SectionRowSkeleton />
			))}
		</div>
	);
}
