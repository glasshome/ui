import { useRadioGroupContext } from "@kobalte/core/radio-group";
import {
	children,
	createContext,
	createSignal,
	type JSX,
	onCleanup,
	onMount,
	Show,
	useContext,
} from "solid-js";
import { CARD_SURFACE } from "../lib/card-classes.js";
import { STAGGER } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { Ornament } from "./ornament.js";
import { PickerRow } from "./picker-row.js";
import { RadioGroup, RadioGroupItem } from "./radio-group.js";

/* The card is the affordance, so the radio's own control is suppressed and the
 * toned surface plus the check ornament carry the picked state; an accented card keeps its own tone at rest. Tone alone (no
 * .glass-tint) because a card is body copy: .glass-tint would mix the label
 * colour toward the tone, and toward `transparent` while nothing is picked.
 * Padding lives inside the label, not on the item, so the whole card is a
 * click target. */
const OPTION_CARD_CHROME = `${CARD_SURFACE} group/option-card relative cursor-pointer overflow-hidden rounded-xl transition-glass duration-200 [&:not([style*=--glass-tone])]:[--glass-tone:var(--primary)] [--glass-wash:9%] hover:[--glass-wash:16%] has-[:focus-visible]:[--glass-edge:var(--ring)] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 data-[checked]:[--glass-wash:30%] data-[checked]:[--glass-edge:oklch(from_var(--glass-tone)_l_c_h/0.75)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50`;

/* Sub-options live inside the card: the card grows (a grid row morphing
 * 0fr -> 1fr on the morph token) while it is picked, and the content settles
 * in behind the growing edge. Nothing appears below the card. */
const OPTION_CARD_DRAWER =
	"grid grid-rows-[0fr] transition-[grid-template-rows] duration-(--duration-morph) ease-(--ease-morph) group-data-[checked]/option-card:grid-rows-[1fr]";
/* Flat: hover is a tint, the current row is the check plus full text colour.
 * The rows start under the title text (card pad + icon + gap, less the row's own pad). */
const OPTION_CHOICE_ROW =
	"rounded-sm text-foreground/75 transition-colors hover:bg-foreground/5 aria-checked:text-foreground";

const OPTION_CARD_DRAWER_CONTENT =
	"-translate-y-2 flex flex-col gap-0.5 pr-1 pb-2 pl-[calc(var(--spacing)*3.5+54px)] opacity-0 transition-[opacity,translate] duration-(--duration-expand) ease-(--ease-morph) group-data-[checked]/option-card:translate-y-0 group-data-[checked]/option-card:opacity-100 group-data-[checked]/option-card:delay-[80ms]";

/* Sub-options are rows of the card, chosen in place: the same row a picker
 * list shows, flat on the card (a glass pill on a glass card is a layer too
 * many), the check and text weight marking the current one. The card owns the
 * value (`subValue` / `onSubChange`); a choice registers so the card knows
 * it has rows to name as a radiogroup. */
type ChoiceContext = {
	subValue: () => string | undefined;
	pick: (value: string) => void;
	register: (value: string) => () => void;
};
const OptionChoiceContext = createContext<ChoiceContext>();

export function OptionChoice(props: {
	value: string;
	label: string;
	hint?: string;
	icon?: string;
	disabled?: boolean;
}) {
	const card = useContext(OptionChoiceContext);
	if (!card) throw new Error("OptionChoice renders inside an OptionCard");
	onMount(() => onCleanup(card.register(props.value)));
	const selected = () => card.subValue() === props.value;
	return (
		<PickerRow
			as="button"
			type="button"
			role="radio"
			aria-checked={selected()}
			data-slot="option-choice"
			class={OPTION_CHOICE_ROW}
			disabled={props.disabled}
			icon={props.icon}
			title={props.label}
			subtitle={props.hint}
			selected={selected()}
			multi={false}
			onClick={() => !props.disabled && card.pick(props.value)}
		/>
	);
}

