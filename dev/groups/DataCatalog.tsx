import { createSignal } from "solid-js";
import {
	AreaChart,
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	BarList,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
	CountPill,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemGroup,
	ItemHeader,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
	RangeToggle,
	ScopeIndicator,
	SectionCard,
	SectionGroup,
	SectionIcon,
	SectionMeta,
	SectionRow,
	SectionTitle,
	Separator,
	StackedBar,
	Table,
	TableBody,
	TableBulkBar,
	TableCaption,
	TableCell,
	TableEmpty,
	TableFilterSelect,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	TableSearchInput,
	TableSkeleton,
	TableSortHeader,
	TierBadge,
	WidgetIdentity,
	WidgetTrustBadge,
} from "../../src/solid";
import { Icon } from "../../src/solid/icon.js";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

export function DataCatalog() {
	const [showArchived, setShowArchived] = createSignal(false);
	const [search, setSearch] = createSignal("");
	const [scopeFilter, setScopeFilter] = createSignal("all");
	const [rangeDays, setRangeDays] = createSignal(30);
	return (
		<CatalogGroup id="cat-data" title="Data display">
			<Specimen name="Badge" span={2}>
				<Axis of="tone">
					<Badge tone="var(--primary)">Primary</Badge>
					<Badge tone="var(--success)">Online</Badge>
					<Badge tone="var(--warning)">Degraded</Badge>
					<Badge tone="var(--destructive)">Offline</Badge>
					<Badge tone="var(--accent)">Accent</Badge>
					<Badge tone="var(--muted-foreground)">Muted</Badge>
				</Axis>
			</Specimen>

			<Specimen name="TierBadge">
				<TierBadge
					hi="oklch(0.78 0.084 215)"
					lo="oklch(0.63 0.144 215)"
					text="oklch(0.14 0.06 215)"
				>
					Pro
				</TierBadge>
				<TierBadge hi="oklch(0.88 0.11 90)" lo="oklch(0.74 0.13 78)" text="oklch(0.28 0.06 70)">
					Early Bird
				</TierBadge>
			</Specimen>

			<Specimen name="Avatar">
				<Avatar>
					<AvatarImage src="" alt="" />
					<AvatarFallback>GH</AvatarFallback>
				</Avatar>
			</Specimen>

			<Specimen name="Separator">
				<Axis of="orientation">
					<div class="w-full space-y-2">
						<span class="text-muted-foreground text-xs">Above</span>
						<Separator />
						<span class="text-muted-foreground text-xs">Below</span>
					</div>
					<div class="flex h-8 items-center gap-3 text-muted-foreground text-xs">
						<span>Left</span>
						<Separator orientation="vertical" />
						<span>Right</span>
					</div>
				</Axis>
			</Specimen>

			<Specimen name="Card" span={2}>
				<Card padding="slots" class="w-full max-w-sm">
					<CardHeader>
						<CardTitle>Home Assistant</CardTitle>
						<CardDescription>Connected via managed tunnel</CardDescription>
						<CardAction>
							<Badge tone="var(--success)">Live</Badge>
						</CardAction>
					</CardHeader>
					<CardContent>
						<p class="text-muted-foreground text-sm">
							42 entities exposed. Last sync 2 minutes ago.
						</p>
					</CardContent>
					<CardFooter class="justify-between">
						<span class="text-muted-foreground text-xs">v2026.7</span>
						<Button variant="outline" size="sm">
							Manage
						</Button>
					</CardFooter>
				</Card>
			</Specimen>

			<Specimen name="Item" span={2}>
				<Card padding="none" class="w-full max-w-md overflow-hidden">
					<ItemGroup>
						<Item>
							<ItemMedia>
								<SectionIcon size="md">
									<Icon icon="lucide:folder" width={20} height={20} class="size-5" />
								</SectionIcon>
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Automations</ItemTitle>
								<ItemDescription>12 active, 3 paused</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Button variant="ghost" size="icon" aria-label="more">
									<Icon icon="lucide:ellipsis-vertical" width={16} height={16} />
								</Button>
							</ItemActions>
						</Item>
						<ItemSeparator class="mx-4" />
						<Item>
							<ItemHeader>
								<ItemTitle>Header row</ItemTitle>
								<Badge tone="var(--muted-foreground)">meta</Badge>
							</ItemHeader>
							<ItemContent>
								<ItemDescription>ItemHeader + ItemFooter span full width.</ItemDescription>
							</ItemContent>
							<ItemFooter>
								<span class="text-muted-foreground text-xs">Updated today</span>
								<Button variant="link" size="sm">
									View
								</Button>
							</ItemFooter>
						</Item>
					</ItemGroup>
				</Card>
			</Specimen>

			<Specimen name="Table" span={3}>
				<Axis of="parts">
					<Table>
						<TableCaption>Recent invoices</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>Invoice</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Method</TableHead>
								<TableHead class="text-right">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell class="font-medium">INV-001</TableCell>
								<TableCell>
									<Badge tone="var(--success)">Paid</Badge>
								</TableCell>
								<TableCell>Card</TableCell>
								<TableCell class="text-right">$19.99</TableCell>
							</TableRow>
							<TableRow>
								<TableCell class="font-medium">INV-002</TableCell>
								<TableCell>
									<Badge tone="var(--warning)">Pending</Badge>
								</TableCell>
								<TableCell>Card</TableCell>
								<TableCell class="text-right">$39.99</TableCell>
							</TableRow>
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={3}>Total</TableCell>
								<TableCell class="text-right">$59.98</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</Axis>
				<Axis of="toolbar">
					<div class="w-full space-y-3">
						<div class="flex flex-wrap items-center gap-2">
							<TableSearchInput
								value={search()}
								onInput={setSearch}
								placeholder="Search widgets"
								label="Search widgets"
							/>
							<TableFilterSelect
								options={["all", "official", "community"]}
								value={scopeFilter()}
								onChange={setScopeFilter}
								label={(v) => v}
								ariaLabel="Filter by scope"
							/>
							<TableSortHeader label="Name" active dir="asc" onClick={() => {}} />
						</div>
						<TableBulkBar>
							<span class="text-xs">2 selected</span>
							<Button variant="outline" size="sm">
								Archive
							</Button>
							<Button variant="destructive" size="sm">
								Delete
							</Button>
						</TableBulkBar>
					</div>
				</Axis>
				<Axis of="state">
					<TableEmpty
						icon="lucide:inbox"
						message="No widgets match your search."
						action={
							<Button variant="outline" size="sm">
								Clear filters
							</Button>
						}
					/>
					<div class="w-full">
						<TableSkeleton count={3} />
					</div>
				</Axis>
			</Specimen>

			<Specimen name="DropdownMenuSub" try="click Actions" span={2}>
				<DropdownMenu>
					<DropdownMenuTrigger as={Button} variant="outline">
						Actions
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuGroup>
							<DropdownMenuLabel>Widget</DropdownMenuLabel>
							<DropdownMenuItem>
								<Icon icon="lucide:pencil" width={16} height={16} />
								Edit
							</DropdownMenuItem>
							<DropdownMenuCheckboxItem checked={showArchived()} onChange={setShowArchived}>
								Show archived
							</DropdownMenuCheckboxItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuItem>Living room</DropdownMenuItem>
								<DropdownMenuItem>Kitchen</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
			</Specimen>

			<Specimen name="ContextMenuItem" try="right-click the pad">
				<ContextMenu>
					<ContextMenuTrigger class="flex h-16 w-full items-center justify-center rounded-md border border-border/60 border-dashed bg-muted/20 text-muted-foreground text-xs">
						Right-click here
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuGroup>
							<ContextMenuLabel>Widget</ContextMenuLabel>
							<ContextMenuItem>Duplicate</ContextMenuItem>
						</ContextMenuGroup>
						<ContextMenuSeparator />
						<ContextMenuItem tone="var(--destructive)">
							<Icon icon="lucide:trash-2" width={16} height={16} />
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</Specimen>

			<Specimen name="RangeToggle" state={`${rangeDays()} days`}>
				<RangeToggle value={rangeDays()} onChange={setRangeDays} />
			</Specimen>

			<Specimen name="AreaChart" span={2}>
				<AreaChart
					data={[
						{ day: "2026-08-01", count: 12 },
						{ day: "2026-08-02", count: 18 },
						{ day: "2026-08-03", count: 9 },
						{ day: "2026-08-04", count: 24 },
						{ day: "2026-08-05", count: 20 },
					]}
					height={56}
				/>
			</Specimen>

			<Specimen name="BarList">
				<BarList
					items={[
						{ label: "energy-flow", value: 420, sublabel: "official" },
						{ label: "clock", value: 260, sublabel: "official" },
						{ label: "area-summary", value: 90, sublabel: "community" },
					]}
				/>
			</Specimen>

			<Specimen name="StackedBar">
				<StackedBar
					segments={[
						{ label: "Fresh (<30d)", value: 12, tone: "var(--success)" },
						{ label: "Aging (30-90d)", value: 5, tone: "var(--warning)" },
						{ label: "Stale (>90d)", value: 2, tone: "var(--destructive)" },
					]}
				/>
			</Specimen>

			<Specimen name="Empty" span={2}>
				<Empty class="w-full border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Icon icon="lucide:inbox" width={24} height={24} />
						</EmptyMedia>
						<EmptyTitle>No devices yet</EmptyTitle>
						<EmptyDescription>
							Connect your first hub to start streaming entities here.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="default" size="sm">
							Add a device
						</Button>
					</EmptyContent>
				</Empty>
			</Specimen>

			<Specimen name="SectionCard" span={3}>
				<Axis of="parts">
					<SectionCard
						icon="lucide:layout-grid"
						title="Section title"
						subtitle="Muted meta line under the title"
						count={3}
						action={
							<Button variant="outline" size="sm">
								Action
							</Button>
						}
						toolbar={<div class="text-muted-foreground text-sm">Toolbar row: search / filters</div>}
					>
						<div class="space-y-2">
							<SectionRow class="flex items-center gap-3">
								<SectionIcon icon="lucide:cloud" size="sm" />
								<div class="min-w-0">
									<SectionTitle class="text-base">SectionRow</SectionTitle>
									<SectionMeta>concentric inner surface</SectionMeta>
								</div>
							</SectionRow>
							<SectionRow>Plain row</SectionRow>
						</div>
					</SectionCard>
				</Axis>
				<Axis of="subtitleClass">
					<SectionCard
						title="Review queue depth"
						subtitle="meta at text-sm through subtitleClass, for desk-distance surfaces"
						subtitleClass="text-sm"
						count={3}
					>
						<div class="flex items-center gap-3">
							<CountPill class="text-sm">12</CountPill>
							<SectionMeta class="text-sm">SectionMeta upsized the same way</SectionMeta>
						</div>
					</SectionCard>
				</Axis>
			</Specimen>

			<Specimen name="SectionGroup" span={3}>
				<SectionCard icon="lucide:settings" title="Settings card">
					<SectionGroup
						icon="lucide:refresh-cw"
						label="Automatic updates"
						action={
							<Button variant="outline" size="sm">
								Manage
							</Button>
						}
					>
						<div class="space-y-2">
							<SectionRow>Official widgets</SectionRow>
							<SectionRow>Community widgets</SectionRow>
						</div>
					</SectionGroup>
					<SectionGroup icon="lucide:life-buoy" label="Recovery" count={1}>
						<SectionRow>Safe mode</SectionRow>
					</SectionGroup>
				</SectionCard>
			</Specimen>

			<Specimen name="SectionIcon">
				<Axis of="size">
					<SectionIcon icon="lucide:cloud" size="sm" />
					<SectionIcon icon="lucide:cloud" size="md" />
					<SectionIcon icon="lucide:cloud" size="lg" />
				</Axis>
				<Axis of="tone">
					<SectionIcon icon="lucide:cloud" size="md" />
					<SectionIcon icon="lucide:cloud" size="md" tone="primary" />
				</Axis>
			</Specimen>

			<Specimen name="WidgetTrustBadge">
				<Axis of="isOfficial">
					<WidgetTrustBadge isOfficial={true} />
					<WidgetTrustBadge isOfficial={false} />
				</Axis>
			</Specimen>

			<Specimen name="ScopeIndicator">
				<Axis of="type">
					<ScopeIndicator scope="ihsen" type="personal" />
					<ScopeIndicator scope="glasshome" type="organization" />
				</Axis>
			</Specimen>

			<Specimen name="WidgetIdentity" span={3}>
				<WidgetIdentity
					widget={{
						scope: "glasshome",
						name: "energy-flow",
						displayName: "Energy Flow",
						icon: "lucide:zap",
						isOfficial: true,
						latestVersion: "1.2.0",
						ownerType: "organization",
					}}
					iconSize="md"
					showScopeIndicator
				/>
			</Specimen>
		</CatalogGroup>
	);
}
