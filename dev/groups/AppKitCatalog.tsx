import { Inbox } from "lucide-solid";
import { createSignal } from "solid-js";
import {
	Button,
	LabeledField,
	LabeledInput,
	PageHeader,
	RowActions,
	SectionAddButton,
	SwitchRow,
	TableBulkBar,
	TableEmpty,
	TableError,
	TableFilterSelect,
	TableSearchInput,
	TableSkeleton,
	TableSortHeader,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function AppKitCatalog() {
	const [on, setOn] = createSignal(true);
	const [text, setText] = createSignal("");
	const [search, setSearch] = createSignal("");
	const [filter, setFilter] = createSignal("All");
	const [dir, setDir] = createSignal<"asc" | "desc">("asc");

	return (
		<CatalogGroup id="cat-appkit" title="App kit (settings + tables)">
			<CatalogItem name="PageHeader" hint="banner — icon + title + count + actions" span={3}>
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
				<CatalogNote>
					dash injects performant-blur + logo watermark via the glass/logo props
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="SwitchRow" hint="label + switch">
				<div class="w-full">
					<SwitchRow label="Enable notifications" checked={on()} onChange={setOn} />
				</div>
			</CatalogItem>

			<CatalogItem name="LabeledField / LabeledInput">
				<div class="w-full space-y-3">
					<LabeledInput
						label="Name"
						value={text()}
						onInput={setText}
						placeholder="Household name"
					/>
					<LabeledField label="Custom">
						<p class="text-muted-foreground text-sm">any children</p>
					</LabeledField>
				</div>
			</CatalogItem>

			<CatalogItem name="RowActions + SectionAddButton" hint="edit / delete · add">
				<RowActions onEdit={() => {}} onDelete={() => {}} />
				<SectionAddButton onClick={() => {}} />
			</CatalogItem>

			<CatalogItem name="Table toolbar" hint="search / filter / sort" span={2}>
				<div class="flex w-full flex-wrap items-center gap-2">
					<TableSearchInput
						value={search()}
						onInput={setSearch}
						placeholder="Search…"
						label="Search"
					/>
					<TableFilterSelect
						options={["All", "Published", "Draft"]}
						value={filter()}
						onChange={setFilter}
						label={(v) => v}
						ariaLabel="Filter"
					/>
					<TableSortHeader
						label="Name"
						active
						dir={dir()}
						onClick={() => setDir(dir() === "asc" ? "desc" : "asc")}
					/>
				</div>
			</CatalogItem>

			<CatalogItem name="TableBulkBar" hint="selection actions" span={2}>
				<div class="w-full overflow-hidden rounded-md border border-border/50">
					<TableBulkBar>
						<span class="text-muted-foreground text-xs">2 selected</span>
						<Button variant="outline" size="sm" class="ml-auto">
							Delete
						</Button>
					</TableBulkBar>
				</div>
			</CatalogItem>

			<CatalogItem name="TableEmpty" hint="empty state">
				<TableEmpty
					icon={<Inbox class="size-8 text-muted-foreground/50" />}
					message="No widgets yet"
					action={
						<Button variant="outline" size="sm">
							Publish one
						</Button>
					}
				/>
			</CatalogItem>

			<CatalogItem name="TableError" hint="inline error + retry">
				<TableError message="Failed to load." onRetry={() => {}} />
			</CatalogItem>

			<CatalogItem name="TableSkeleton" hint="loading rows" span={2}>
				<div class="w-full">
					<TableSkeleton count={3} />
				</div>
			</CatalogItem>
		</CatalogGroup>
	);
}
