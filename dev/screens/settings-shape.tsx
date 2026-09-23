import { createSignal, For, type JSX, Show } from "solid-js";
import {
	Alert,
	AlertDialog,
	AlertDialogAction,
	AlertDialogBody,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	AreaPicker,
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Field,
	FieldDescription,
	FieldLegend,
	FieldGroup as FieldRows,
	FieldSet,
	FieldSubGroup,
	FieldTitle,
	Icon,
	ListRow,
	PageHeader,
	RowActions,
	SectionCard,
	SectionIcon,
	SectionMeta,
	SectionRow,
	Slider,
	SwitchRow,
	ToggleGroup,
	ToggleGroupItem,
} from "../../src/solid";
import { DEMO_AREAS, DEMO_ENTITIES, DEMO_PEOPLE, DemoHost } from "../fixtures";

/** A titled group of form rows inside a card: legend, one line saying what the
 *  group decides, then the rows. */
export function FieldGroup(props: { legend: string; description?: string; children: JSX.Element }) {
	return (
		<FieldSet>
			<FieldLegend>{props.legend}</FieldLegend>
			<Show when={props.description}>
				{(description) => <FieldDescription>{description()}</FieldDescription>}
			</Show>
			{/* The package's FieldGroup owns @container/field-group, which is what a
			    Field's `responsive` orientation measures; without it every row stays stacked. */}
			<FieldRows>{props.children}</FieldRows>
		</FieldSet>
	);
}

/** The bottom of a settings page: what the action costs, said in the tone of the
 *  action, and a confirm step between the homeowner and the loss. */
export function DangerZone(props: {
	title: string;
	subtitle: string;
	warning: string;
	detail: string;
	actionLabel: string;
	confirmTitle: string;
	confirmDescription: string;
	confirmDetail: string;
	confirmLabel: string;
	onConfirm: () => void;
}) {
	return (
		<SectionCard icon="lucide:triangle-alert" title={props.title} subtitle={props.subtitle}>
			<div class="flex flex-col gap-3">
				<Alert tone="destructive" title={props.warning}>
					{props.detail}
				</Alert>
				<div class="flex justify-end">
					<AlertDialog>
						<AlertDialogTrigger as={Button} variant="destructive">
							<Icon icon="lucide:trash-2" width={16} height={16} />
							{props.actionLabel}
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{props.confirmTitle}</AlertDialogTitle>
								<AlertDialogDescription>{props.confirmDescription}</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogBody>
								<FieldDescription>{props.confirmDetail}</FieldDescription>
							</AlertDialogBody>
							<AlertDialogFooter>
								<AlertDialogCancel>Keep it</AlertDialogCancel>
								<AlertDialogAction variant="destructive" onClick={props.onConfirm}>
									{props.confirmLabel}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</SectionCard>
	);
}

const THEMES = [
	{ value: "sun", label: "Follow the sun", icon: "lucide:sun-moon" },
	{ value: "dark", label: "Always dark", icon: "lucide:moon" },
	{ value: "light", label: "Always light", icon: "lucide:sun" },
];

const CONFIRM_FIRST: Record<string, string> = {
	"switch.coffee_maker": "mdi:coffee-maker",
	"switch.tv_backlight": "mdi:television-ambient-light",
	"switch.bedroom_fan": "mdi:fan",
};

function areaName(areaId: string | null): string {
	return DEMO_AREAS.find((area) => area.id === areaId)?.name ?? "No room yet";
}

function initials(name: string): string {
	return name
		.split(" ")
		.map((part) => part.slice(0, 1))
		.join("")
		.slice(0, 1);
}

function RoomsCard() {
	const [shown, setShown] = createSignal(DEMO_AREAS.map((area) => area.id));
	const toggle = (id: string) =>
		setShown((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]));

	return (
		<SectionCard
			icon="lucide:layout-grid"
			title="Rooms"
			subtitle="Hide a room to keep it off this dashboard."
			count={DEMO_AREAS.length}
			action={
				<Button variant="outline" size="sm">
					<Icon icon="lucide:arrow-up-down" width={14} height={14} />
					Reorder
				</Button>
			}
		>
			<div class="flex flex-col gap-2">
				<For each={DEMO_AREAS}>
					{(area) => (
						<ListRow
							class={shown().includes(area.id) ? undefined : "opacity-50"}
							leading={<SectionIcon icon={area.icon ?? "mdi:home-outline"} size="sm" />}
							title={area.name}
							subtitle={`${area.entityIds.length} devices`}
							actions={
								<Button
									variant="ghost"
									size="icon"
									aria-pressed={!shown().includes(area.id)}
									aria-label={`Hide ${area.name}`}
									onClick={() => toggle(area.id)}
								>
									<Icon
										icon={shown().includes(area.id) ? "lucide:eye" : "lucide:eye-off"}
										width={18}
										height={18}
									/>
								</Button>
							}
						/>
					)}
				</For>
			</div>
		</SectionCard>
	);
}

