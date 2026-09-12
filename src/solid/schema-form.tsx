import type { JSONSchema7 } from "json-schema";
import { createMemo, createSignal, For, Index, Match, Show, Switch as SwitchFlow } from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { SETTLE_MOTION } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import { Alert } from "./alert.js";
import { AreaPicker } from "./area-picker.js";
import { Badge } from "./badge.js";
import { Button } from "./button.js";
import { Card } from "./card.js";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible.js";
import { EntitySelector } from "./entity-selector.js";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "./field.js";
import { Icon } from "./icon.js";
import { IconPicker, type IconPickerProps } from "./icon-picker.js";
import { ImagePicker } from "./image-picker.js";
import { Input } from "./input.js";
import { createListReorder } from "./list-reorder.js";
import { useMediaStore } from "./media-store.js";
import { NumberField } from "./number-field.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select.js";
import { Switch } from "./switch.js";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group.js";

export interface ExtendedJSONSchema extends JSONSchema7 {
	/* Nested schemas carry the same extensions, so a whole tree types as one. */
	properties?: { [key: string]: ExtendedJSONSchema | boolean };
	items?: ExtendedJSONSchema | (ExtendedJSONSchema | boolean)[] | boolean;
	/** Explicit control choice from the SDK's field.* helpers. */
	formType?: string;
	domain?: string;
	singleSelect?: boolean;
	deviceClass?: string;
	/** formType "variants": the property that selects the active branch. */
	discriminator?: string;
	/** formType "variants": kind → display name for the discriminator Select. */
	labels?: Record<string, string>;
	/** formType "list": add-button caption. */
	addLabel?: string;
	/** formType "list": item field whose value captions the collapsed row. */
	labelField?: string;
}

/**
 * formType values with a dedicated renderer branch. Any other formType renders
 * a read-only "needs a newer dashboard" notice instead of a broken control
 * (widgets auto-update independently of the host, so an old host WILL meet
 * schemas with formTypes it predates). Kept in lockstep with the SDK's field
 * helpers by dash's formType parity test.
 */
export const SCHEMA_FORM_FORM_TYPES = [
	"icon-picker",
	"image-picker",
	"area-picker",
	"list",
	"variants",
] as const;

const warnedLegacyAreaKeys = new Set<string>();

/**
 * @deprecated Removed in the next major. Before the SDK had `field.area()`,
 * an area picker was inferred from the property name alone, so a field had to
 * be called `areaId` to get one and any other name silently rendered a text
 * input. Declare `field.area()` instead — it works under any name.
 */
function isLegacyAreaKey(key: string, prop: ExtendedJSONSchema): boolean {
	const lower = key.toLowerCase();
	if (prop.type !== "string" || (lower !== "areaid" && lower !== "area_id")) return false;
	const isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
	if (isDev && !warnedLegacyAreaKeys.has(key)) {
		warnedLegacyAreaKeys.add(key);
		console.warn(
			`[SchemaForm] "${key}" renders an area picker because of its name. That fallback is removed in the next major; declare it with field.area() instead. https://glasshome.app/docs/widget-sdk/config`,
		);
	}
	return true;
}

function isKnownFormType(prop: ExtendedJSONSchema): boolean {
	return (
		prop.formType === undefined ||
		(SCHEMA_FORM_FORM_TYPES as readonly string[]).includes(prop.formType)
	);
}

function schemaOf(definition: unknown): ExtendedJSONSchema {
	return typeof definition === "object" && definition !== null
		? (definition as ExtendedJSONSchema)
		: {};
}

function itemsOf(prop: ExtendedJSONSchema): ExtendedJSONSchema {
	return Array.isArray(prop.items) ? {} : schemaOf(prop.items);
}

function propertiesOf(prop: ExtendedJSONSchema): Array<[string, ExtendedJSONSchema]> {
	return Object.entries(prop.properties ?? {}).map(([key, sub]) => [key, schemaOf(sub)]);
}

function isEntityArray(prop: ExtendedJSONSchema): boolean {
	return prop.type === "array" && itemsOf(prop).type === "string" && prop.domain !== undefined;
}

function isStringArray(prop: ExtendedJSONSchema): boolean {
	return prop.type === "array" && itemsOf(prop).type === "string";
}

