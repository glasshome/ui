import { createSignal } from "solid-js";
import {
	Button,
	LabeledField,
	LabeledIconPicker,
	LabeledInput,
	PageHeader,
	RowActions,
	SectionAddButton,
	SectionEmpty,
	SwitchRow,
	TableBulkBar,
	TableEmpty,
	TableError,
	TableFilterSelect,
	TableSearchInput,
	TableSkeleton,
	TableSortHeader,
} from "../../src/solid";
import { Icon } from "../../src/solid/icon.js";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

export function AppKitCatalog() {
	const [on, setOn] = createSignal(true);
	const [digest, setDigest] = createSignal(false);
	const [text, setText] = createSignal("");
	const [roomIcon, setRoomIcon] = createSignal("mdi:sofa");
	const [search, setSearch] = createSignal("");
	const [filter, setFilter] = createSignal("All");
	const [dir, setDir] = createSignal<"asc" | "desc">("asc");

	return (
		<CatalogGroup id="cat-appkit" title="App kit (chrome, settings + tables)">
			<Specimen name="PageHeader" span={3}>
				<div class="w-full">
					<PageHeader
						icon="lucide:layout-dashboard"
						title="Widgets"
						count={12}
						subtitle="Your published widgets"
						actions={
							<Button variant="outline" size="sm">
								New
							</Button>
						}
					/>
				</div>
			</Specimen>

			<Specimen name="SwitchRow" span={2}>
				<Axis of="description">
					<div class="w-full">
						<SwitchRow label="Enable notifications" checked={on()} onChange={setOn} />
						<SwitchRow
							label="Weekly digest"
							description="One summary of everything that happened at home."
							checked={digest()}
							onChange={setDigest}
						/>
					</div>
				</Axis>
				<Axis of="disabled">
					<div class="w-full">
						<SwitchRow
							label="Away mode"
							description="Only a household admin can change this."
							checked
							disabled
							onChange={() => {}}
						/>
					</div>
				</Axis>
			</Specimen>

			<Specimen name="LabeledInput">
				<div class="w-full">
					<LabeledInput
						label="Name"
						value={text()}
						onInput={setText}
						placeholder="Household name"
					/>
				</div>
			</Specimen>

			<Specimen name="LabeledField">
				<div class="w-full">
					<LabeledField label="Custom">
						<p class="text-muted-foreground text-sm">any children</p>
					</LabeledField>
				</div>
			</Specimen>

			<Specimen name="RowActions">
				<RowActions onEdit={() => {}} onDelete={() => {}} />
			</Specimen>

			<Specimen name="SectionAddButton">
				<SectionAddButton onClick={() => {}} />
			</Specimen>

			<Specimen name="SectionEmpty">
				<div class="w-full">
					<SectionEmpty>No schedules yet.</SectionEmpty>
				</div>
			</Specimen>

			<Specimen name="LabeledIconPicker">
				<div class="w-full">
					<LabeledIconPicker label="Icon" value={roomIcon()} onChange={setRoomIcon} />
				</div>
			</Specimen>

			<Specimen name="TableSearchInput">
				<TableSearchInput
					value={search()}
					onInput={setSearch}
					placeholder="Search…"
					label="Search"
				/>
			</Specimen>

			<Specimen name="TableFilterSelect" state={filter()}>
				<TableFilterSelect
					options={["All", "Published", "Draft"]}
					value={filter()}
					onChange={setFilter}
					label={(v) => v}
					ariaLabel="Filter"
				/>
			</Specimen>

			<Specimen name="TableSortHeader" try="Name" state={dir()}>
				<TableSortHeader
					label="Name"
					active
					dir={dir()}
					onClick={() => setDir(dir() === "asc" ? "desc" : "asc")}
				/>
			</Specimen>

			<Specimen name="TableBulkBar" span={2}>
				<div class="w-full overflow-hidden rounded-md border border-border/50">
					<TableBulkBar>
						<span class="text-muted-foreground text-xs">2 selected</span>
						<Button variant="outline" size="sm" class="ml-auto">
							Delete
						</Button>
					</TableBulkBar>
				</div>
			</Specimen>

			<Specimen name="TableEmpty">
				<TableEmpty
					icon={
						<Icon
							icon="lucide:inbox"
							width={32}
							height={32}
							class="size-8 text-muted-foreground/50"
						/>
					}
					message="No widgets yet"
					action={
						<Button variant="outline" size="sm">
							Publish one
						</Button>
					}
				/>
			</Specimen>

			<Specimen name="TableError">
				<TableError message="Failed to load." onRetry={() => {}} />
			</Specimen>

			<Specimen name="TableSkeleton" span={2}>
				<div class="w-full">
					<TableSkeleton count={3} />
				</div>
			</Specimen>
		</CatalogGroup>
	);
}
