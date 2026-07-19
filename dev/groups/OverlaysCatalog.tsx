import { ChevronDown, Copy, Home, Package, Pencil, Search, Settings, Trash2 } from "lucide-solid";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetDescription,
	BottomSheetHeader,
	BottomSheetTitle,
	BottomSheetTrigger,
	Button,
	buttonVariants,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function OverlaysCatalog() {
	return (
		<CatalogGroup id="cat-overlays" title="Overlays">
			<CatalogItem name="Dialog" hint="modal · click to open">
				<Dialog>
					<DialogTrigger as={Button} variant="outline">
						Open dialog
					</DialogTrigger>
					<DialogContent class="border-border/50 bg-background/85 backdrop-blur-md">
						<DialogHeader>
							<DialogTitle>Package dialog</DialogTitle>
							<DialogDescription>Confirm actions, edit records, link devices.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<DialogClose as={Button} variant="outline">
								Cancel
							</DialogClose>
							<Button>Confirm</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CatalogItem>

			<CatalogItem name="AlertDialog" hint="confirm · click to open">
				<AlertDialog>
					<AlertDialogTrigger as={Button} variant="destructive">
						Delete widget
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this widget?</AlertDialogTitle>
							<AlertDialogDescription>
								This removes it from every dashboard. This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CatalogItem>

			<CatalogItem name="Sheet" hint="side panel · click to open">
				<Sheet>
					<SheetTrigger as={Button} variant="outline">
						Open sheet
					</SheetTrigger>
					<SheetContent side="right">
						<SheetHeader>
							<SheetTitle>Widget settings</SheetTitle>
							<SheetDescription>Edit-in-place panel that slides from the edge.</SheetDescription>
						</SheetHeader>
					</SheetContent>
				</Sheet>
			</CatalogItem>

			<CatalogItem name="BottomSheet" hint="drag-to-dismiss · click to open">
				<BottomSheet>
					<BottomSheetTrigger class={buttonVariants({ variant: "outline" })}>
						Open bottom sheet
					</BottomSheetTrigger>
					<BottomSheetContent>
						<BottomSheetHeader>
							<BottomSheetTitle>Bottom sheet</BottomSheetTitle>
							<BottomSheetDescription>
								Drag-to-dismiss panel with snap points, the mobile-native surface.
							</BottomSheetDescription>
						</BottomSheetHeader>
						<BottomSheetBody class="text-muted-foreground text-sm">
							Content goes here.
						</BottomSheetBody>
					</BottomSheetContent>
				</BottomSheet>
			</CatalogItem>

			<CatalogItem name="Popover" hint="anchored · click to open">
				<Popover>
					<PopoverTrigger as={Button} variant="outline">
						Open popover
					</PopoverTrigger>
					<PopoverContent class="w-56">
						<p class="font-medium text-foreground text-sm">Quick note</p>
						<p class="mt-1 text-muted-foreground text-sm">
							Lightweight anchored surface for extra context.
						</p>
					</PopoverContent>
				</Popover>
			</CatalogItem>

			<CatalogItem name="DropdownMenu" hint="menu · click to open">
				<DropdownMenu>
					<DropdownMenuTrigger as={Button} variant="outline">
						Actions
					</DropdownMenuTrigger>
					<DropdownMenuContent class="border-border/50 bg-popover/85 backdrop-blur-md">
						<DropdownMenuLabel>Widget</DropdownMenuLabel>
						<DropdownMenuItem>
							<Pencil /> Edit
							<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Copy /> Duplicate
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem class="text-destructive">
							<Trash2 /> Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CatalogItem>

			<CatalogItem name="ContextMenu" hint="right-click">
				<ContextMenu>
					<ContextMenuTrigger class="flex h-16 w-full items-center justify-center rounded-md border border-border/60 border-dashed bg-muted/20 text-muted-foreground text-xs">
						Right-click me
					</ContextMenuTrigger>
					<ContextMenuContent class="border-border/50 bg-popover/85 backdrop-blur-md">
						<ContextMenuLabel>Widget</ContextMenuLabel>
						<ContextMenuItem>
							<Pencil /> Edit
							<ContextMenuShortcut>⌘E</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem>
							<Copy /> Duplicate
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem variant="destructive">
							<Trash2 /> Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</CatalogItem>

			<CatalogItem name="Command" hint="inline palette" span={2}>
				<div class="w-full overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-md">
					<Command>
						<CommandInput placeholder="Type a command or search…" />
						<CommandList>
							<CommandEmpty>No results.</CommandEmpty>
							<CommandGroup heading="Navigation">
								<CommandItem value="dashboard">
									<Home /> Dashboard
									<CommandShortcut>G D</CommandShortcut>
								</CommandItem>
								<CommandItem value="widgets">
									<Package /> Widgets
									<CommandShortcut>G W</CommandShortcut>
								</CommandItem>
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup heading="Actions">
								<CommandItem value="publish">
									<Pencil /> Publish a widget
								</CommandItem>
								<CommandItem value="settings">
									<Settings /> Settings
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</div>
				<CatalogNote>filters live as you type; also ships as CommandDialog</CatalogNote>
			</CatalogItem>

			<CatalogItem name="Collapsible" hint="expand/collapse" span={2}>
				<Collapsible class="w-full">
					<CollapsibleTrigger class="flex w-full items-center justify-between gap-2 text-foreground text-sm">
						<span class="inline-flex items-center gap-2">
							<Search class="size-4" /> Advanced filters
						</span>
						<ChevronDown class="size-4 text-muted-foreground" />
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div class="rounded-md border border-border/50 bg-muted/20 p-3 text-muted-foreground text-sm">
							Extra options revealed on demand, animated open and closed.
						</div>
					</CollapsibleContent>
				</Collapsible>
			</CatalogItem>

			<CatalogItem name="ResponsiveDialog" hint="adaptive · click to open">
				<ResponsiveDialog>
					<ResponsiveDialogTrigger class={buttonVariants({ variant: "outline" })}>
						Open responsive
					</ResponsiveDialogTrigger>
					<ResponsiveDialogContent>
						<ResponsiveDialogHeader>
							<ResponsiveDialogTitle>Adaptive dialog</ResponsiveDialogTitle>
							<ResponsiveDialogDescription>
								Centered modal on desktop, drag-to-dismiss bottom sheet on mobile.
							</ResponsiveDialogDescription>
						</ResponsiveDialogHeader>
						<ResponsiveDialogFooter>
							<ResponsiveDialogClose>Close</ResponsiveDialogClose>
						</ResponsiveDialogFooter>
					</ResponsiveDialogContent>
				</ResponsiveDialog>
			</CatalogItem>
		</CatalogGroup>
	);
}