function isChoiceArray(prop: ExtendedJSONSchema): boolean {
	return prop.type === "array" && itemsOf(prop).enum !== undefined;
}

function isObjectGroup(prop: ExtendedJSONSchema): boolean {
	return prop.type === "object" && prop.properties !== undefined && prop.formType === undefined;
}

function recordOf(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

/** Property defaults declared on the wire (`default`), plus `const` seeds
 * (a variant branch's discriminator literal serializes as `const`). */
function propertyDefaults(branch: ExtendedJSONSchema): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, sub] of propertiesOf(branch)) {
		if (sub.const !== undefined) out[key] = structuredClone(sub.const);
		else if (sub.default !== undefined) out[key] = structuredClone(sub.default);
	}
	return out;
}

/**
 * New-item defaults from the wire schema: the serialized `default` when the
 * SDK provided one (field.variants always does), else property defaults; for
 * a variants item without a default, the first branch seeded by its
 * discriminator const.
 */
export function extractItemDefaults(schema: ExtendedJSONSchema): Record<string, unknown> {
	if (schema.default !== undefined) return recordOf(structuredClone(schema.default));
	const branches = variantBranches(schema);
	const first = branches[0];
	if (first) return propertyDefaults(first);
	return propertyDefaults(schema);
}

function variantBranches(schema: ExtendedJSONSchema): ExtendedJSONSchema[] {
	const raw = schema.oneOf ?? schema.anyOf ?? [];
	return raw.map(schemaOf).filter((b) => b.properties !== undefined);
}

function branchKind(branch: ExtendedJSONSchema, discriminator: string): string {
	const disc = schemaOf(branch.properties?.[discriminator]);
	return typeof disc.const === "string" ? disc.const : "";
}

/**
 * Switching kind keeps current values for keys the new branch also declares
 * (matched by name) and drops the rest; missing keys take the branch defaults.
 */
export function switchVariantValue(
	branch: ExtendedJSONSchema,
	discriminator: string,
	kind: string,
	current: Record<string, unknown>,
): Record<string, unknown> {
	const next = propertyDefaults(branch);
	for (const [key] of propertiesOf(branch)) {
		if (key === discriminator) continue;
		if (key in current && current[key] !== undefined) next[key] = current[key];
	}
	next[discriminator] = kind;
	return next;
}

interface SchemaFormProps {
	schema: ExtendedJSONSchema;
	data: Record<string, unknown>;
	onChange: (data: Record<string, unknown>) => void;
	errors?: string[];
	/** Passed through to IconPicker for formType: "icon-picker" fields. */
	searchIcons?: IconPickerProps["searchIcons"];
	class?: string;
}

export function SchemaForm(props: SchemaFormProps) {
	const properties = () => {
		const schema = props.schema;
		if (schema.type !== "object" || !schema.properties) return [];
		return propertiesOf(schema);
	};

	// Controlled: props.data is the single source of truth, so parent-driven
	// revert/reset/widget-switch reaches the visible form (audit finding #33).
	const updateField = (key: string, value: unknown) => {
		props.onChange({ ...props.data, [key]: value });
	};

	return (
		<div class={cn("flex w-full min-w-0 flex-col gap-6", props.class)} data-slot="schema-form">
			<For each={properties()}>
				{([key, prop]) => (
					<LabeledField
						id={key}
						name={key}
						prop={prop}
						value={props.data[key]}
						onChange={(value) => updateField(key, value)}
						searchIcons={props.searchIcons}
					/>
				)}
			</For>

			<Show when={props.errors && props.errors.length > 0}>
				<Alert tone="destructive" title="Validation errors">
					<ul class="flex list-inside list-disc flex-col gap-1">
						<For each={props.errors}>{(err) => <li>{err}</li>}</For>
					</ul>
				</Alert>
			</Show>
		</div>
	);
}

interface FieldProps {
	/** Unique control id (dot-path for nested fields). */
	id: string;
	/** Property key: label fallback and the legacy areaId heuristic. */
	name: string;
	prop: ExtendedJSONSchema;
	value: unknown;
	onChange: (value: unknown) => void;
	searchIcons?: IconPickerProps["searchIcons"];
	/** Id of the FieldLabel naming this control, for the kinds that render no
	 *  element carrying `id`. */
	labelledBy?: string;
	/**
	 * This field is the root of a list item: the item Card is already its
	 * container and its header row already captions it, so a group renders its
	 * properties bare. Never forwarded down, so a group nested below the item
	 * root keeps the box that delimits it.
	 */
	bare?: boolean;
}

