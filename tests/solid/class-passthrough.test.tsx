/* Gate B1 (sdk-2.md): every component export from src/solid/index.ts renders
 * with class="probe" and the class reaches the DOM. Exports are enumerated
 * programmatically, so a future export either renders through the DEFAULT
 * probe, gets a CASES entry (required props / parent wrappers), or is added
 * to SKIP with a written reason; an unhandled one fails CI here. */
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import type { EntityDataAdapter } from "../../src/solid/entity-data.js";
import * as solid from "../../src/solid/index.js";
import type { MediaStore } from "../../src/solid/media-store.js";

const stubEntityData: EntityDataAdapter = {
	entityIdsByDomain: () => ({ sensor: ["sensor.a"] }),
	useEntities: () => () => [],
	getEntityView: () => undefined,
	useAreas: () => () => [],
};

const stubMediaStore: MediaStore = {
	index: async () => ({ media: [], usage: { bytes: 0, limitBytes: 0, files: 0, limitFiles: 0 } }),
	upload: async () => {
		throw new Error("unused");
	},
	remove: async () => {},
	url: (id, variant) => (variant === "thumb" ? `/api/images/${id}/thumb` : `/api/images/${id}`),
};

const widgetSummary: solid.WidgetSummary = {
	scope: "glasshome",
	name: "clock",
	displayName: "Clock",
	latestVersion: "1.0.0",
};

const noop = () => {};

/* Exports exempt from the probe, each with the reason. Two kinds:
 * - "renderless": context/portal roots that render no DOM element of their
 *   own, so a class can never reach the DOM by design.
 * - "no class prop": pre-existing passthrough gaps (the very thing this gate
 *   guards against for FUTURE exports). Listed explicitly so closing one is a
 *   one-line skip removal; reported in the design-system backlog. */
const SKIP: Record<string, string> = {
	// Renderless roots / portals
	AlertDialog: "renderless context root (kobalte Dialog), no DOM element of its own",
	BottomSheet: "renderless context root (state machine provider), no DOM element of its own",
	BottomSheetPortal: "portal mount point, renders children into <body> with no element of its own",
	ContextMenu: "renderless context root (kobalte Menu), no DOM element of its own",
	ContextMenuSub: "renderless sub-menu context root, no DOM element of its own",
	Dialog: "renderless context root (kobalte Dialog), no DOM element of its own",
	DropdownMenu: "renderless context root (kobalte Menu), no DOM element of its own",
	DropdownMenuSub: "renderless sub-menu context root, no DOM element of its own",
	FormField: "renderless name-context provider for form parts",
	HoverCard: "renderless context root (kobalte HoverCard), no DOM element of its own",
	Popover: "renderless context root (kobalte Popover), no DOM element of its own",
	ResponsiveDialog:
		"renderless context root (dialog/bottom-sheet switch), no DOM element of its own",
	Sheet: "renderless context root (kobalte Dialog), no DOM element of its own",
	Tooltip: "renderless context root (kobalte Tooltip), no DOM element of its own",
	AvatarImage:
		"kobalte Image renders the img element only after a successful load; happy-dom never loads images",
	MediaStoreError: "error class, not a component: no class prop to pass through",
	// Pre-existing passthrough gaps (no class prop today; close by adding one)
	BarList: "no class prop (pre-existing passthrough gap)",
	EntitySelector: "no class prop (pre-existing passthrough gap)",
	GlassToast: "no class prop (pre-existing passthrough gap); toast card rendered by Toaster",
	LabeledField: "no class prop (pre-existing passthrough gap)",
	LabeledIconPicker: "no class prop (pre-existing passthrough gap)",
	LabeledInput: "no class prop (pre-existing passthrough gap)",
	PageHeader: "no class prop (pre-existing passthrough gap)",
	RangeToggle: "no class prop (pre-existing passthrough gap)",
	RowActions: "no class prop (pre-existing passthrough gap)",
	ScopeIndicator: "no class prop (pre-existing passthrough gap)",
	HeroOption: "deprecated alias of OptionCard",
	OptionChoice: "row of an OptionCard; the card owns the class",
	ScrollBar: "deprecated no-op; gh-scroll's native-styled bar is the bar",
	SectionAddButton: "no class prop (pre-existing passthrough gap)",
	SectionEmpty: "no class prop (pre-existing passthrough gap)",
	SectionRowSkeletons: "no class prop (pre-existing passthrough gap)",
	StackedBar: "no class prop (pre-existing passthrough gap)",
	SwitchRow: "no class prop (pre-existing passthrough gap)",
	TableEmpty: "no class prop (pre-existing passthrough gap)",
	TableError: "no class prop (pre-existing passthrough gap)",
	Toaster: "third-party toast outlet (solid-sonner), no class contract of its own",
	WidgetTrustBadge: "no class prop (pre-existing passthrough gap)",
};

