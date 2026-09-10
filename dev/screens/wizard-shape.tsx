import { createSignal, For, Show } from "solid-js";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	Icon,
	OptionCard,
	OptionCardGroup,
	OptionChoice,
	SectionMeta,
	SectionTitle,
	StepIndicator,
} from "../../src/solid";
import { DEMO_AREAS, DEMO_PEOPLE } from "../fixtures";

export interface StepSubChoice {
	value: string;
	label: string;
	hint?: string;
	icon?: string;
}

export interface StepOption {
	value: string;
	title: string;
	description: string;
	icon: string;
	subChoices?: StepSubChoice[];
}

/** One step of a setup flow: where you are, what the step decides, the choice
 *  itself, and the pair of actions that leave the step. */
export function ChoiceStep(props: {
	count: number;
	index: number;
	title: string;
	description: string;
	options: StepOption[];
	value: string;
	onChange: (value: string) => void;
	subValue: string;
	onSubChange: (value: string) => void;
	backLabel: string;
	onBack: () => void;
	continueLabel: string;
	onContinue: () => void;
	class?: string;
}) {
	return (
		<Card padding="md" class={props.class}>
			<StepIndicator count={props.count} index={props.index} />
			<CardHeader>
				<SectionTitle>{props.title}</SectionTitle>
				<CardDescription>{props.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<OptionCardGroup value={props.value} onChange={props.onChange} aria-label={props.title}>
					<For each={props.options}>
						{(option) => (
							<OptionCard
								value={option.value}
								title={option.title}
								description={option.description}
								icon={option.icon}
								subValue={props.subValue}
								onSubChange={props.onSubChange}
							>
								<For each={option.subChoices ?? []}>
									{(choice) => (
										<OptionChoice
											value={choice.value}
											label={choice.label}
											hint={choice.hint}
											icon={choice.icon}
										/>
									)}
								</For>
							</OptionCard>
						)}
					</For>
				</OptionCardGroup>
			</CardContent>
			<CardFooter class="justify-between gap-3">
				<Button variant="ghost" onClick={props.onBack}>
					<Icon icon="lucide:chevron-left" width={16} height={16} />
					{props.backLabel}
				</Button>
				<Button onClick={props.onContinue}>
					{props.continueLabel}
					<Icon icon="lucide:chevron-right" width={16} height={16} />
				</Button>
			</CardFooter>
		</Card>
	);
}

const CONNECT_OPTIONS: StepOption[] = [
	{
		value: "home-assistant",
		title: "The Home Assistant already in my home",
		description: "GlassHome reads your rooms and devices from it. Nothing moves or changes.",
		icon: "lucide:house-plug",
		subChoices: [
			{
				value: "same-network",
				label: "It is on this network",
				hint: "Found at homeassistant.local",
				icon: "lucide:wifi",
			},
			{
				value: "cloud",
				label: "Through Nabu Casa",
				hint: "When you are away",
				icon: "lucide:cloud",
			},
			{
				value: "address",
				label: "I will type the address",
				hint: "A fixed address or port",
				icon: "lucide:keyboard",
			},
		],
	},
	{
		value: "demo",
		title: "Look around a furnished home first",
		description: `A pretend house with a ${DEMO_AREAS.map((area) => area.name.toLowerCase()).join(", ")}. Your own home is untouched.`,
		icon: "lucide:sparkles",
	},
	{
		value: "later",
		title: "Decide later",
		description: "GlassHome opens on an empty dashboard and asks again when you are ready.",
		icon: "lucide:clock",
	},
];

export default function WizardShape() {
	const [choice, setChoice] = createSignal("home-assistant");
	const [subChoice, setSubChoice] = createSignal("same-network");
	const owner = DEMO_PEOPLE[0];

	return (
		<div
			data-screen="wizard-shape"
			class="flex min-h-screen w-full flex-col items-center justify-center gap-4 p-4 sm:gap-6 sm:p-8"
		>
			<Show when={owner}>
				{(person) => <SectionMeta>{`Setting up the Ellis home as ${person().name}`}</SectionMeta>}
			</Show>
			<ChoiceStep
				count={5}
				index={1}
				title="Where does your home live?"
				description="GlassHome does not run your home, it draws it. Point it at the system that already does."
				options={CONNECT_OPTIONS}
				value={choice()}
				onChange={setChoice}
				subValue={subChoice()}
				onSubChange={setSubChoice}
				backLabel="Back"
				onBack={() => {}}
				continueLabel="Continue"
				onContinue={() => {}}
				class="w-full max-w-lg"
			/>
		</div>
	);
}