/* The dispatch, as data: first match wins, and the same answer decides how the
 * label reaches the control. Order is the contract (a legacy areaId key is a
 * string like any other, so it has to be asked about before `enum`/`type`). */
type ControlKind =
	| "unknown"
	| "list"
	| "variants"
	| "entities"
	| "icon"
	| "image"
	| "area"
	| "enum"
	| "boolean"
	| "number"
	| "choices"
	| "strings"
	| "group"
	| "text";

const CONTROL_KINDS: ReadonlyArray<
	readonly [ControlKind, (prop: ExtendedJSONSchema, name: string) => boolean]
> = [
	["unknown", (prop) => !isKnownFormType(prop)],
	["list", (prop) => prop.formType === "list"],
	["variants", (prop) => prop.formType === "variants"],
	["entities", (prop) => isEntityArray(prop)],
	["icon", (prop) => prop.formType === "icon-picker"],
	["image", (prop) => prop.formType === "image-picker"],
	["area", (prop, name) => prop.formType === "area-picker" || isLegacyAreaKey(name, prop)],
	["enum", (prop) => prop.enum !== undefined],
	["boolean", (prop) => prop.type === "boolean"],
	["number", (prop) => prop.type === "number" || prop.type === "integer"],
	["choices", (prop) => isChoiceArray(prop)],
	["strings", (prop) => isStringArray(prop)],
	["group", (prop) => isObjectGroup(prop)],
];

function controlKind(prop: ExtendedJSONSchema, name: string): ControlKind {
	return CONTROL_KINDS.find(([, matches]) => matches(prop, name))?.[0] ?? "text";
}

/* `for` only where the control really renders an element carrying the field id;
 * a picker trigger or a composite group is named by aria-labelledby instead, so
 * no label points at nothing. `none`: nothing focusable to name. */
const LABEL_TARGET: Record<ControlKind, "for" | "labelledby" | "none"> = {
	text: "for",
	image: "for",
	number: "for",
	entities: "labelledby",
	icon: "labelledby",
	area: "labelledby",
	enum: "labelledby",
	boolean: "labelledby",
	list: "labelledby",
	variants: "labelledby",
	choices: "labelledby",
	strings: "labelledby",
	unknown: "none",
	group: "none",
};

/* A hint belongs to the label above it, not to the control below: under the
 * control it reads as the next field's. Groups carry their own caption. */
function LabeledField(props: FieldProps) {
	const kind = () => controlKind(props.prop, props.name);
	const labelId = () => `${props.id}-label`;
	const target = () => LABEL_TARGET[kind()];
	return (
		<Show when={kind() !== "group"} fallback={<FieldControl {...props} />}>
			<Field>
				<FieldLabel id={labelId()} for={target() === "for" ? props.id : undefined}>
					{props.prop.title || props.name}
				</FieldLabel>
				<Show when={props.prop.description}>
					{(description) => <FieldDescription>{description()}</FieldDescription>}
				</Show>
				<FieldControl {...props} labelledBy={target() === "labelledby" ? labelId() : undefined} />
			</Field>
		</Show>
	);
}

