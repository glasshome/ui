import { createSignal } from "solid-js";
import type { ExtendedJSONSchema } from "../../src/solid";
import {
	Checkbox,
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldSubGroup,
	FieldTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	HeroAction,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
	Label,
	NumberField,
	OptionCard,
	OptionCardGroup,
	OptionChoice,
	PasswordInput,
	RadioGroup,
	RadioGroupItem,
	SchemaForm,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
	Switch,
	SwitchRow,
	Textarea,
} from "../../src/solid";
import { Icon } from "../../src/solid/icon.js";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

/* Wire shape the SDK's field.list(field.variants(...)) serializes to. */
const flowNodesSchema: ExtendedJSONSchema = {
	type: "array",
	title: "Flow nodes",
	minItems: 2,
	maxItems: 4,
	formType: "list",
	addLabel: "Add node",
	labelField: "label",
	items: {
		formType: "variants",
		discriminator: "kind",
		title: "Type",
		labels: { input: "Input", output: "Output" },
		default: { kind: "input", weight: 1 },
		oneOf: [
			{
				type: "object",
				properties: {
					kind: { type: "string", const: "input" },
					label: { type: "string", title: "Label" },
					weight: { type: "number", title: "Weight", default: 1 },
				},
			},
			{
				type: "object",
				properties: {
					kind: { type: "string", const: "output" },
					label: { type: "string", title: "Label" },
					remainder: { type: "boolean", title: "Remainder node", default: false },
				},
			},
		],
	} satisfies ExtendedJSONSchema,
};

