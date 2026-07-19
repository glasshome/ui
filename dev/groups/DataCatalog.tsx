import { Folder, Inbox, MoreVertical } from "lucide-solid";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
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
	Overlay,
	ScopeIndicator,
	SectionCard,
	SectionIcon,
	SectionMeta,
	SectionRow,
	SectionSubtitle,
	Separator,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	TierBadge,
	WidgetIdentity,
	WidgetTrustBadge,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function DataCatalog() {
	return (
		<CatalogGroup id="cat-data" title="Data display">
			<CatalogItem name="Badge" hint="glass tone chips — pass any tone color" span={2}>
				<Badge tone="var(--primary)">Primary</Badge>
				<Badge tone="var(--success)">Online</Badge>
				<Badge tone="var(--warning)">Degraded</Badge>
				<Badge tone="var(--destructive)">Offline</Badge>
				<Badge tone="var(--accent)">Accent</Badge>
				<Badge tone="var(--muted-foreground)">Muted</Badge>
			</CatalogItem>

			<CatalogItem name="TierBadge" hint="metallic tier chips">
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
				<CatalogNote>brushed gradient + dark label; one family, hi/lo/text per tier</CatalogNote>
			</CatalogItem>

			<CatalogItem name="Avatar" hint="image + fallback">
				<Avatar>
					<AvatarImage src="" alt="" />
					<AvatarFallback>GH</AvatarFallback>
				</Avatar>
			</CatalogItem>

			<CatalogItem name="Separator" hint="horizontal + vertical">
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
			</CatalogItem>

			<CatalogItem name="glass surfaces" hint="Card wears CARD_SURFACE; Overlay its own" span={3}>
				<div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
					<Card padding="md" class="grid place-items-center text-center text-xs">
						&lt;Card&gt;
						<span class="text-[10px] text-muted-foreground">neutral surface</span>
					</Card>
					<Card
						padding="md"
						class="grid place-items-center text-center text-xs"
						style={{ "--glass-tone": "var(--accent)" }}
					>
						&lt;Card&gt; · accent
						<span class="text-[10px] text-muted-foreground">--glass-tone</span>
					</Card>
					<Overlay class="grid place-items-center p-4 text-center text-xs">
						&lt;Overlay&gt;
						<span class="text-[10px] text-muted-foreground">floating menu</span>
					</Overlay>
				</div>
			</CatalogItem>

			<CatalogNote>
				The neutral glass surface lives in the components, not a loose class: <strong>Card</strong>{" "}
				(and its .astro twin) wears <code>CARD_SURFACE</code>, <strong>Overlay</strong> its own
				opaque variant. Both are the one <code>.glass</code> formula with the tint off; set{" "}
				<code>--glass-tone</code> for an accent card. <strong>Item</strong> is structure only. Never
				hand-roll a <code>bg-card/NN border rounded</code> box.
			</CatalogNote>

			<CatalogItem name="Card" hint="glass surface + header / content / footer" span={2}>
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
			</CatalogItem>

			<CatalogItem name="Item" hint="row primitive + group" span={2}>
				<Card padding="none" class="w-full max-w-md overflow-hidden">
					<ItemGroup>
						<Item>
							<ItemMedia>
								<SectionIcon size="md">
									<Folder class="size-5" />
								</SectionIcon>
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Automations</ItemTitle>
								<ItemDescription>12 active, 3 paused</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Button variant="ghost" size="icon" aria-label="more">
									<MoreVertical />
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
			</CatalogItem>

			<CatalogItem name="Table" hint="header / body / footer / caption" span={3}>
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
			</CatalogItem>

			<CatalogItem name="Empty" hint="empty-state scaffold" span={2}>
				<Empty class="w-full border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Inbox />
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
			</CatalogItem>

			<CatalogItem name="SectionCard" hint="settings/list kit — shared with dash" span={3}>
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
								<SectionSubtitle>SectionRow</SectionSubtitle>
								<SectionMeta>concentric inner surface</SectionMeta>
							</div>
						</SectionRow>
						<SectionRow>Plain row</SectionRow>
					</div>
				</SectionCard>
				<CatalogNote>
					Also: SectionIcon, SectionLabel, SectionMeta, SectionSubtitle, SectionRowSkeleton. dash
					injects its performant-blur engine via the glass prop; hub uses the frosted default.
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="SectionIcon" hint="neutral + primary tone">
				<SectionIcon icon="lucide:cloud" size="md" />
				<SectionIcon icon="lucide:cloud" size="md" tone="primary" />
				<CatalogNote>
					tone=&quot;neutral&quot; (default) · tone=&quot;primary&quot;; sizes sm/md/lg
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="WidgetTrustBadge" hint="official / community">
				<WidgetTrustBadge isOfficial={true} />
				<WidgetTrustBadge isOfficial={false} />
				<CatalogNote>official = decagram glyph; community = muted badge</CatalogNote>
			</CatalogItem>

			<CatalogItem name="ScopeIndicator" hint="publisher scope pill">
				<ScopeIndicator scope="ihsen" type="personal" />
				<ScopeIndicator scope="glasshome" type="organization" />
			</CatalogItem>

			<CatalogItem
				name="WidgetIdentity"
				hint="widget nucleus — icon + name + markers + scope"
				span={3}
			>
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
				<CatalogNote>
					the shared widget-rendering nucleus (WidgetIdentity + WidgetMeta); hub's row/tile registry
					card and admin tables compose it
				</CatalogNote>
			</CatalogItem>
		</CatalogGroup>
	);
}