/** The one recursive dispatch: every nesting level renders through here. */
function FieldControl(props: FieldProps) {
	const current = () => props.value ?? props.prop.default;
	const enumLabel = (value: string) => props.prop.labels?.[value] ?? value;
	const kind = () => controlKind(props.prop, props.name);
	return (
		<SwitchFlow
			fallback={
				<Input
					id={props.id}
					type="text"
					value={String(current() ?? "")}
					onInput={(e) => props.onChange(e.currentTarget.value)}
				/>
			}
		>
			<Match when={kind() === "unknown"}>
				<Alert tone="info" data-slot="schema-form-unknown">
					This setting needs a newer dashboard version to be edited here.
				</Alert>
			</Match>
			<Match when={kind() === "list"}>
				<ListControl {...props} />
			</Match>
			<Match when={kind() === "variants"}>
				<VariantsControl {...props} />
			</Match>
			<Match when={kind() === "entities"}>
				<EntitySelector
					aria-labelledby={props.labelledBy}
					entityIds={(current() as string[]) ?? []}
					onEntityIdsChange={(ids) => props.onChange(ids)}
					domain={props.prop.domain ?? ""}
					deviceClass={props.prop.deviceClass}
					multiple={props.prop.singleSelect !== true}
				/>
			</Match>
			<Match when={kind() === "icon"}>
				<IconPicker
					aria-labelledby={props.labelledBy}
					value={String(current() ?? "")}
					onChange={(val) => props.onChange(val)}
					searchIcons={props.searchIcons}
				/>
			</Match>
			<Match when={kind() === "image"}>
				<ImagePicker
					id={props.id}
					value={String(current() ?? "")}
					onChange={(val) => props.onChange(val)}
				/>
			</Match>
			<Match when={kind() === "area"}>
				<AreaPicker
					aria-labelledby={props.labelledBy}
					value={String(current() ?? "")}
					onChange={(val) => props.onChange(val)}
				/>
			</Match>
			<Match when={kind() === "enum"}>
				<Select
					value={String(current() ?? "")}
					onChange={(val) => {
						if (val != null) props.onChange(val);
					}}
					options={(props.prop.enum ?? []).map(String)}
					itemComponent={(itemProps) => (
						<SelectItem item={itemProps.item}>
							{enumLabel(String(itemProps.item.rawValue))}
						</SelectItem>
					)}
				>
					<SelectTrigger class="w-full" aria-labelledby={props.labelledBy}>
						<SelectValue<string>>{(state) => enumLabel(state.selectedOption())}</SelectValue>
					</SelectTrigger>
					<SelectContent />
				</Select>
			</Match>
			<Match when={kind() === "boolean"}>
				<div class="flex items-center gap-3">
					<Switch
						aria-labelledby={props.labelledBy}
						checked={Boolean(current() ?? false)}
						onChange={(checked) => props.onChange(checked)}
					/>
					<span class="text-sm">{current() ? "Enabled" : "Disabled"}</span>
				</div>
			</Match>
			<Match when={kind() === "number"}>
				<NumberField
					id={props.id}
					value={Number(current() ?? 0)}
					min={props.prop.minimum}
					max={props.prop.maximum}
					step={props.prop.type === "integer" ? 1 : "any"}
					onInput={(e) => props.onChange(Number(e.currentTarget.value))}
				/>
			</Match>
			<Match when={kind() === "choices"}>
				<ChoicesControl {...props} />
			</Match>
			<Match when={kind() === "strings"}>
				<StringListField
					labelledBy={props.labelledBy}
					value={(current() as string[]) ?? []}
					onChange={(val) => props.onChange(val)}
				/>
			</Match>
			<Match when={kind() === "group"}>
				<FieldSet
					class={cn(props.bare !== true && "rounded-lg border border-border p-3")}
					data-slot="schema-form-object"
				>
					<Show when={props.bare !== true}>
						<FieldLegend variant="label">{props.prop.title || props.name}</FieldLegend>
					</Show>
					<Show when={props.prop.description}>
						{(description) => <FieldDescription>{description()}</FieldDescription>}
					</Show>
					<For each={propertiesOf(props.prop)}>
						{([subKey, subProp]) => (
							<LabeledField
								id={`${props.id}.${subKey}`}
								name={subKey}
								prop={subProp}
								value={recordOf(current())[subKey]}
								onChange={(value) => props.onChange({ ...recordOf(current()), [subKey]: value })}
								searchIcons={props.searchIcons}
							/>
						)}
					</For>
				</FieldSet>
			</Match>
		</SwitchFlow>
	);
}

/* The drop slot the drag preview opens is the list's own gap, so both faces of
 * it come from here. */
const LIST_GAP = { class: "gap-2", px: 8 } as const;

