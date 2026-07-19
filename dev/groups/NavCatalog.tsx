import { createSignal } from "solid-js";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuMenu,
	NavigationMenuTrigger,
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function NavCatalog() {
	const [tab, setTab] = createSignal("overview");
	const [bookmarks, setBookmarks] = createSignal(true);
	const [layout, setLayout] = createSignal("comfortable");

	return (
		<CatalogGroup id="cat-nav" title="Navigation">
			<CatalogItem name="Tabs" hint={`value: ${tab()}`} span={2}>
				<Tabs value={tab()} onChange={setTab} class="w-full">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="activity">Activity</TabsTrigger>
						<TabsTrigger value="settings" disabled>
							Settings
						</TabsTrigger>
					</TabsList>
					<TabsContent value="overview" class="text-muted-foreground text-sm">
						At-a-glance status for the whole home.
					</TabsContent>
					<TabsContent value="activity" class="text-muted-foreground text-sm">
						Recent events, newest first.
					</TabsContent>
					<TabsContent value="settings" class="text-muted-foreground text-sm">
						(disabled trigger)
					</TabsContent>
				</Tabs>
			</CatalogItem>

			<CatalogItem name="Accordion" hint="collapsible">
				<Accordion collapsible defaultValue={["item-1"]} class="w-full">
					<AccordionItem value="item-1">
						<AccordionTrigger>Is it accessible?</AccordionTrigger>
						<AccordionContent class="text-muted-foreground">
							Yes. It follows the WAI-ARIA disclosure pattern.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2">
						<AccordionTrigger>Is it themed?</AccordionTrigger>
						<AccordionContent class="text-muted-foreground">
							Entirely via design tokens, no hardcoded colors.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</CatalogItem>

			<CatalogItem name="Breadcrumb" hint="link / ellipsis / page" span={2}>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="#">Home</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbEllipsis />
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="#">Docs</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Components</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</CatalogItem>

			<CatalogItem name="Pagination" hint="page 2 active">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious href="#" />
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">1</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#" isActive>
								2
							</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">3</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationEllipsis />
						</PaginationItem>
						<PaginationItem>
							<PaginationNext href="#" />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</CatalogItem>

			<CatalogItem name="Menubar" hint="desktop-style menus" span={2}>
				<Menubar>
					<MenubarMenu>
						<MenubarTrigger>File</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								New Tab <MenubarShortcut>⌘T</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>New Window</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>
								Print <MenubarShortcut>⌘P</MenubarShortcut>
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger>Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								Undo <MenubarShortcut>⌘Z</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarSub>
								<MenubarSubTrigger>Find</MenubarSubTrigger>
								<MenubarSubContent>
									<MenubarItem>Search…</MenubarItem>
									<MenubarItem>Find Next</MenubarItem>
								</MenubarSubContent>
							</MenubarSub>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger>View</MenubarTrigger>
						<MenubarContent>
							<MenubarCheckboxItem checked={bookmarks()} onChange={setBookmarks}>
								Show Bookmarks
							</MenubarCheckboxItem>
							<MenubarSeparator />
							<MenubarRadioGroup value={layout()} onChange={setLayout}>
								<MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
								<MenubarRadioItem value="compact">Compact</MenubarRadioItem>
							</MenubarRadioGroup>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</CatalogItem>

			<CatalogItem name="NavigationMenu" hint="wired dropdown (hover More)" span={2}>
				<NavigationMenu viewport={false}>
					<NavigationMenuList>
						<NavigationMenuItem>
							<NavigationMenuLink href="#" data-active="true">
								Dashboard
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink href="#">Devices</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuMenu>
							<NavigationMenuTrigger>More</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul class="grid w-48 gap-1">
									<li>
										<NavigationMenuLink href="#">Automations</NavigationMenuLink>
									</li>
									<li>
										<NavigationMenuLink href="#">Integrations</NavigationMenuLink>
									</li>
									<li>
										<NavigationMenuLink href="#">Settings</NavigationMenuLink>
									</li>
								</ul>
							</NavigationMenuContent>
						</NavigationMenuMenu>
					</NavigationMenuList>
				</NavigationMenu>
				<CatalogNote>
					Dropdown wires via NavigationMenuMenu. Shown with viewport=false so each menu opens as a
					self-contained bordered popover under its trigger (the default full-width viewport spills
					in a compact cell).
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="Sidebar" hint="collapsible=none (static)" span={3}>
				<div class="h-64 w-full overflow-hidden rounded-md border border-border/50">
					<SidebarProvider style={{ "min-height": "100%" }}>
						<Sidebar collapsible="none" class="h-64 border-sidebar-border border-r">
							<SidebarHeader class="px-3 py-2 font-semibold text-sm">GlassHome</SidebarHeader>
							<SidebarContent>
								<SidebarGroup>
									<SidebarGroupLabel>Home</SidebarGroupLabel>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton>Devices</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton>Automations</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroup>
							</SidebarContent>
						</Sidebar>
					</SidebarProvider>
				</div>
				<CatalogNote>
					Exported from the package as of 0.6.0. Shown with collapsible="none" (static); the app
					shell uses the default offcanvas/icon collapsible mode with SidebarTrigger.
				</CatalogNote>
			</CatalogItem>
		</CatalogGroup>
	);
}