/* Bespoke renders for components with required props or parent contexts.
 * The component under test carries class="probe". */
const CASES: Record<string, () => JSX.Element> = {
	AccordionItem: () => (
		<solid.Accordion collapsible>
			<solid.AccordionItem value="a" class="probe">
				x
			</solid.AccordionItem>
		</solid.Accordion>
	),
	AccordionTrigger: () => (
		<solid.Accordion collapsible>
			<solid.AccordionItem value="a">
				<solid.AccordionTrigger class="probe">t</solid.AccordionTrigger>
			</solid.AccordionItem>
		</solid.Accordion>
	),
	AccordionContent: () => (
		<solid.Accordion collapsible defaultValue={["a"]}>
			<solid.AccordionItem value="a">
				<solid.AccordionTrigger>t</solid.AccordionTrigger>
				<solid.AccordionContent class="probe">c</solid.AccordionContent>
			</solid.AccordionItem>
		</solid.Accordion>
	),
	AlertDialogTrigger: () => (
		<solid.AlertDialog>
			<solid.AlertDialogTrigger class="probe">open</solid.AlertDialogTrigger>
		</solid.AlertDialog>
	),
	AlertDialogContent: () => (
		<solid.AlertDialog open>
			<solid.AlertDialogContent class="probe">c</solid.AlertDialogContent>
		</solid.AlertDialog>
	),
	AlertDialogTitle: () => (
		<solid.AlertDialog open>
			<solid.AlertDialogContent>
				<solid.AlertDialogTitle class="probe">t</solid.AlertDialogTitle>
			</solid.AlertDialogContent>
		</solid.AlertDialog>
	),
	AlertDialogDescription: () => (
		<solid.AlertDialog open>
			<solid.AlertDialogContent>
				<solid.AlertDialogDescription class="probe">d</solid.AlertDialogDescription>
			</solid.AlertDialogContent>
		</solid.AlertDialog>
	),
	AlertDialogAction: () => (
		<solid.AlertDialog open>
			<solid.AlertDialogContent>
				<solid.AlertDialogAction class="probe">ok</solid.AlertDialogAction>
			</solid.AlertDialogContent>
		</solid.AlertDialog>
	),
	AlertDialogCancel: () => (
		<solid.AlertDialog open>
			<solid.AlertDialogContent>
				<solid.AlertDialogCancel class="probe">no</solid.AlertDialogCancel>
			</solid.AlertDialogContent>
		</solid.AlertDialog>
	),
	AreaChart: () => (
		<solid.AreaChart
			class="probe"
			data={[
				{ day: "Mon", count: 1 },
				{ day: "Tue", count: 2 },
			]}
		/>
	),
	AreaPicker: () => (
		<solid.EntityDataContext.Provider value={stubEntityData}>
			<solid.AreaPicker class="probe" value="" onChange={noop} />
		</solid.EntityDataContext.Provider>
	),
	AvatarFallback: () => (
		<solid.Avatar>
			<solid.AvatarFallback class="probe">GH</solid.AvatarFallback>
		</solid.Avatar>
	),
	BottomSheetTrigger: () => (
		<solid.BottomSheet>
			<solid.BottomSheetTrigger class="probe">open</solid.BottomSheetTrigger>
		</solid.BottomSheet>
	),
	BottomSheetOverlay: () => (
		<solid.BottomSheet open>
			<solid.BottomSheetPortal>
				<solid.BottomSheetOverlay class="probe" />
			</solid.BottomSheetPortal>
		</solid.BottomSheet>
	),
	BottomSheetContent: () => (
		<solid.BottomSheet open>
			<solid.BottomSheetPortal>
				<solid.BottomSheetContent class="probe" ariaLabel="sheet">
					c
				</solid.BottomSheetContent>
			</solid.BottomSheetPortal>
		</solid.BottomSheet>
	),
	BottomSheetClose: () => (
		<solid.BottomSheet open>
			<solid.BottomSheetPortal>
				<solid.BottomSheetContent ariaLabel="sheet">
					<solid.BottomSheetClose class="probe">x</solid.BottomSheetClose>
				</solid.BottomSheetContent>
			</solid.BottomSheetPortal>
		</solid.BottomSheet>
	),
	CarouselContent: () => (
		<solid.Carousel>
			<solid.CarouselContent class="probe">
				<solid.CarouselItem>1</solid.CarouselItem>
			</solid.CarouselContent>
		</solid.Carousel>
	),
	CarouselItem: () => (
		<solid.Carousel>
			<solid.CarouselContent>
				<solid.CarouselItem class="probe">1</solid.CarouselItem>
			</solid.CarouselContent>
		</solid.Carousel>
	),
	CarouselPrevious: () => (
		<solid.Carousel>
			<solid.CarouselContent>
				<solid.CarouselItem>1</solid.CarouselItem>
			</solid.CarouselContent>
			<solid.CarouselPrevious class="probe" />
		</solid.Carousel>
	),
	CarouselNext: () => (
		<solid.Carousel>
			<solid.CarouselContent>
				<solid.CarouselItem>1</solid.CarouselItem>
			</solid.CarouselContent>
			<solid.CarouselNext class="probe" />
		</solid.Carousel>
	),
	CarouselDots: () => (
		<solid.Carousel>
			<solid.CarouselContent>
				<solid.CarouselItem>1</solid.CarouselItem>
			</solid.CarouselContent>
			<solid.CarouselDots class="probe" />
		</solid.Carousel>
	),
	CollapsibleTrigger: () => (
		<solid.Collapsible>
			<solid.CollapsibleTrigger class="probe">t</solid.CollapsibleTrigger>
		</solid.Collapsible>
	),
	CollapsibleContent: () => (
		<solid.Collapsible defaultOpen>
			<solid.CollapsibleContent class="probe">c</solid.CollapsibleContent>
		</solid.Collapsible>
	),
	ColorSlider: () => (
		<solid.ColorSlider
			class="probe"
			channel="hue"
			defaultValue={solid.parseColor("hsl(200, 98%, 39%)")}
		/>
	),
	ContextMenuTrigger: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger class="probe">t</solid.ContextMenuTrigger>
		</solid.ContextMenu>
	),
	ContextMenuContent: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent class="probe">
				<solid.ContextMenuItem>i</solid.ContextMenuItem>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuItem: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuItem class="probe">i</solid.ContextMenuItem>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuCheckboxItem: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuCheckboxItem class="probe">i</solid.ContextMenuCheckboxItem>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuGroup: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuGroup class="probe">
					<solid.ContextMenuItem>i</solid.ContextMenuItem>
				</solid.ContextMenuGroup>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuLabel: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuGroup>
					<solid.ContextMenuLabel class="probe">l</solid.ContextMenuLabel>
				</solid.ContextMenuGroup>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuRadioGroup: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuRadioGroup class="probe" value="a">
					<solid.ContextMenuRadioItem value="a">a</solid.ContextMenuRadioItem>
				</solid.ContextMenuRadioGroup>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuRadioItem: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuRadioGroup value="a">
					<solid.ContextMenuRadioItem class="probe" value="a">
						a
					</solid.ContextMenuRadioItem>
				</solid.ContextMenuRadioGroup>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuSubTrigger: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuSub>
					<solid.ContextMenuSubTrigger class="probe">s</solid.ContextMenuSubTrigger>
				</solid.ContextMenuSub>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	ContextMenuSubContent: () => (
		<solid.ContextMenu>
			<solid.ContextMenuTrigger data-cm-trigger="">t</solid.ContextMenuTrigger>
			<solid.ContextMenuContent>
				<solid.ContextMenuSub defaultOpen>
					<solid.ContextMenuSubTrigger>s</solid.ContextMenuSubTrigger>
					<solid.ContextMenuSubContent class="probe">
						<solid.ContextMenuItem>i</solid.ContextMenuItem>
					</solid.ContextMenuSubContent>
				</solid.ContextMenuSub>
			</solid.ContextMenuContent>
		</solid.ContextMenu>
	),
	DialogTrigger: () => (
		<solid.Dialog>
			<solid.DialogTrigger class="probe">open</solid.DialogTrigger>
		</solid.Dialog>
	),
	DialogContent: () => (
		<solid.Dialog open>
			<solid.DialogContent class="probe">c</solid.DialogContent>
		</solid.Dialog>
	),
	DialogTitle: () => (
		<solid.Dialog open>
			<solid.DialogContent>
				<solid.DialogTitle class="probe">t</solid.DialogTitle>
			</solid.DialogContent>
		</solid.Dialog>
	),
	DialogDescription: () => (
		<solid.Dialog open>
			<solid.DialogContent>
				<solid.DialogDescription class="probe">d</solid.DialogDescription>
			</solid.DialogContent>
		</solid.Dialog>
	),
	DialogClose: () => (
		<solid.Dialog open>
			<solid.DialogContent>
				<solid.DialogClose class="probe">x</solid.DialogClose>
			</solid.DialogContent>
		</solid.Dialog>
	),
	Dock: () => (
		<solid.Dock
			class="probe"
			items={[{ id: "a", icon: <span>i</span>, label: "A", onClick: noop }]}
		/>
	),
	DropdownMenuTrigger: () => (
		<solid.DropdownMenu>
			<solid.DropdownMenuTrigger class="probe">t</solid.DropdownMenuTrigger>
		</solid.DropdownMenu>
	),
	DropdownMenuContent: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent class="probe">
				<solid.DropdownMenuItem>i</solid.DropdownMenuItem>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuItem: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuItem class="probe">i</solid.DropdownMenuItem>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuGroup: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuGroup class="probe">
					<solid.DropdownMenuItem>i</solid.DropdownMenuItem>
				</solid.DropdownMenuGroup>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuLabel: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuGroup>
					<solid.DropdownMenuLabel class="probe">l</solid.DropdownMenuLabel>
				</solid.DropdownMenuGroup>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuRadioGroup: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuRadioGroup class="probe" value="a" />
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuCheckboxItem: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuCheckboxItem class="probe">i</solid.DropdownMenuCheckboxItem>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuRadioItem: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuRadioGroup value="a">
					<solid.DropdownMenuRadioItem class="probe" value="a">
						a
					</solid.DropdownMenuRadioItem>
				</solid.DropdownMenuRadioGroup>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuSubTrigger: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuSub>
					<solid.DropdownMenuSubTrigger class="probe">s</solid.DropdownMenuSubTrigger>
				</solid.DropdownMenuSub>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	DropdownMenuSubContent: () => (
		<solid.DropdownMenu defaultOpen>
			<solid.DropdownMenuTrigger>t</solid.DropdownMenuTrigger>
			<solid.DropdownMenuContent>
				<solid.DropdownMenuSub defaultOpen>
					<solid.DropdownMenuSubTrigger>s</solid.DropdownMenuSubTrigger>
					<solid.DropdownMenuSubContent class="probe">
						<solid.DropdownMenuItem>i</solid.DropdownMenuItem>
					</solid.DropdownMenuSubContent>
				</solid.DropdownMenuSub>
			</solid.DropdownMenuContent>
		</solid.DropdownMenu>
	),
	HeroAction: () => (
		<solid.HeroAction
			class="probe"
			icon="lucide:house"
			title="t"
			description="d"
			accentVar="var(--primary)"
			onClick={noop}
		/>
	),
	HoverCardTrigger: () => (
		<solid.HoverCard>
			<solid.HoverCardTrigger class="probe">t</solid.HoverCardTrigger>
		</solid.HoverCard>
	),
	HoverCardContent: () => (
		<solid.HoverCard defaultOpen>
			<solid.HoverCardTrigger>t</solid.HoverCardTrigger>
			<solid.HoverCardContent class="probe">c</solid.HoverCardContent>
		</solid.HoverCard>
	),
	IconPicker: () => <solid.IconPicker class="probe" value="mdi:home" onChange={noop} />,
	ImagePicker: () => (
		<solid.MediaStoreContext.Provider value={stubMediaStore}>
			<solid.ImagePicker class="probe" value="" onChange={noop} />
		</solid.MediaStoreContext.Provider>
	),
	MediaTile: () => (
		<solid.MediaTile
			class="probe"
			item={{ id: "a", mimeType: "image/png", width: 10, height: 10, size: 1, usedBy: 0 }}
			thumbUrl="/api/images/a/thumb"
			label="Use a"
			broken={false}
			onSelect={noop}
			onBroken={noop}
		/>
	),
	DockedPanel: () => (
		<solid.DockedPanel open ariaLabel="Editor" class="probe">
			<span />
		</solid.DockedPanel>
	),
	PreviewTile: () => (
		<solid.PreviewTileGroup aria-label="Tiles" value={null} onChange={noop}>
			<solid.PreviewTile class="probe" value="a" label="A">
				<span />
			</solid.PreviewTile>
		</solid.PreviewTileGroup>
	),
	OptionCard: () => (
		<solid.OptionCardGroup value={null} onChange={noop}>
			<solid.OptionCard class="probe" value="a" title="A" />
		</solid.OptionCardGroup>
	),
	PopoverTrigger: () => (
		<solid.Popover>
			<solid.PopoverTrigger class="probe">t</solid.PopoverTrigger>
		</solid.Popover>
	),
	PopoverAnchor: () => (
		<solid.Popover>
			<solid.PopoverAnchor class="probe">
				<solid.PopoverTrigger>t</solid.PopoverTrigger>
			</solid.PopoverAnchor>
		</solid.Popover>
	),
	PopoverContent: () => (
		<solid.Popover defaultOpen>
			<solid.PopoverTrigger>t</solid.PopoverTrigger>
			<solid.PopoverContent class="probe">c</solid.PopoverContent>
		</solid.Popover>
	),
	RadioGroupItem: () => (
		<solid.RadioGroup>
			<solid.RadioGroupItem class="probe" value="a" />
		</solid.RadioGroup>
	),
	ResponsiveDialogTrigger: () => (
		<solid.ResponsiveDialog>
			<solid.ResponsiveDialogTrigger class="probe">open</solid.ResponsiveDialogTrigger>
		</solid.ResponsiveDialog>
	),
	ResponsiveDialogContent: () => (
		<solid.ResponsiveDialog open>
			<solid.ResponsiveDialogContent class="probe">c</solid.ResponsiveDialogContent>
		</solid.ResponsiveDialog>
	),
	ResponsiveDialogClose: () => (
		<solid.ResponsiveDialog open>
			<solid.ResponsiveDialogContent>
				<solid.ResponsiveDialogClose class="probe">x</solid.ResponsiveDialogClose>
			</solid.ResponsiveDialogContent>
		</solid.ResponsiveDialog>
	),
	ResponsiveDialogTitle: () => (
		<solid.ResponsiveDialog open>
			<solid.ResponsiveDialogContent>
				<solid.ResponsiveDialogTitle class="probe">t</solid.ResponsiveDialogTitle>
			</solid.ResponsiveDialogContent>
		</solid.ResponsiveDialog>
	),
	ResponsiveDialogDescription: () => (
		<solid.ResponsiveDialog open>
			<solid.ResponsiveDialogContent>
				<solid.ResponsiveDialogDescription class="probe">d</solid.ResponsiveDialogDescription>
			</solid.ResponsiveDialogContent>
		</solid.ResponsiveDialog>
	),
	SchemaForm: () => (
		<solid.SchemaForm
			class="probe"
			schema={{ type: "object", properties: {} }}
			data={{}}
			onChange={noop}
		/>
	),
	Select: () => <solid.Select class="probe" options={["a"]} />,
	SelectTrigger: () => (
		<solid.Select options={["a"]}>
			<solid.SelectTrigger class="probe">
				<solid.SelectValue<string>>{(s) => s.selectedOption()}</solid.SelectValue>
			</solid.SelectTrigger>
		</solid.Select>
	),
	SelectValue: () => (
		<solid.Select options={["a"]} defaultValue="a">
			<solid.SelectTrigger>
				<solid.SelectValue<string> class="probe">{(s) => s.selectedOption()}</solid.SelectValue>
			</solid.SelectTrigger>
		</solid.Select>
	),
	SelectContent: () => (
		<solid.Select options={["a"]} defaultOpen>
			<solid.SelectTrigger>
				<solid.SelectValue<string>>{(s) => s.selectedOption()}</solid.SelectValue>
			</solid.SelectTrigger>
			<solid.SelectContent class="probe" />
		</solid.Select>
	),
	SelectItem: () => (
		<solid.Select
			options={["a"]}
			defaultOpen
			itemComponent={(p) => (
				<solid.SelectItem class="probe" item={p.item}>
					{p.item.rawValue}
				</solid.SelectItem>
			)}
		>
			<solid.SelectTrigger>
				<solid.SelectValue<string>>{(s) => s.selectedOption()}</solid.SelectValue>
			</solid.SelectTrigger>
			<solid.SelectContent />
		</solid.Select>
	),
	SelectLabel: () => (
		<solid.Select options={["a"]}>
			<solid.SelectLabel class="probe">l</solid.SelectLabel>
			<solid.SelectTrigger>
				<solid.SelectValue<string>>{(s) => s.selectedOption()}</solid.SelectValue>
			</solid.SelectTrigger>
		</solid.Select>
	),
	SheetTrigger: () => (
		<solid.Sheet>
			<solid.SheetTrigger class="probe">open</solid.SheetTrigger>
		</solid.Sheet>
	),
	SheetContent: () => (
		<solid.Sheet open>
			<solid.SheetContent class="probe">c</solid.SheetContent>
		</solid.Sheet>
	),
	SheetTitle: () => (
		<solid.Sheet open>
			<solid.SheetContent>
				<solid.SheetTitle class="probe">t</solid.SheetTitle>
			</solid.SheetContent>
		</solid.Sheet>
	),
	SheetDescription: () => (
		<solid.Sheet open>
			<solid.SheetContent>
				<solid.SheetDescription class="probe">d</solid.SheetDescription>
			</solid.SheetContent>
		</solid.Sheet>
	),
	SheetClose: () => (
		<solid.Sheet open>
			<solid.SheetContent>
				<solid.SheetClose class="probe">x</solid.SheetClose>
			</solid.SheetContent>
		</solid.Sheet>
	),
	StepIndicator: () => <solid.StepIndicator class="probe" count={3} index={0} />,
	TableFilterSelect: () => (
		<solid.TableFilterSelect
			class="probe"
			options={["all"]}
			value="all"
			onChange={noop}
			label={(v) => v}
			ariaLabel="filter"
		/>
	),
	TabsList: () => (
		<solid.Tabs defaultValue="a">
			<solid.TabsList class="probe">
				<solid.TabsTrigger value="a">a</solid.TabsTrigger>
			</solid.TabsList>
		</solid.Tabs>
	),
	TabsTrigger: () => (
		<solid.Tabs defaultValue="a">
			<solid.TabsList>
				<solid.TabsTrigger class="probe" value="a">
					a
				</solid.TabsTrigger>
			</solid.TabsList>
		</solid.Tabs>
	),
	TabsContent: () => (
		<solid.Tabs defaultValue="a">
			<solid.TabsList>
				<solid.TabsTrigger value="a">a</solid.TabsTrigger>
			</solid.TabsList>
			<solid.TabsContent class="probe" value="a">
				c
			</solid.TabsContent>
		</solid.Tabs>
	),
	ToggleGroupItem: () => (
		<solid.ToggleGroup>
			<solid.ToggleGroupItem class="probe" value="a">
				a
			</solid.ToggleGroupItem>
		</solid.ToggleGroup>
	),
	TooltipTrigger: () => (
		<solid.Tooltip>
			<solid.TooltipTrigger class="probe">t</solid.TooltipTrigger>
		</solid.Tooltip>
	),
	TooltipContent: () => (
		<solid.Tooltip open>
			<solid.TooltipTrigger>t</solid.TooltipTrigger>
			<solid.TooltipContent class="probe">c</solid.TooltipContent>
		</solid.Tooltip>
	),
	WidgetCard: () => <solid.WidgetCard class="probe" widget={widgetSummary} />,
	WidgetIdentity: () => <solid.WidgetIdentity class="probe" widget={widgetSummary} />,
	WidgetMeta: () => <solid.WidgetMeta class="probe" widget={widgetSummary} />,
};