export function FormsCatalog() {
	const [checked, setChecked] = createSignal(true);
	const [radio, setRadio] = createSignal("comfortable");
	const [door, setDoor] = createSignal<string | null>("invite");
	const [codeLength, setCodeLength] = createSignal<string | undefined>("6");
	const [switchOn, setSwitchOn] = createSignal(true);
	const [fieldSwitch, setFieldSwitch] = createSignal(true);
	const [limitDashboards, setLimitDashboards] = createSignal(true);
	const [livingRoom, setLivingRoom] = createSignal(true);
	const [kitchen, setKitchen] = createSignal(false);
	const [slider, setSlider] = createSignal([60]);
	const [range, setRange] = createSignal([35, 72]);
	const [setpoints, setSetpoints] = createSignal([12, 30]);
	const [boilerTarget, setBoilerTarget] = createSignal([52]);
	const [otp, setOtp] = createSignal("12");
	const [fruit, setFruit] = createSignal<string | null>("Banana");
	const [schemaData, setSchemaData] = createSignal<Record<string, unknown>>({
		name: "Living Room",
		brightness: 80,
		mode: "auto",
		enabled: true,
		placement: { room: "Living Room", pinned: false },
		tags: ["evening"],
	});
	const [listData, setListData] = createSignal<Record<string, unknown>>({
		nodes: [
			{ kind: "input", label: "Solar", weight: 2 },
			{ kind: "output", label: "House", remainder: true },
		],
	});

	return (
		<CatalogGroup id="cat-forms" title="Forms & Inputs">
			<Specimen name="Input">
				<Input placeholder="you@example.com" />
				<Input value="disabled" disabled />
				<Input aria-invalid="true" value="invalid" />
			</Specimen>

			<Specimen name="NumberField">
				<NumberField value={3} min={0} max={10} />
				<NumberField value={1.5} step="any" />
			</Specimen>

			<Specimen name="Textarea">
				<Textarea placeholder="Write a message..." class="w-full" />
			</Specimen>

			<Specimen name="Label">
				<div class="flex flex-col gap-1.5">
					<Label for="lbl-demo">Display name</Label>
					<Input id="lbl-demo" placeholder="Ada Lovelace" />
				</div>
			</Specimen>

			<Specimen name="Field" span={2}>
				<FieldSet class="w-full">
					<FieldLegend>Profile</FieldLegend>
					<FieldGroup>
						<Field>
							<FieldLabel for="fld-name">Name</FieldLabel>
							<Input id="fld-name" placeholder="Ada Lovelace" />
							<FieldDescription>Shown on your public profile.</FieldDescription>
						</Field>
						<FieldSeparator>then</FieldSeparator>
						<Field orientation="horizontal">
							<FieldContent>
								<FieldTitle>Notifications</FieldTitle>
								<FieldDescription>Email me about account activity.</FieldDescription>
							</FieldContent>
							<Switch checked={fieldSwitch()} onChange={setFieldSwitch} />
						</Field>
						<Field data-invalid="true">
							<FieldLabel for="fld-email">Email</FieldLabel>
							<Input id="fld-email" aria-invalid="true" value="not-an-email" />
							<FieldError errors={[{ message: "Enter a valid email address." }]} />
						</Field>
					</FieldGroup>
				</FieldSet>
			</Specimen>

			<Specimen name="FieldSubGroup" span={2}>
				<div class="w-full">
					<SwitchRow
						label="Only some dashboards"
						checked={limitDashboards()}
						onChange={setLimitDashboards}
					/>
					<FieldSubGroup>
						<SwitchRow label="Living room" checked={livingRoom()} onChange={setLivingRoom} />
						<SwitchRow label="Kitchen" checked={kitchen()} onChange={setKitchen} />
					</FieldSubGroup>
				</div>
			</Specimen>

			<Specimen name="InputGroup" span={2}>
				<Axis of="align">
					<InputGroup>
						<InputGroupAddon>
							<Icon icon="lucide:search" width={16} height={16} />
						</InputGroupAddon>
						<InputGroupInput placeholder="Search…" />
						<InputGroupAddon align="inline-end">
							<InputGroupButton>Go</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>https://</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput placeholder="glasshome.app" />
					</InputGroup>
					<InputGroup>
						<InputGroupTextarea placeholder="Leave a note…" />
						<InputGroupAddon align="block-end">
							<InputGroupText>0 / 280</InputGroupText>
							<InputGroupButton class="ml-auto">
								Send
								<Icon icon="lucide:arrow-right" width={16} height={16} />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</Axis>
			</Specimen>

			<Specimen name="InputOTP" state={`value: "${otp()}"`}>
				<InputOTP maxLength={6} value={otp()} onValueChange={setOtp}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
					</InputOTPGroup>
					<InputOTPSeparator />
					<InputOTPGroup>
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
			</Specimen>

			<Specimen name="Checkbox" state={checked() ? "checked" : "unchecked"}>
				<Axis of="size">
					<Checkbox checked={checked()} onChange={setChecked}>
						Accept terms
					</Checkbox>
					<Checkbox disabled>Disabled</Checkbox>
					<Checkbox size="sm" checked={checked()} onChange={setChecked}>
						Row-sized (sm)
					</Checkbox>
					<Checkbox size="sm" disabled>
						Row-sized, disabled
					</Checkbox>
				</Axis>
			</Specimen>

			<Specimen name="RadioGroup" state={`value: ${radio()}`}>
				<RadioGroup value={radio()} onChange={setRadio}>
					<RadioGroupItem value="default">Default</RadioGroupItem>
					<RadioGroupItem value="comfortable">Comfortable</RadioGroupItem>
					<RadioGroupItem value="compact">Compact</RadioGroupItem>
				</RadioGroup>
			</Specimen>

			<Specimen name="OptionCard" state={`value: ${door() ?? "none"}`}>
				<OptionCardGroup value={door()} onChange={setDoor} aria-label="How they sign in">
					<OptionCard
						value="invite"
						icon="lucide:mail"
						title="Send an invite"
						description="They set their own password from a link."
						accentVar="var(--success)"
					/>
					<OptionCard
						value="code"
						icon="lucide:key-round"
						title="Share a code"
						description="Good for someone standing next to you."
						subValue={codeLength()}
						onSubChange={setCodeLength}
					>
						<OptionChoice value="6" label="Six digits" hint="Quick to type" />
						<OptionChoice value="8" label="Eight digits" hint="Harder to guess" />
					</OptionCard>
					<OptionCard
						value="managed"
						icon="lucide:lock"
						title="Managed elsewhere"
						description="Not available on this home."
						disabled
					/>
				</OptionCardGroup>
			</Specimen>

			<Specimen name="HeroAction" span={2}>
				<Axis of="recommended">
					<HeroAction
						icon="simple-icons:homeassistant"
						title="Home Assistant"
						description="Sign in once. We never store your password."
						accentVar="oklch(0.75 0.13 226)"
						recommended
						recommendedHint="Works best when you're home"
						onClick={() => {}}
					/>
					<HeroAction
						icon="mdi:play-circle"
						title="Demo mode"
						description="Sample devices, no setup needed."
						accentVar="var(--primary)"
						onClick={() => {}}
					/>
				</Axis>
			</Specimen>

			<Specimen name="Switch" state={switchOn() ? "on" : "off"}>
				<Axis of="checked">
					<Switch checked={switchOn()} onChange={setSwitchOn} />
					<Switch defaultChecked aria-label="Uncontrolled, starts on" />
					<Switch checked={false} disabled />
				</Axis>
			</Specimen>

			<Specimen name="PasswordInput">
				<PasswordInput aria-label="Password" value="hunter2" class="w-full" />
				<PasswordInput
					aria-label="Password"
					value="hunter2"
					class="w-full"
					leading={<Icon icon="lucide:lock" width={16} height={16} />}
				/>
			</Specimen>

			<Specimen name="Slider" state={`value: ${slider()[0]}`} span={2}>
				<Axis of="value">
					<Slider value={slider()} onChange={setSlider} min={0} max={100} aria-label="Brightness" />
					<Slider
						value={range()}
						onChange={setRange}
						min={0}
						max={100}
						aria-label="Temperature range"
					/>
				</Axis>
				<Axis of="fillTone">
					<Slider
						value={boilerTarget()}
						onChange={setBoilerTarget}
						min={43}
						max={60}
						fillTone="oklch(0.66 0.19 40)"
						thumbColors={["oklch(0.66 0.19 40)"]}
						markers={[48]}
						aria-label="Water heater target"
					/>
					<Slider
						value={setpoints()}
						fillTone={["oklch(0.68 0.15 235)", "oklch(0.66 0.19 40)"]}
						onChange={setSetpoints}
						min={7}
						max={35}
						step={0.5}
						minStepsBetweenThumbs={1}
						thumbColors={["oklch(0.68 0.15 235)", "oklch(0.66 0.19 40)"]}
						markers={[21.5]}
						aria-label="Heat and cool setpoints"
					/>
				</Axis>
			</Specimen>

			<Specimen name="Select" state={`value: ${fruit()}`}>
				<Select
					value={fruit()}
					onChange={setFruit}
					options={["Apple", "Banana", "Cherry", "Elderberry"]}
					placeholder="Pick a fruit…"
					itemComponent={(itemProps) => (
						<SelectItem item={itemProps.item}>{itemProps.item.rawValue}</SelectItem>
					)}
				>
					<SelectTrigger class="w-[180px]">
						<SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
					</SelectTrigger>
					<SelectContent />
				</Select>
			</Specimen>

			<Specimen name="Form" span={2}>
				<Form class="w-full" errors={{ email: "Email is required." }}>
					<FormField name="email">
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl type="email" placeholder="you@example.com" />
							<FormDescription>We only use it for account recovery.</FormDescription>
							<FormMessage />
						</FormItem>
					</FormField>
				</Form>
			</Specimen>

			<Specimen name="SchemaForm" span={2}>
				<Axis of="formType">
					<SchemaForm
						schema={{
							type: "object",
							properties: {
								name: {
									type: "string",
									title: "Name",
									description: "Display name for this scene.",
								},
								brightness: {
									type: "integer",
									title: "Brightness",
									minimum: 0,
									maximum: 100,
									description: "Percent of full output.",
								},
								mode: { type: "string", title: "Mode", enum: ["auto", "manual", "off"] },
								enabled: { type: "boolean", title: "Enabled" },
								placement: {
									type: "object",
									title: "Placement",
									description: "Where the scene shows up in the app.",
									properties: {
										room: { type: "string", title: "Room" },
										pinned: { type: "boolean", title: "Pinned to the top" },
									},
								},
								tags: { type: "array", title: "Tags", items: { type: "string" } },
							},
						}}
						data={schemaData()}
						onChange={setSchemaData}
					/>
					<SchemaForm
						schema={{ type: "object", properties: { nodes: flowNodesSchema } }}
						data={listData()}
						onChange={setListData}
					/>
				</Axis>
			</Specimen>
		</CatalogGroup>
	);
}