export function OptionCardGroup(props: {
	value: string | null;
	onChange: (value: string) => void;
	"aria-label"?: string;
	class?: string;
	children: JSX.Element;
}) {
	return (
		<RadioGroup
			class={cn("gap-2", props.class)}
			value={props.value ?? undefined}
			onChange={props.onChange}
			aria-label={props["aria-label"]}
		>
			{props.children}
		</RadioGroup>
	);
}

export function OptionCard(props: {
	value: string;
	title: string;
	description?: string;
	icon?: string;
	iconImage?: string;
	/** Per-option tone at rest (setup's brand colours); neutral by default. */
	accentVar?: string;
	/** Drop the check when picking the card is itself the next step. */
	ornament?: "check" | "none";
	/** Fires on every click, including a re-pick of the already-checked card,
	 *  which the group's `onChange` alone never reports. */
	onPick?: () => void;
	disabled?: boolean;
	class?: string;
	/** The current sub-option (an OptionChoice value). */
	subValue?: string;
	onSubChange?: (value: string) => void;
	/** Sub-options (OptionChoice rows) or a custom body. The card grows to
	 *  reveal them while it is picked. */
	children?: JSX.Element;
}) {
	const group = useRadioGroupContext();
	const checked = () => group.isSelectedValue(props.value);
	const [choices, setChoices] = createSignal<string[]>([]);
	const choice: ChoiceContext = {
		subValue: () => props.subValue,
		pick: (value) => props.onSubChange?.(value),
		register: (value) => {
			setChoices((list) => [...list, value]);
			return () => setChoices((list) => list.filter((v) => v !== value));
		},
	};
	const kids = children(() => (
		<OptionChoiceContext.Provider value={choice}>{props.children}</OptionChoiceContext.Provider>
	));
	return (
		<div
			data-slot="option-card"
			data-checked={checked() ? "" : undefined}
			class={cn(OPTION_CARD_CHROME, props.class)}
			style={
				props.accentVar ? ({ "--glass-tone": props.accentVar } as JSX.CSSProperties) : undefined
			}
		>
			<RadioGroupItem
				value={props.value}
				disabled={props.disabled}
				showControl={false}
				onClick={() => !props.disabled && props.onPick?.()}
				class="relative w-full cursor-pointer overflow-hidden rounded-[inherit] text-left"
			>
				{/* On the header row, not the card: a grown card keeps its rows clear. */}
				<Ornament kind={props.ornament ?? "check"} />
				<div data-slot="option-card-row" class="flex w-full items-center gap-3.5 p-3.5">
					<OptionIconWell icon={props.icon} image={props.iconImage} />
					<div class="flex min-w-0 flex-1 flex-col gap-0.5">
						<span data-slot="option-card-title" class="font-semibold text-[15px] leading-snug">
							{props.title}
						</span>
						<Show when={props.description}>
							{(description) => (
								<span
									data-slot="option-card-description"
									class="text-muted-foreground text-sm leading-normal"
								>
									{description()}
								</span>
							)}
						</Show>
					</div>
				</div>
			</RadioGroupItem>
			<Show when={kids.toArray().length > 0}>
				<div data-slot="option-card-drawer" class={OPTION_CARD_DRAWER}>
					<div class="min-h-0 overflow-hidden">
						{/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is always radiogroup or group, both take aria-label */}
						<div
							role={choices().length > 0 ? "radiogroup" : "group"}
							aria-label={`${props.title} options`}
							class={OPTION_CARD_DRAWER_CONTENT}
							classList={{ [STAGGER]: checked() }}
						>
							{kids()}
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}

function OptionIconWell(props: { icon?: string; image?: string }) {
	return (
		<Show when={props.icon || props.image}>
			<span
				data-slot="option-card-icon"
				aria-hidden="true"
				class="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[color-mix(in_oklab,var(--surface-tone)_80%,black)] text-white"
			>
				<Show
					when={props.image}
					fallback={
						<Show when={props.icon}>{(icon) => <Icon icon={icon()} width={20} height={20} />}</Show>
					}
				>
					{(src) => <img src={src()} alt="" class="size-5 object-contain" />}
				</Show>
			</span>
		</Show>
	);
}

/** @deprecated OptionCard carries the same props; HeroOption is an alias. */
export const HeroOption = OptionCard;