const componentNames = Object.entries(solid)
	.filter(([name, value]) => typeof value === "function" && /^[A-Z]/.test(name))
	.map(([name]) => name)
	.sort();

afterEach(() => {
	cleanup();
	// A render that throws mid-mount never registers a dispose, so cleanup()
	// can leave its partial DOM (and portals) behind; wipe to keep tests
	// independent.
	document.body.innerHTML = "";
});

describe("class passthrough (gate B1)", () => {
	it("enumerates the export surface", () => {
		expect(componentNames.length).toBeGreaterThan(100);
	});

	for (const name of componentNames) {
		if (name in SKIP) {
			it.skip(`${name} — ${SKIP[name]}`, () => {});
			continue;
		}
		it(name, async () => {
			// Leak guard: a stale probe from an earlier render would make this
			// assertion pass vacuously.
			expect(document.querySelector(".probe")).toBeNull();
			const renderCase = CASES[name];
			if (renderCase) {
				render(renderCase);
			} else {
				const Comp = (solid as Record<string, unknown>)[name] as (p: {
					class: string;
					children: string;
				}) => JSX.Element;
				render(() => <Comp class="probe">probe</Comp>);
			}
			// Context menus mount their content only after a pointer-positioned
			// open; cases mark the trigger and we fire the real event.
			const cmTrigger = document.querySelector("[data-cm-trigger]");
			if (cmTrigger) {
				fireEvent.contextMenu(cmTrigger);
				await Promise.resolve();
			}
			// document-wide: portalled content (dialogs, menus) mounts on body.
			expect(document.querySelector(".probe")).toBeTruthy();
		});
	}
});
