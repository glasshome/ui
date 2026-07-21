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
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../src/solid";
import { CatalogGroup, CatalogItem } from "../CatalogKit";

export function NavCatalog() {
	const [tab, setTab] = createSignal("overview");

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
		</CatalogGroup>
	);
}