function ListControl(props: FieldProps) {
	const itemSchema = () => itemsOf(props.prop);
	const mediaStore = useMediaStore();
	const [brokenThumbs, setBrokenThumbs] = createSignal<ReadonlySet<string>>(new Set());

	// One image field is unambiguously the row's picture. Two would need the
	// author to say which, so both zero and two keep the plain text row.
	const imageKey = createMemo(() => {
		const image = propertiesOf(itemSchema()).filter(([, sub]) => sub.formType === "image-picker");
		return image.length === 1 ? image[0]?.[0] : undefined;
	});

	const thumbUrl = (item: unknown) => {
		const key = imageKey();
		const store = mediaStore;
		if (key === undefined || !store) return undefined;
		const id = recordOf(item)[key];
		if (typeof id !== "string" || id === "") return undefined;
		// A 32px row chip: the thumb variant, never the original.
		return store.url(id, "thumb");
	};

	const liveThumbUrl = (item: unknown) => {
		const url = thumbUrl(item);
		return url !== undefined && !brokenThumbs().has(url) ? url : undefined;
	};
	const items = () => {
		const value = props.value ?? props.prop.default;
		return Array.isArray(value) ? (value as unknown[]) : [];
	};
	const minItems = () => props.prop.minItems ?? 0;
	const atMax = () => props.prop.maxItems !== undefined && items().length >= props.prop.maxItems;
	const [openIndex, setOpenIndex] = createSignal(-1);

	const kindLabel = (item: unknown) => {
		const schema = itemSchema();
		if (schema.formType !== "variants" || schema.discriminator === undefined) return undefined;
		const kind = recordOf(item)[schema.discriminator];
		if (typeof kind !== "string") return undefined;
		return schema.labels?.[kind] ?? kind;
	};

	const labelFieldValue = (item: unknown): string | undefined => {
		const labelField = props.prop.labelField;
		if (labelField === undefined) return undefined;
		const value = recordOf(item)[labelField];
		if (typeof value === "string" && value.trim() !== "") return value;
		if (typeof value === "number") return String(value);
		return undefined;
	};

	const caption = (item: unknown, index: number) =>
		labelFieldValue(item) ?? kindLabel(item) ?? `Item ${index + 1}`;

	// Only a row the labelField already named has anything left for the badge.
	const badgeLabel = (item: unknown) =>
		labelFieldValue(item) === undefined ? undefined : kindLabel(item);

	const replaceAt = (index: number, value: unknown) => {
		props.onChange(items().map((item, i) => (i === index ? value : item)));
	};
	const removeAt = (index: number) => {
		props.onChange(items().filter((_, i) => i !== index));
		if (openIndex() === index) setOpenIndex(-1);
		else if (openIndex() > index) setOpenIndex(openIndex() - 1);
	};
	const reorder = (from: number, to: number) => {
		if (to === from || to < 0 || to >= items().length) return;
		const next = [...items()];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		props.onChange(next);
		const open = openIndex();
		if (open === from) setOpenIndex(to);
		else if (open !== -1) {
			if (from < open && to >= open) setOpenIndex(open - 1);
			else if (from > open && to <= open) setOpenIndex(open + 1);
		}
	};

	const listDrag = createListReorder({
		count: () => items().length,
		gapPx: LIST_GAP.px,
		onReorder: reorder,
		onDragStart: (index) => {
			if (openIndex() === index) setOpenIndex(-1);
		},
	});
	const add = () => {
		const next = [...items(), extractItemDefaults(itemSchema())];
		props.onChange(next);
		setOpenIndex(next.length - 1);
	};

	return (
		<fieldset
			aria-labelledby={props.labelledBy}
			class={cn("flex w-full min-w-0 flex-col", LIST_GAP.class)}
			data-slot="schema-form-list"
		>
			<Index each={items()}>
				{(item, index) => (
					<Card
						ref={(el: HTMLElement) => listDrag.setRowEl(index, el)}
						class={cn(
							"w-full min-w-0 overflow-hidden transition-transform duration-(--duration-state)",
							listDrag.draggingIndex() === index && "relative shadow-lg",
						)}
						style={listDrag.rowStyle(index)}
						data-slot="schema-form-list-item"
					>
						<Collapsible
							open={openIndex() === index}
							onOpenChange={(open) => {
								if (listDrag.isToggleSuppressed()) return;
								setOpenIndex(open ? index : -1);
							}}
						>
							<div
								data-slot="schema-form-list-row"
								class={cn(
									"relative flex min-h-11 select-none items-center gap-1.5 py-1 pr-1.5 pl-2",
									"transition-colors duration-(--duration-micro) hover:bg-muted/40",
								)}
								onPointerDown={(e: PointerEvent) => {
									const btn = (e.target as HTMLElement).closest("button");
									if (btn && btn.dataset.slot !== "collapsible-trigger") return;
									listDrag.startDrag(index, e, false);
								}}
							>
								{/* Invisible layer over the whole bar: clicking anywhere toggles;
								    the action buttons sit above it and win their own clicks. */}
								<CollapsibleTrigger
									class="absolute inset-0 rounded-[inherit] py-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
									aria-label={caption(item(), index)}
								/>
								<Icon
									icon="lucide:chevron-right"
									width={16}
									height={16}
									class={cn(
										"pointer-events-none relative shrink-0 text-muted-foreground transition-transform duration-(--duration-state)",
										openIndex() === index && "rotate-90",
									)}
									aria-hidden="true"
								/>
								<Show when={imageKey() !== undefined && mediaStore !== undefined}>
									<span
										class={cn(
											FIELD_CHROME,
											"pointer-events-none relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md text-muted-foreground",
										)}
										data-slot="schema-form-list-item-thumb"
									>
										<Show
											when={liveThumbUrl(item())}
											fallback={
												<Icon
													icon={
														thumbUrl(item()) === undefined ? "lucide:image" : "lucide:image-off"
													}
													width={16}
													height={16}
													aria-hidden="true"
												/>
											}
										>
											{(url) => (
												<img
													src={url()}
													alt=""
													decoding="async"
													class="absolute inset-0 h-full w-full object-cover"
													onError={() => setBrokenThumbs((broken) => new Set(broken).add(url()))}
												/>
											)}
										</Show>
									</span>
								</Show>
								<span class="pointer-events-none relative min-w-0 flex-1 truncate text-left text-sm">
									{caption(item(), index)}
								</span>
								<Show when={badgeLabel(item())}>
									{(label) => (
										<Badge class="pointer-events-none relative shrink-0">{label()}</Badge>
									)}
								</Show>
								<Button
									variant="ghost"
									size="icon"
									class="relative cursor-grab touch-none active:cursor-grabbing"
									aria-label={`Reorder ${caption(item(), index)}`}
									onPointerDown={(e: PointerEvent) => listDrag.startDrag(index, e, true)}
									onKeyDown={(e: KeyboardEvent) => {
										if (e.key === "ArrowUp") {
											e.preventDefault();
											reorder(index, index - 1);
										} else if (e.key === "ArrowDown") {
											e.preventDefault();
											reorder(index, index + 1);
										}
									}}
								>
									<Icon icon="lucide:grip-vertical" width={16} height={16} aria-hidden="true" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="relative"
									aria-label={`Remove ${caption(item(), index)}`}
									disabled={items().length <= minItems()}
									onClick={() => removeAt(index)}
								>
									<Icon icon="lucide:x" width={16} height={16} aria-hidden="true" />
								</Button>
							</div>
							<CollapsibleContent>
								<div class="border-border border-t p-3">
									<LabeledField
										id={`${props.id}.${index}`}
										name={props.name}
										prop={itemSchema()}
										value={item()}
										onChange={(value) => replaceAt(index, value)}
										searchIcons={props.searchIcons}
										bare
									/>
								</div>
							</CollapsibleContent>
						</Collapsible>
					</Card>
				)}
			</Index>
			<Show when={items().length < minItems()}>
				<p class="text-muted-foreground text-sm">
					Add at least {minItems()} {minItems() === 1 ? "item" : "items"}.
				</p>
			</Show>
			<Button
				variant="outline"
				class="w-full"
				disabled={atMax()}
				onClick={add}
				data-slot="schema-form-list-add"
			>
				<Icon icon="lucide:plus" width={16} height={16} aria-hidden="true" />
				{props.prop.addLabel ?? "Add item"}
			</Button>
		</fieldset>
	);
}

