import { ArrowRight, Search } from "lucide-solid";
import { createSignal } from "solid-js";
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
	FieldTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
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
	Textarea,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function FormsCatalog() {
	const [checked, setChecked] = createSignal(true);
	const [radio, setRadio] = createSignal("comfortable");
	const [switchOn, setSwitchOn] = createSignal(true);
	const [fieldSwitch, setFieldSwitch] = createSignal(true);
	const [slider, setSlider] = createSignal([60]);
	const [range, setRange] = createSignal([35, 72]);
	const [otp, setOtp] = createSignal("12");
	const [fruit, setFruit] = createSignal<string | null>("Banana");
	const [schemaData, setSchemaData] = createSignal<Record<string, unknown>>({
		name: "Living Room",
		brightness: 80,
		mode: "auto",
		enabled: true,
	});

	return (
		<CatalogGroup id="cat-forms" title="Forms & Inputs">
			<CatalogItem name="Input" hint="text field">
				<Input placeholder="you@example.com" />
				<Input value="disabled" disabled />
				<Input aria-invalid="true" value="invalid" />
			</CatalogItem>

			<CatalogItem name="NumberField" hint="themed stepper, no native spinner">
				<NumberField value={3} min={0} max={10} />
				<NumberField value={1.5} step="any" />
			</CatalogItem>

			<CatalogItem name="Textarea" hint="multiline">
				<Textarea placeholder="Write a message..." class="w-full" />
			</CatalogItem>

			<CatalogItem name="Label" hint="control caption">
				<div class="flex flex-col gap-1.5">
					<Label for="lbl-demo">Display name</Label>
					<Input id="lbl-demo" placeholder="Ada Lovelace" />
				</div>
			</CatalogItem>

			<CatalogItem name="Field" hint="Field / FieldSet / FieldGroup …" span={2}>
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
			</CatalogItem>

			<CatalogItem name="InputGroup" hint="addons + buttons" span={2}>
				<InputGroup>
					<InputGroupAddon>
						<Search />
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
				<CatalogNote>textarea variant, block-end addon</CatalogNote>
				<InputGroup>
					<InputGroupTextarea placeholder="Leave a note…" />
					<InputGroupAddon align="block-end">
						<InputGroupText>0 / 280</InputGroupText>
						<InputGroupButton class="ml-auto">
							Send
							<ArrowRight />
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</CatalogItem>

			<CatalogItem name="InputOTP" hint={`value: "${otp()}"`}>
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
			</CatalogItem>

			<CatalogItem name="Checkbox" hint={checked() ? "checked" : "unchecked"}>
				<Checkbox checked={checked()} onChange={setChecked}>
					Accept terms
				</Checkbox>
				<Checkbox disabled>Disabled</Checkbox>
			</CatalogItem>

			<CatalogItem name="RadioGroup" hint={`value: ${radio()}`}>
				<RadioGroup value={radio()} onChange={setRadio}>
					<RadioGroupItem value="default">Default</RadioGroupItem>
					<RadioGroupItem value="comfortable">Comfortable</RadioGroupItem>
					<RadioGroupItem value="compact">Compact</RadioGroupItem>
				</RadioGroup>
			</CatalogItem>

			<CatalogItem name="Switch" hint={switchOn() ? "on" : "off"}>
				<Switch checked={switchOn()} onChange={setSwitchOn} />
				<Switch checked={false} disabled />
			</CatalogItem>

			<CatalogItem name="Slider" hint={`value: ${slider()[0]}`}>
				<Slider value={slider()} onChange={setSlider} min={0} max={100} aria-label="Brightness" />
			</CatalogItem>

			<CatalogItem name="Slider, range" hint={`value: ${range()[0]} to ${range()[1]}`}>
				<Slider
					value={range()}
					onChange={setRange}
					min={0}
					max={100}
					aria-label="Temperature range"
				/>
			</CatalogItem>

			<CatalogItem name="Select" hint={`value: ${fruit()}`}>
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
			</CatalogItem>

			<CatalogItem name="Form" hint="context + error wiring" span={2}>
				<Form class="w-full" errors={{ email: "Email is required." }}>
					<FormField name="email">
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input type="email" placeholder="you@example.com" />
							</FormControl>
							<FormDescription>We only use it for account recovery.</FormDescription>
							<FormMessage />
						</FormItem>
					</FormField>
				</Form>
				<CatalogNote>
					Form is headless: errors come from the parent (validation lib) via the `errors` prop; the
					label, control aria-invalid, and message all react to it.
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="SchemaForm" hint="JSON Schema → controls" span={2}>
				<SchemaForm
					schema={{
						type: "object",
						properties: {
							name: { type: "string", title: "Name", description: "Display name for this scene." },
							brightness: {
								type: "integer",
								title: "Brightness",
								minimum: 0,
								maximum: 100,
							},
							mode: { type: "string", title: "Mode", enum: ["auto", "manual", "off"] },
							enabled: { type: "boolean", title: "Enabled" },
						},
					}}
					data={schemaData()}
					onChange={setSchemaData}
				/>
				<CatalogNote>
					Renders inputs from a JSON Schema (string → Input, integer → number, enum → Select,
					boolean → Switch). Entity/area branches need HA context, so they are omitted here.
				</CatalogNote>
			</CatalogItem>
		</CatalogGroup>
	);
}