function HouseholdCard() {
	return (
		<SectionCard
			icon="lucide:users"
			title="Household"
			subtitle="Everyone here gets their own dashboard."
			count={DEMO_PEOPLE.length}
			action={
				<Button variant="outline" size="sm">
					<Icon icon="lucide:user-plus" width={14} height={14} />
					Invite
				</Button>
			}
		>
			<div class="flex flex-col gap-2">
				<For each={DEMO_PEOPLE}>
					{(person, index) => (
						<ListRow
							leading={
								<Avatar class="size-9">
									<AvatarFallback class="text-xs">{initials(person.name)}</AvatarFallback>
								</Avatar>
							}
							title={person.name}
							badges={
								<Show when={index() === 0}>
									<Badge>Owner</Badge>
								</Show>
							}
							actions={
								<RowActions onEdit={() => {}} onDelete={() => {}} showDelete={index() > 0} />
							}
						/>
					)}
				</For>
			</div>
		</SectionCard>
	);
}

function DisplayCard() {
	const [theme, setTheme] = createSignal("sun");
	const [dims, setDims] = createSignal(true);
	const [sleeps, setSleeps] = createSignal(false);
	const [wakes, setWakes] = createSignal(true);
	const [brightness, setBrightness] = createSignal([35]);
	const [rooms, setRooms] = createSignal(["living_room", "kitchen"]);
	const level = () => brightness()[0] ?? 0;

	return (
		<SectionCard
			icon="lucide:monitor"
			title="This display"
			subtitle="The tablet on the living room wall."
		>
			<div class="flex flex-col gap-8">
				<FieldGroup legend="Appearance">
					<Field orientation="responsive">
						<FieldTitle>Theme</FieldTitle>
						<ToggleGroup
							value={theme()}
							onChange={(value) => value && setTheme(value as string)}
							aria-label="Theme"
						>
							<For each={THEMES}>
								{(option) => (
									<ToggleGroupItem value={option.value} aria-label={option.label}>
										<Icon icon={option.icon} width={16} height={16} />
									</ToggleGroupItem>
								)}
							</For>
						</ToggleGroup>
					</Field>

					<SwitchRow
						label="Dim after bedtime"
						description="From 10pm"
						checked={dims()}
						onChange={setDims}
					/>
					<FieldSubGroup>
						<SwitchRow
							label="Turn the screen off completely"
							checked={sleeps()}
							disabled={!dims()}
							onChange={setSleeps}
						/>
						<SwitchRow
							label="Wake when someone walks past"
							checked={wakes()}
							disabled={!dims()}
							onChange={setWakes}
						/>
						<SectionRow class="mt-1 flex flex-col gap-3">
							<div class="flex items-center justify-between gap-3">
								<FieldTitle>Night brightness</FieldTitle>
								<SectionMeta>{`${level()}%`}</SectionMeta>
							</div>
							<Slider
								value={brightness()}
								onChange={setBrightness}
								min={5}
								max={100}
								disabled={!dims()}
								aria-label="Night brightness"
							/>
						</SectionRow>
					</FieldSubGroup>
				</FieldGroup>

				<FieldGroup legend="What this display shows">
					<Field>
						<FieldTitle id="display-rooms">Rooms on this display</FieldTitle>
						<AreaPicker
							values={rooms()}
							onValuesChange={setRooms}
							aria-labelledby="display-rooms"
							placeholder="The whole house"
						/>
					</Field>
				</FieldGroup>
			</div>
		</SectionCard>
	);
}

function ConfirmFirstCard() {
	const devices = DEMO_ENTITIES.filter((entity) => entity.id in CONFIRM_FIRST);
	const [asking, setAsking] = createSignal(["switch.coffee_maker", "switch.bedroom_fan"]);
	const toggle = (id: string, next: boolean) =>
		setAsking((ids) => (next ? [...ids, id] : ids.filter((value) => value !== id)));

	return (
		<SectionCard
			icon="lucide:shield-check"
			title="Ask before switching"
			subtitle="These devices show a confirmation first, so a stray tap never starts them."
			count={asking().length}
		>
			<For each={devices}>
				{(device) => (
					<SwitchRow
						icon={CONFIRM_FIRST[device.id] ?? "mdi:toggle-switch"}
						label={device.name}
						description={areaName(device.areaId)}
						checked={asking().includes(device.id)}
						onChange={(next) => toggle(device.id, next)}
					/>
				)}
			</For>
		</SectionCard>
	);
}

export default function SettingsShape() {
	return (
		<DemoHost>
			<div
				data-screen="settings-shape"
				class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:gap-6 sm:p-6"
			>
				<PageHeader
					icon="lucide:settings"
					title="Settings"
					subtitle="The Ellis home"
					actions={
						<Button size="sm">
							<Icon icon="lucide:check" width={16} height={16} />
							Done
						</Button>
					}
				/>
				<RoomsCard />
				<HouseholdCard />
				<DisplayCard />
				<ConfirmFirstCard />
				<DangerZone
					title="Remove this display"
					subtitle="Only this tablet is affected. Your home, your rooms and everyone else stay exactly as they are."
					warning="This display signs out and forgets its dashboard"
					detail="The layout you arranged here, the rooms you picked and the brightness schedule are deleted."
					actionLabel="Remove display"
					confirmTitle="Remove the living room display?"
					confirmDescription="It signs out straight away and the dashboard on it is deleted."
					confirmDetail="Everyone else keeps their own dashboards. You can pair this tablet again any time, and set it up from scratch."
					confirmLabel="Remove display"
					onConfirm={() => {}}
				/>
			</div>
		</DemoHost>
	);
}
