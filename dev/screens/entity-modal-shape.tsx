import { createSignal, createUniqueId, For, Match, Switch as SwitchFlow } from "solid-js";
import {
	Alert,
	AreaPicker,
	Badge,
	Button,
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	type EntityViewLike,
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSubGroup,
	FieldTitle,
	Icon,
	Input,
	ListRow,
	PageHeader,
	ResponsiveDialog,
	ResponsiveDialogBody,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	SectionCard,
	SectionIcon,
	SectionRowSkeletons,
	Slider,
	Switch,
} from "../../src/solid";
import { DEMO_AREAS, DEMO_BY_ID, DemoHost } from "../fixtures";

const STATE_WORDS: Record<string, string> = {
	on: "On",
	off: "Off",
	playing: "Playing",
	paused: "Paused",
	idle: "Idle",
};

function stateLabel(entity: EntityViewLike): string {
	if (entity.unitOfMeasurement) return `${entity.state} ${entity.unitOfMeasurement}`;
	return STATE_WORDS[entity.state] ?? entity.state;
}

const LIVING_ROOM = DEMO_AREAS.find((area) => area.id === "living_room");

const LIVING_ROOM_ENTITIES: EntityViewLike[] = (LIVING_ROOM?.entityIds ?? []).flatMap((id) => {
	const entity = DEMO_BY_ID.get(id);
	return entity ? [entity] : [];
});

const LIST_STATES = ["loaded", "empty", "loading"] as const;
type ListState = (typeof LIST_STATES)[number];

const STATE_CHIP: Record<ListState, string> = {
	loaded: "Loaded",
	empty: "Empty",
	loading: "Loading",
};

/** The modal form: header media, a body that IS the form, a footer submit
 *  reaching it through `form=`. Nothing wraps the fields in between. */
export function ModalForm(props: {
	entity: EntityViewLike;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const formId = createUniqueId();
	const roomLabelId = createUniqueId();
	const [room, setRoom] = createSignal(props.entity.areaId ?? "");
	const [onDashboard, setOnDashboard] = createSignal(true);

	return (
		<ResponsiveDialog open={props.open} onOpenChange={props.onOpenChange}>
			<ResponsiveDialogContent size="lg">
				<ResponsiveDialogHeader
					media={
						<SectionIcon
							icon={props.entity.icon ?? "mdi:lightbulb"}
							size="md"
							tone="var(--primary)"
						/>
					}
					action={<Badge tone="var(--success)">{stateLabel(props.entity)}</Badge>}
				>
					<ResponsiveDialogTitle>{props.entity.name}</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Signify Hue White · last seen a moment ago
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<ResponsiveDialogBody
					as="form"
					id={formId}
					onSubmit={(event: SubmitEvent) => {
						event.preventDefault();
						props.onOpenChange(false);
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel for={`${formId}-name`}>Name</FieldLabel>
							<Input id={`${formId}-name`} value={props.entity.name} />
						</Field>

						<Field>
							<FieldTitle id={roomLabelId}>Room</FieldTitle>
							<AreaPicker value={room()} onChange={setRoom} aria-labelledby={roomLabelId} />
						</Field>

						<Field orientation="horizontal">
							<FieldContent>
								<FieldTitle>Show on the dashboard</FieldTitle>
								<FieldDescription>
									Off keeps it working, and takes its tile off the home screen.
								</FieldDescription>
							</FieldContent>
							<Switch checked={onDashboard()} onChange={setOnDashboard} />
						</Field>

						<FieldSubGroup>
							<Field orientation="horizontal">
								<FieldContent>
									<FieldTitle>Count it in the room summary</FieldTitle>
								</FieldContent>
								<Switch defaultChecked />
							</Field>
						</FieldSubGroup>

						<Field>
							<FieldTitle>Brightness when it turns on</FieldTitle>
							<Slider defaultValue={[62]} aria-label="Brightness when it turns on" />
							<FieldDescription>
								Evening scenes set their own level and ignore this one.
							</FieldDescription>
						</Field>

						<Alert tone="info" title="Everyone at home sees this change">
							Names and rooms are shared, so Daniel's phone renames it too.
						</Alert>
					</FieldGroup>
				</ResponsiveDialogBody>

				<ResponsiveDialogFooter>
					<ResponsiveDialogClose>Cancel</ResponsiveDialogClose>
					<Button type="submit" form={formId}>
						Save changes
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

/** One list, three states. The header is authored once, so the loaded, empty
 *  and loading columns are the same list and not three lists. */
export function ListTriad(props: { entities: EntityViewLike[]; onOpen?: (id: string) => void }) {
	return (
		<div class="grid items-start gap-4 lg:grid-cols-3">
			<For each={LIST_STATES}>
				{(state) => (
					<SectionCard
						icon="mdi:sofa"
						title="Living Room"
						subtitle="Devices in this room"
						count={state === "loaded" ? props.entities.length : undefined}
						action={<Badge tone="var(--muted-foreground)">{STATE_CHIP[state]}</Badge>}
					>
						<SwitchFlow>
							<Match when={state === "loaded"}>
								<div class="flex flex-col gap-2">
									<For each={props.entities}>
										{(entity) => (
											<ListRow
												leading={<SectionIcon icon={entity.icon ?? "mdi:help-circle"} size="sm" />}
												title={entity.name}
												subtitle={entity.id}
												meta={stateLabel(entity)}
												openLabel={`Open ${entity.name}`}
												onOpen={() => props.onOpen?.(entity.id)}
											/>
										)}
									</For>
								</div>
							</Match>
							<Match when={state === "empty"}>
								<Empty>
									<EmptyHeader>
										<EmptyMedia media="icon">
											<Icon icon="lucide:plug-zap" />
										</EmptyMedia>
										<EmptyTitle>No devices here yet</EmptyTitle>
										<EmptyDescription>
											Move a lamp or a speaker into this room and it turns up here.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button size="sm">
											<Icon icon="lucide:plus" width={16} height={16} />
											Move a device here
										</Button>
									</EmptyContent>
								</Empty>
							</Match>
							<Match when={state === "loading"}>
								<SectionRowSkeletons count={props.entities.length} />
							</Match>
						</SwitchFlow>
					</SectionCard>
				)}
			</For>
		</div>
	);
}

export default function EntityModalShape() {
	const [openId, setOpenId] = createSignal<string | null>("light.sofa");
	const entity = () => DEMO_BY_ID.get(openId() ?? "") ?? LIVING_ROOM_ENTITIES[0];

	return (
		<DemoHost>
			<div
				data-screen="entity-modal-shape"
				class="flex min-h-screen flex-col gap-4 px-4 pt-5 pb-8 sm:gap-5 sm:px-6 sm:pt-8"
			>
				<PageHeader
					icon="mdi:sofa"
					title="Living Room"
					count={LIVING_ROOM_ENTITIES.length}
					subtitle="Everything in here is reachable"
					actions={
						<Button
							size="sm"
							aria-label="Sofa Lamp settings"
							onClick={() => setOpenId("light.sofa")}
						>
							<Icon icon="lucide:settings-2" width={16} height={16} />
							<span class="hidden sm:inline">Sofa Lamp</span>
						</Button>
					}
				/>
				<ListTriad entities={LIVING_ROOM_ENTITIES} onOpen={setOpenId} />
				<SwitchFlow>
					<Match when={entity()}>
						{(open) => (
							<ModalForm
								entity={open()}
								open={openId() !== null}
								onOpenChange={(next) => setOpenId(next ? openId() : null)}
							/>
						)}
					</Match>
				</SwitchFlow>
			</div>
		</DemoHost>
	);
}