function VariantsControl(props: FieldProps) {
	const branches = () => variantBranches(props.prop);
	const discriminator = () => props.prop.discriminator ?? "";
	const kinds = () => branches().map((b) => branchKind(b, discriminator()));
	const value = () => recordOf(props.value ?? props.prop.default);
	// Memos with default === equality: typing in a field changes value() but not
	// the kind string, so the branch tuples keep their identity and the field
	// subtree is NOT remounted (a remount would drop focus on every keystroke).
	const currentKind = createMemo(() => {
		const kind = value()[discriminator()];
		if (typeof kind === "string" && kinds().includes(kind)) return kind;
		return kinds()[0] ?? "";
	});
	const currentBranch = createMemo(() =>
		branches().find((b) => branchKind(b, discriminator()) === currentKind()),
	);
	const labelFor = (kind: string) => props.prop.labels?.[kind] ?? kind;

	const switchKind = (kind: string) => {
		if (kind === currentKind()) return;
		const branch = branches().find((b) => branchKind(b, discriminator()) === kind);
		if (!branch) return;
		props.onChange(switchVariantValue(branch, discriminator(), kind, value()));
	};

	const branchFields = createMemo(() => {
		const branch = currentBranch();
		if (!branch) return [];
		return propertiesOf(branch).filter(([key]) => key !== discriminator());
	});

	return (
		<fieldset
			aria-labelledby={props.labelledBy}
			class="flex w-full min-w-0 flex-col gap-3"
			data-slot="schema-form-variants"
		>
			<Select
				value={currentKind()}
				onChange={(val) => {
					if (val != null) switchKind(val);
				}}
				options={kinds()}
				itemComponent={(itemProps) => (
					<SelectItem item={itemProps.item}>{labelFor(String(itemProps.item.rawValue))}</SelectItem>
				)}
			>
				<SelectTrigger class="w-full" aria-label={props.prop.title}>
					<SelectValue<string>>{(state) => labelFor(state.selectedOption())}</SelectValue>
				</SelectTrigger>
				<SelectContent />
			</Select>
			<Show when={currentKind()} keyed>
				{(_kind) => (
					<div class={cn(SETTLE_MOTION, "flex flex-col gap-3")}>
						<For each={branchFields()}>
							{([subKey, subProp]) => (
								<LabeledField
									id={`${props.id}.${subKey}`}
									name={subKey}
									prop={subProp}
									value={value()[subKey]}
									onChange={(fieldValue) => props.onChange({ ...value(), [subKey]: fieldValue })}
									searchIcons={props.searchIcons}
								/>
							)}
						</For>
					</div>
				)}
			</Show>
		</fieldset>
	);
}

