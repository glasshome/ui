import { cva, type VariantProps } from "cva";
import {
	type Component,
	type ComponentProps,
	Show,
	splitProps,
	type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils";

const badgeVariants = cva({
	base: "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
	variants: {
		variant: {
			default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
			secondary:
				"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
			destructive:
				"border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
			outline: "text-foreground [a&]:hover:bg-muted [a&]:hover:text-foreground",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

type BadgeProps = ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & {
		component?: ValidComponent;
		/**
		 * Glass tone chip: pass any CSS color (a semantic token like var(--success)
		 * or an arbitrary categorical hue) and the badge renders as a frosted tinted
		 * pill, both themes, no dark: overrides. Overrides `variant` when set.
		 */
		tone?: string;
		/** With `tone`: render a lit status dot before the label. */
		dot?: boolean;
	};

/**
 * Per-tone text contrast: mix the label toward --foreground by an amount that
 * scales with the tone's lightness. Light tones (amber, lime) pull further to
 * foreground so they read as strongly as the dark tones; a single flat mix
 * leaves the light ones washed out. Mirrors the alert token contrast values.
 */
const TONE_L: Record<string, number> = {
	"var(--primary)": 0.48,
	"var(--accent)": 0.6,
	"var(--success)": 0.68,
	"var(--warning)": 0.76,
	"var(--destructive)": 0.66,
	"var(--muted-foreground)": 0.55,
};

function toneTextMix(color: string): number {
	const known = TONE_L[color];
	const raw = color.match(/oklch\(\s*([0-9.]+)/)?.[1];
	const l = known ?? (raw ? Number.parseFloat(raw) : 0.6);
	return Math.min(70, Math.max(46, Math.round(71 - (l - 0.5) * 60)));
}

const Badge: Component<BadgeProps> = (props) => {
	const [local, others] = splitProps(props, [
		"class",
		"variant",
		"component",
		"tone",
		"dot",
		"children",
	]);
	const Comp = () => local.component || "span";
	const c = () => local.tone as string;
	return (
		<Show
			when={local.tone}
			fallback={
				<Dynamic
					component={Comp()}
					data-slot="badge"
					class={cn(badgeVariants({ variant: local.variant }), local.class)}
					{...others}
				>
					{local.children}
				</Dynamic>
			}
		>
			<Dynamic
				component={Comp()}
				data-slot="badge"
				class={cn(
					"inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-medium text-xs",
					local.class,
				)}
				style={{
					"border-color": `color-mix(in oklch, ${c()} 40%, transparent)`,
					background: `linear-gradient(155deg, color-mix(in oklch, ${c()} 26%, transparent), color-mix(in oklch, ${c()} 7%, transparent))`,
					// oklab, not oklch: mixing a hued tone with the near-white --foreground
					// in oklch swings the hue toward 0 (green reads yellow at ~40% fg).
					color: `color-mix(in oklab, ${c()} ${toneTextMix(c())}%, var(--foreground))`,
					"backdrop-filter": "blur(8px) saturate(180%)",
					"-webkit-backdrop-filter": "blur(8px) saturate(180%)",
					"box-shadow": `inset 0 1px 0 oklch(1 0 0 / 0.22), inset 0 -2px 4px color-mix(in oklch, ${c()} 14%, transparent), 0 1px 3px color-mix(in oklch, ${c()} 20%, transparent)`,
				}}
				{...others}
			>
				<Show when={local.dot}>
					<span
						class="size-1.5 rounded-full"
						style={{
							background: c(),
							"box-shadow": `0 0 5px color-mix(in oklch, ${c()} 80%, transparent), inset 0 0.5px 0.5px oklch(1 0 0 / 0.6)`,
						}}
					/>
				</Show>
				{local.children}
			</Dynamic>
		</Show>
	);
};

type TierBadgeProps = ComponentProps<"span"> & {
	/** Gradient high stop (both ends of the diagonal sweep). */
	hi: string;
	/** Gradient low stop (the mid dip). */
	lo: string;
	/** Dark label color. */
	text: string;
};

/**
 * Metallic tier chip (PRO / EARLY BIRD / CREATOR): a brushed-metal pill with a
 * 135deg corner-to-corner sweep (bright ends, dip in the middle) and dark text.
 * One family; only the hi/lo/text triplet changes per tier.
 */
const TierBadge: Component<TierBadgeProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "hi", "lo", "text", "children"]);
	return (
		<span
			data-slot="tier-badge"
			class={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 font-black text-[10px] uppercase tracking-wider",
				local.class,
			)}
			style={{
				background: `linear-gradient(135deg, ${local.hi}, ${local.lo} 50%, ${local.hi})`,
				color: local.text,
				"box-shadow": "inset 0 1px 0 oklch(1 0 0 / 0.45), 0 1px 2px oklch(0 0 0 / 0.25)",
			}}
			{...others}
		>
			{local.children}
		</span>
	);
};

export { Badge, badgeVariants, TierBadge };
