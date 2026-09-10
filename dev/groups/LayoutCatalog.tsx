import { For } from "solid-js";
import {
	AspectRatio,
	Badge,
	Carousel,
	CarouselContent,
	CarouselDots,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	ListRow,
	Overlay,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	RowActions,
	ScrollArea,
	ScrollBar,
	SectionCard,
	SectionIcon,
	SectionLabel,
	SectionMeta,
	SectionRow,
	SectionRowSkeletons,
	SectionTitle,
} from "../../src/solid";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

export function LayoutCatalog() {
	return (
		<CatalogGroup id="cat-layout" title="Layout, cards & media">
			<Specimen name="SectionRow" span={3}>
				<SectionCard
					icon="lucide:activity"
					title="This week"
					subtitle="Across the household"
					class="w-full"
				>
					<div class="grid gap-2 sm:grid-cols-3">
						<For
							each={[
								["Widgets installed", "12"],
								["Automations run", "1,204"],
								["Devices offline", "0"],
							]}
						>
							{([label, value]) => (
								<SectionRow class="flex flex-col gap-1">
									<SectionMeta>{label}</SectionMeta>
									<span class="font-semibold text-2xl text-foreground tabular-nums">{value}</span>
								</SectionRow>
							)}
						</For>
					</div>
				</SectionCard>
			</Specimen>

			<Specimen name="ListRow" span={3}>
				<Axis of="onOpen">
					<div class="w-full">
						<ListRow
							leading={<SectionIcon icon="lucide:users" size="sm" />}
							title="Household"
							badges={<Badge>Admin</Badge>}
							subtitle="4 people, 2 guests"
							meta="Updated today"
							onOpen={() => {}}
							openLabel="Open household"
						/>
					</div>
				</Axis>
				<Axis of="actions">
					<div class="w-full">
						<ListRow
							leading={<SectionIcon icon="lucide:key-round" size="sm" />}
							title="Front door code"
							subtitle="Shared with 3 people"
							actions={<RowActions onEdit={() => {}} onDelete={() => {}} />}
						/>
					</div>
				</Axis>
			</Specimen>

			<Specimen name="SectionLabel">
				<div class="flex flex-col gap-1">
					<SectionTitle>SectionTitle</SectionTitle>
					<SectionLabel>SectionLabel</SectionLabel>
					<SectionMeta>SectionMeta</SectionMeta>
				</div>
			</Specimen>

			<Specimen name="SectionRowSkeletons" span={2}>
				<Axis of="count">
					<div class="w-full">
						<SectionRowSkeletons count={3} />
					</div>
				</Axis>
			</Specimen>

			<Specimen name="AspectRatio" state="16 / 9">
				<div class="w-full max-w-[240px]">
					<AspectRatio
						ratio={16 / 9}
						class="overflow-hidden rounded-md border border-border/50 bg-muted"
					>
						<div class="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/40 font-mono text-muted-foreground text-xs">
							16 / 9
						</div>
					</AspectRatio>
				</div>
			</Specimen>

			<Specimen name="ScrollArea">
				<ScrollArea class="h-32 w-full rounded-md border border-border/50 bg-muted/20">
					<div class="space-y-1 p-3">
						<For each={Array.from({ length: 16 }, (_, i) => i + 1)}>
							{(n) => (
								<div class="rounded bg-card/60 px-2 py-1 text-foreground text-xs">Row {n}</div>
							)}
						</For>
					</div>
					<ScrollBar orientation="vertical" />
				</ScrollArea>
			</Specimen>

			<Specimen name="Carousel" span={3}>
				<Axis of="transition">
					<div class="grid w-full gap-4 lg:grid-cols-3">
						<div class="px-12">
							<Carousel opts={{ loop: true }} class="w-full">
								<CarouselContent>
									<For each={["slide 1", "slide 2", "slide 3"]}>
										{(slide) => (
											<CarouselItem>
												<div class="flex h-24 items-center justify-center rounded-md border border-border/50 bg-muted/30 font-semibold text-foreground text-xl">
													{slide}
												</div>
											</CarouselItem>
										)}
									</For>
								</CarouselContent>
								<CarouselPrevious />
								<CarouselNext />
							</Carousel>
						</div>
						<div class="px-12">
							<Carousel transition="wipe" autoplay={2500} opts={{ loop: true }} class="w-full">
								<CarouselContent>
									<For each={["wipe 1", "wipe 2", "wipe 3"]}>
										{(slide, i) => (
											<CarouselItem>
												<div
													class="flex h-24 items-center justify-center rounded-md border border-border/50 font-semibold text-foreground text-xl"
													style={{ background: `var(--chart-${i() + 1})` }}
												>
													{slide}
												</div>
											</CarouselItem>
										)}
									</For>
								</CarouselContent>
								<CarouselDots class="mt-3" />
							</Carousel>
						</div>
						<div class="px-12">
							<Carousel transition="fade" autoplay={2000} opts={{ loop: true }} class="w-full">
								<CarouselContent>
									<For each={["fade 1", "fade 2", "fade 3"]}>
										{(slide, i) => (
											<CarouselItem>
												<div
													class="flex h-24 items-center justify-center rounded-md border border-border/50 font-semibold text-foreground text-xl"
													style={{ background: `var(--chart-${i() + 1})` }}
												>
													{slide}
												</div>
											</CarouselItem>
										)}
									</For>
								</CarouselContent>
								<CarouselDots class="mt-3" />
							</Carousel>
						</div>
					</div>
				</Axis>
			</Specimen>

			<Specimen name="Overlay">
				<div class="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-md">
					<div class="absolute inset-0 bg-gradient-to-br from-primary/60 via-accent/40 to-muted" />
					<div class="absolute inset-0 grid grid-cols-4 gap-2 p-3 opacity-70">
						<For each={Array.from({ length: 8 })}>
							{() => <div class="rounded-full bg-foreground/30" />}
						</For>
					</div>
					<Overlay class="relative rounded-xl px-5 py-3">
						<span class="font-medium text-foreground text-sm">Floating panel</span>
					</Overlay>
				</div>
			</Specimen>

			<Specimen name="ResizablePanelGroup" span={2}>
				<Axis of="direction">
					<div class="h-40 w-full overflow-hidden rounded-md border border-border/50">
						<ResizablePanelGroup direction="horizontal">
							<ResizablePanel defaultSize={40} minSize={20}>
								<div class="flex h-full items-center justify-center bg-muted/30 p-4 font-mono text-muted-foreground text-xs">
									Sidebar
								</div>
							</ResizablePanel>
							<ResizableHandle withHandle />
							<ResizablePanel defaultSize={60} minSize={20}>
								<div class="flex h-full items-center justify-center bg-card/40 p-4 font-mono text-muted-foreground text-xs">
									Content
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				</Axis>
			</Specimen>
		</CatalogGroup>
	);
}