function ChoicesControl(props: FieldProps) {
	const current = () => props.value ?? props.prop.default;
	const enumValues = () => (itemsOf(props.prop).enum ?? []).map(String);
	const labelFor = (v: string) => props.prop.labels?.[v] ?? v;

	return (
		<ToggleGroup
			multiple
			aria-labelledby={props.labelledBy}
			value={(current() as string[] | undefined) ?? []}
			onChange={(vals) => {
				const order = enumValues();
				props.onChange((vals ?? []).slice().sort((a, b) => order.indexOf(a) - order.indexOf(b)));
			}}
			class="flex flex-wrap gap-1"
		>
			<For each={enumValues()}>
				{(v) => <ToggleGroupItem value={v}>{labelFor(v)}</ToggleGroupItem>}
			</For>
		</ToggleGroup>
	);
}

function StringListField(props: {
	value: string[];
	onChange: (value: string[]) => void;
	labelledBy?: string;
}) {
	const [input, setInput] = createSignal("");

	const addItem = (item: string) => {
		const trimmed = item.trim();
		if (!trimmed || props.value.includes(trimmed)) return;
		props.onChange([...props.value, trimmed]);
		setInput("");
	};

	return (
		<fieldset
			aria-labelledby={props.labelledBy}
			class="flex min-w-0 flex-col gap-2"
			data-slot="schema-form-string-list"
		>
			<Show when={props.value.length > 0}>
				<div class="flex flex-wrap gap-1.5">
					<For each={props.value}>
						{(item) => (
							<Badge>
								{item}
								<button
									type="button"
									aria-label={`Remove ${item}`}
									onClick={() => props.onChange(props.value.filter((v) => v !== item))}
									class="cursor-pointer rounded-sm hover:text-destructive"
								>
									<Icon icon="lucide:x" width={12} height={12} aria-hidden="true" />
								</button>
							</Badge>
						)}
					</For>
				</div>
			</Show>
			<Input
				type="text"
				placeholder="Type and press Enter to add"
				value={input()}
				onInput={(e) => setInput(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						addItem(input());
					}
				}}
			/>
		</fieldset>
	);
}
