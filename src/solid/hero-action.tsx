import { type JSX, Show } from "solid-js";
import { glassToneText, isNeutralTone, NEUTRAL_KNOBS } from "../lib/glass-tone.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Icon } from "./icon.js";
import { Ornament } from "./ornament.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

/* One card for every "pick one of a few big choices" screen: the setup
 * wizard's connect/sign-in steps and People's pick-one dialogs. Chrome lives
 * here once; the two call shapes below (nav button vs. grouped radio item)
 * share it so neither surface can drift from the other. */
const HERO_ACTION_CHROME =
	"glass group relative flex min-h-[6.25rem] items-center gap-4 overflow-hidden rounded-[calc(var(--radius)+8px)] p-4 text-left transition-glass duration-200 [--glass-lift:0.4] [--glass-wash:20%] hover:[--glass-wash:30%] [--glass-edge:oklch(from_var(--glass-tone)_l_c_h/0.5)] [&_[data-slot=ornament-arrow]]:opacity-35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 hover:[--glass-lift:0.85] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:hover:translate-y-0";

/* glassToneText tints a label toward its own tone, which stops being legible
 * on a dark surface once the tone itself is dark (the GlassHome deep blue).
 * Lift dark tones to a readable lightness first; light tones pass through. */
function titleTone(tone: string): string {
	const l = Number.parseFloat(tone.match(/oklch\(\s*([0-9.]+)/)?.[1] ?? "");
	if (Number.isNaN(l) || l >= 0.68) return tone;
	return tone.replace(/oklch\(\s*[0-9.]+/, "oklch(0.76");
}

interface HeroActionContentProps {
	icon: string;
	iconImage?: string;
	title: string;
	description: string;
	accentVar: string;
	recommended?: boolean;
	recommendedHint?: string;
	/** "arrow" is the go-somewhere-else watermark (setup); "check" is the
	 *  picked-state glyph for a grouped radio item; "none" suits a picker whose
	 *  click already moves the step on. */
	ornament: "arrow" | "check" | "none";
}

function HeroActionContent(props: HeroActionContentProps) {
	return (
		<>
			<Ornament kind={props.ornament} />

			<div class="flex w-full items-center gap-4">
				<span
					class="relative flex shrink-0 items-center justify-center"
					style={{ color: "var(--surface-tone)" }}
				>
					<Show
						when={props.iconImage}
						fallback={<Icon icon={props.icon} width={52} aria-hidden="true" />}
					>
						{(src) => <img src={src()} alt="" class="size-14 object-contain" aria-hidden="true" />}
					</Show>
				</span>
				<div class="relative flex min-w-0 flex-1 flex-col gap-1">
					<div class="flex items-center gap-2">
						<h3
							class="font-semibold text-lg leading-tight"
							style={{ color: glassToneText(titleTone(props.accentVar)) }}
						>
							{props.title}
						</h3>
						<Show when={props.recommended}>
							<Tooltip openDelay={150}>
								<TooltipTrigger as={Badge} tone="var(--success)">
									Recommended
								</TooltipTrigger>
								<Show when={props.recommendedHint}>
									{(hint) => <TooltipContent>{hint()}</TooltipContent>}
								</Show>
							</Tooltip>
						</Show>
					</div>
					<p class="truncate text-foreground/80 text-sm">{props.description}</p>
				</div>
			</div>
		</>
	);
}

/** Navigates away immediately on click — the setup wizard's connect/sign-in
 *  steps. Not part of a group, no persisted selection. */
export function HeroAction(props: {
	icon: string;
	iconImage?: string;
	title: string;
	description: string;
	onClick: () => void;
	accentVar: string;
	disabled?: boolean;
	recommended?: boolean;
	recommendedHint?: string;
	class?: string;
}) {
	return (
		<button
			type="button"
			data-slot="hero-action"
			onClick={() => !props.disabled && props.onClick()}
			disabled={props.disabled}
			class={cn(HERO_ACTION_CHROME, isNeutralTone(props.accentVar) && NEUTRAL_KNOBS, props.class)}
			style={{ "--glass-tone": props.accentVar } as JSX.CSSProperties}
		>
			<HeroActionContent
				icon={props.icon}
				iconImage={props.iconImage}
				title={props.title}
				description={props.description}
				accentVar={props.accentVar}
				recommended={props.recommended}
				recommendedHint={props.recommendedHint}
				ornament="arrow"
			/>
		</button>
	);
}
