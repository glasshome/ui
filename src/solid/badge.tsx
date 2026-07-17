import { type Component, type ComponentProps, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { BADGE_DEFAULT_TONE, BADGE_TONE_CLASS } from "../lib/badge-tone";
import { TIER_BADGE_CLASS, tierBadgeStyle } from "../lib/tier-badge";
import { cn } from "../lib/utils";

type BadgeProps = ComponentProps<"span"> & {
	component?: ValidComponent;
	/**
	 * Glass tone: any CSS color (a semantic token like var(--success) or an
	 * arbitrary categorical hue). The badge is a frosted tinted pill in both
	 * themes, no dark: overrides. Defaults to var(--primary). There are no solid
	 * variants — glass is the only badge.
	 */
	tone?: string;
};

const Badge: Component<BadgeProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "component", "tone", "children", "style"]);
	const Comp = () => local.component || "span";
	const c = () => local.tone ?? BADGE_DEFAULT_TONE;
	return (
		<Dynamic
			component={Comp()}
			data-slot="badge"
			class={cn(BADGE_TONE_CLASS, "glass", local.class)}
			style={{ "--glass-tone": c(), ...(local.style as Record<string, string>) }}
			{...others}
		>
			{local.children}
		</Dynamic>
	);
};

type TierBadgeProps = ComponentProps<"span"> & {
	/** Gradient high stop (the near end of the diagonal sweep, and by default
	 *  the far end too). */
	hi: string;
	/** Gradient low stop (the dip). */
	lo: string;
	/** Dark label color. */
	text: string;
	/** Far end of the sweep. Default: `hi` (symmetric brushed look). */
	end?: string;
	/** Where `lo` sits, in percent. Default: 50. */
	stop?: number;
};

/**
 * Metallic tier chip (PRO / EARLY BIRD / CREATOR): a brushed-metal pill with a
 * 135deg corner-to-corner sweep (bright ends, dip in the middle) and dark text.
 * One family; only the hi/lo/text triplet changes per tier.
 */
const TierBadge: Component<TierBadgeProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "hi", "lo", "text", "end", "stop", "children"]);
	return (
		<span
			data-slot="tier-badge"
			class={cn(TIER_BADGE_CLASS, local.class)}
			style={tierBadgeStyle(local.hi, local.lo, local.text, { end: local.end, stop: local.stop })}
			{...others}
		>
			{local.children}
		</span>
	);
};

export { Badge, TierBadge };
