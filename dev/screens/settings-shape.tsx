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
	FieldContent,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
	Switch,
	SwitchRow,
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

const THEMES = ["Follow the sun", "Always dark", "Always light"];

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
	const toggle = (id: string, next: boolean) =>
		setShown((ids) => (next ? [...ids, id] : ids.filter((value) => value !== id)));

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
							leading={<SectionIcon icon={area.icon ?? "mdi:home-outline"} size="sm" />}
							title={area.name}
							subtitle={`${area.entityIds.length} devices`}
							actions={
								<Switch
									checked={shown().includes(area.id)}
									onChange={(next) => toggle(area.id, next)}
									aria-label={`Show ${area.name}`}
								/>
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
							subtitle={index() === 0 ? "Signed in on this display" : "Phone and tablet"}
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
	const [theme, setTheme] = createSignal<string | null>("Follow the sun");
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
				<FieldGroup
					legend="Appearance"
					description="How the dashboard looks on this screen. Every other phone and tablet keeps its own setting."
				>
					<Field orientation="responsive">
						<FieldContent>
							<FieldTitle>Theme</FieldTitle>
							<FieldDescription>
								Dark after sunset and light through the day, or pick one and keep it.
							</FieldDescription>
						</FieldContent>
						<Select
							value={theme()}
							onChange={setTheme}
							options={THEMES}
							placeholder="Pick a theme"
							itemComponent={(itemProps) => (
								<SelectItem item={itemProps.item}>{itemProps.item.rawValue}</SelectItem>
							)}
						>
							<SelectTrigger aria-label="Theme">
								<SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
							</SelectTrigger>
							<SelectContent />
						</Select>
					</Field>

					<SwitchRow
						label="Dim after bedtime"
						description="From 10pm the screen fades down so it does not light the hallway."
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

				<FieldGroup
					legend="What this display shows"
					description="Only these rooms get a place on the dashboard. The rest stay one tap away in search."
				>
					<Field>
						<FieldTitle id="display-rooms">Rooms on this display</FieldTitle>
						<AreaPicker
							values={rooms()}
							onValuesChange={setRooms}
							aria-labelledby="display-rooms"
							placeholder="Pick rooms"
						/>
						<FieldDescription>
							Leave it empty to show the whole house, room by room, in the order above.
						</FieldDescription>
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
