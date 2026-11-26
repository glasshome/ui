import { type Component, omit } from "solid-js";
import { type ComponentProps, type ValidComponent } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { BADGE_DEFAULT_TONE, BADGE_NEUTRAL_KNOBS } from "../lib/badge-tone.js";
import { isNeutralTone } from "../lib/glass-tone.js";
import { CHIP } from "../lib/pill-classes.js";
import { TIER_BADGE_CLASS, tierBadgeStyle } from "../lib/tier-badge.js";
import { cn } from "../lib/utils.js";

type BadgeProps = ComponentProps<"span"> &
  Partial<Pick<ComponentProps<"a">, "href" | "target" | "rel">> & {
    as?: ValidComponent;
    /** Any CSS color (semantic token or arbitrary hue). Defaults to var(--primary). */
    tone?: string;
  };

const Badge: Component<BadgeProps> = (props) => {
  const others = omit(props, "class", "as", "tone", "children", "style");
  const c = () => props.tone ?? BADGE_DEFAULT_TONE;
  return (
    <Polymorphic
      defaultAs="span"
      as={props.as}
      data-slot="badge"
      class={cn(CHIP, isNeutralTone(c()) && BADGE_NEUTRAL_KNOBS, props.class)}
      style={{ "--glass-tone": c(), ...(props.style as Record<string, string>) }}
      {...others}
    >
      {props.children}
    </Polymorphic>
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
  const others = omit(props, "class", "hi", "lo", "text", "end", "stop", "children");
  return (
    <span
      data-slot="tier-badge"
      class={cn(TIER_BADGE_CLASS, props.class)}
      style={tierBadgeStyle(props.hi, props.lo, props.text, { end: props.end, stop: props.stop })}
      {...others}
    >
      {props.children}
    </span>
  );
};

export { Badge, TierBadge };
