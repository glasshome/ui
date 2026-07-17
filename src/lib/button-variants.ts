import { cva } from "cva";

/**
 * Button class recipe. Pure (only `cva`, no Solid/Kobalte), so it can be
 * imported server-side and from framework-agnostic entry points — Astro
 * frontmatter pulls this to build class strings without hydrating a component.
 * The Solid `<Button>` and the hub's marketing pill tokens share this one recipe.
 *
 * Buttons are pills: `rounded-full` is the base shape everywhere. `size: none`
 * is sizeless (color + shape only) for callers that supply their own height and
 * padding.
 *
 * Glass, but OPAQUE — the one place buttons must diverge from <Badge>. A badge
 * sits on a known light surface, so it can be translucent + frosted. A button
 * lands anywhere (the header glass bar over a dark hero, a dark section); a
 * translucent fill shows that through and renders muddy/dark, worst in light
 * mode. So the tone is mixed over an OPAQUE var(--card) (a touch lighter than
 * --background in dark, so it's less muddy), and the glass life comes from the
 * shadow instead of a frost: the `glass-rim` @utility carries the shared shine
 * (var(--glass-rim-shine)) + a tone glow set per variant via --glass-tone — the
 * same shadow glassSurface() gives a badge — which renders over opaque just fine. Label mixes toward the theme-aware
 * --foreground (glassToneText); all color mixes are *srgb* (Tailwind's `/30`
 * opacity mixes in oklab and goes muddy). Ships as a raw class string the
 * components can't reach with inline style, so every variant is fully LITERAL
 * (no helper) for Tailwind's scanner, and the exact shadow lives in an @utility
 * (arbitrary box-shadow classes won't emit). Hover brightens the fill.
 */
export const buttonVariants = cva({
	base: "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			// Primary glass: opaque tone over --card + tone-lit rim + top-left edge
			// light + tinted label. (glassToneText primary = 70%)
			default: [
				"border-[color-mix(in_srgb,var(--primary)_45%,transparent)]",
				"bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--primary)_30%,var(--card)),color-mix(in_srgb,var(--primary)_12%,var(--card)))]",
				"text-[color-mix(in_oklab,var(--primary)_70%,var(--foreground))]",
				"glass-rim [--glass-tone:color-mix(in_srgb,var(--primary)_16%,transparent)]",
				"hover:border-[color-mix(in_srgb,var(--primary)_60%,transparent)]",
				"hover:bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--primary)_40%,var(--card)),color-mix(in_srgb,var(--primary)_18%,var(--card)))]",
			].join(" "),
			// Brand glass: primary→accent sweep (two-tone). The hub's PILL_PRIMARY_CLASS
			// hand-rolled the flat version before the matrix existed.
			gradient: [
				"border-[color-mix(in_srgb,var(--accent)_45%,transparent)]",
				"bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--primary)_60%,var(--card)),color-mix(in_srgb,var(--accent)_44%,var(--card)))]",
				"text-[color-mix(in_oklab,var(--accent)_65%,var(--foreground))]",
				"glass-rim [--glass-tone:color-mix(in_srgb,var(--accent)_16%,transparent)]",
				"hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)]",
				"hover:bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--primary)_70%,var(--card)),color-mix(in_srgb,var(--accent)_54%,var(--card)))]",
			].join(" "),
			// Destructive glass: opaque red tint. (glassToneText destructive = 61%)
			destructive: [
				"border-[color-mix(in_srgb,var(--destructive)_45%,transparent)]",
				"bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--destructive)_30%,var(--card)),color-mix(in_srgb,var(--destructive)_12%,var(--card)))]",
				"text-[color-mix(in_oklab,var(--destructive)_61%,var(--foreground))]",
				"glass-rim [--glass-tone:color-mix(in_srgb,var(--destructive)_16%,transparent)]",
				"hover:border-[color-mix(in_srgb,var(--destructive)_60%,transparent)]",
				"hover:bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--destructive)_40%,var(--card)),color-mix(in_srgb,var(--destructive)_18%,var(--card)))]",
				"focus-visible:ring-destructive/30",
			].join(" "),
			// Neutral glass: opaque theme card + rim, no tone.
			outline:
				"glass-rim border border-border bg-card hover:bg-muted/60 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			// Low-emphasis branded action: soft accent glass (the "Notify me" look).
			// (glassToneText accent = 65%)
			secondary: [
				"border-[color-mix(in_srgb,var(--accent)_45%,transparent)]",
				"bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--accent)_30%,var(--card)),color-mix(in_srgb,var(--accent)_12%,var(--card)))]",
				"text-[color-mix(in_oklab,var(--accent)_65%,var(--foreground))]",
				"glass-rim [--glass-tone:color-mix(in_srgb,var(--accent)_16%,transparent)]",
				"hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)]",
				"hover:bg-[radial-gradient(120%_120%_at_22%_8%,oklch(100%_0_0/0.16),transparent_58%),linear-gradient(135deg,color-mix(in_srgb,var(--accent)_40%,var(--card)),color-mix(in_srgb,var(--accent)_18%,var(--card)))]",
			].join(" "),
			ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
			link: "text-primary underline-offset-4 hover:underline",
		},
		size: {
			default: "h-9 px-4 py-2 has-[>svg]:px-3",
			sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
			lg: "h-10 px-6 has-[>svg]:px-4",
			icon: "size-9 p-2",
			// sizeless: color + shape only, caller supplies h-*/px-* (marketing CTAs
			// that vary sizing per surface). Backs the hub PILL_* class tokens.
			none: "",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});
