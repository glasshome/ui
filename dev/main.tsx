/* Dev-only gallery entry (`bun run dev:gallery`): every package primitive live,
 * hot-reloading against src. Never shipped. */

import { bundled } from "virtual:gallery-icons";
import { createSignal, For, onCleanup, Show } from "solid-js";
import { Dynamic, render } from "solid-js/web";
import { CARD_SURFACE } from "../src/index.js";
import { cn } from "../src/lib/utils.js";
import {
	Button,
	Card,
	CardTitle,
	Dock,
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	Icon,
	provideIcons,
	Toaster,
} from "../src/solid";
import PackageCatalog from "./PackageCatalog";
import { AREAS, type Area, findEntry } from "./routes";
import { Stage } from "./Stage";
import "./styles.css";

provideIcons({ bundled });

function useHash() {
	const read = () => window.location.hash.replace(/^#\/?/, "");
	const [hash, setHash] = createSignal(read());
	const onChange = () => setHash(read());
	window.addEventListener("hashchange", onChange);
	onCleanup(() => window.removeEventListener("hashchange", onChange));
	return hash;
}

function AreaIndex() {
	return (
		<div class="grid gap-4 sm:grid-cols-3">
			<For each={AREAS}>
				{(area) => (
					<Card
						as="a"
						href={`#/${area.id}/${area.entries[0]?.id ?? ""}`}
						interactive
						ornament="arrow"
						padding="md"
						class="gap-5 py-8"
					>
						<Icon icon={area.icon} width="32" height="32" class="text-primary" />
						<CardTitle class="text-lg">{area.title}</CardTitle>
					</Card>
				)}
			</For>
		</div>
	);
}

function AreaView(props: { area: Area; entryId: string }) {
	const entry = () => findEntry(props.area.id, props.entryId) ?? props.area.entries[0];
	return (
		<Show
			when={props.area.entries.length > 0}
			fallback={
				<Empty>
					<EmptyHeader>
						<EmptyMedia media="icon">
							<Icon icon={props.area.icon} />
						</EmptyMedia>
						<EmptyTitle>{props.area.title} has nothing to show yet</EmptyTitle>
						<EmptyDescription>No entries are wired into this area.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			}
		>
			<Show when={entry()}>
				{(e) => (
					<Show when={props.area.id === "screens"} fallback={<Dynamic component={e().component} />}>
						<Stage route={`${props.area.id}/${e().id}`} />
					</Show>
				)}
			</Show>
		</Show>
	);
}

function Gallery() {
	const hash = useHash();
	const [dark, setDark] = createSignal(window.matchMedia("(prefers-color-scheme: dark)").matches);
	const apply = (d: boolean) => {
		setDark(d);
		document.documentElement.classList.toggle("dark", d);
	};
	apply(dark());

	const parts = () => hash().split("/").filter(Boolean);
	const areaId = () => parts()[0] ?? "";
	const entryId = () => parts()[1] ?? "";
	const area = () => AREAS.find((a) => a.id === areaId());
	// `#/all` is the shoot-everything route: every specimen, no chrome around it.
	const bare = () => areaId() === "all";

	const dockItems = () =>
		AREAS.map((a) => ({
			id: a.id,
			icon: <Icon icon={a.icon} width="24" height="24" />,
			label: a.title,
			isActive: a.id === areaId(),
			onClick: () => {
				window.location.hash = `#/${a.id}/${a.entries[0]?.id ?? ""}`;
			},
		}));

	return (
		<>
			<Show
				when={!bare()}
				fallback={
					<div class="min-h-screen bg-background text-foreground">
						<main class="mx-auto max-w-6xl px-6 py-8">
							<PackageCatalog />
						</main>
					</div>
				}
			>
				<div class="min-h-screen bg-background pb-28 text-foreground">
					<header class="sticky top-0 z-50 flex w-full justify-center px-3 pt-2 sm:px-4 sm:pt-3 md:pt-4">
						<div
							class={cn(
								CARD_SURFACE,
								"flex h-14 w-full max-w-6xl items-center gap-3 rounded-2xl px-4 sm:h-16 sm:gap-4 sm:px-5",
							)}
						>
							<a class="hidden shrink-0 font-bold sm:block sm:text-lg" href="#/">
								@glasshome/ui
							</a>
							<nav
								class="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto sm:justify-center sm:gap-2"
								aria-label="Pages in this area"
							>
								<For each={area()?.entries ?? []}>
									{(e) => (
										<a
											href={`#/${areaId()}/${e.id}`}
											aria-current={e.id === entryId() ? "page" : undefined}
											class="whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-sm transition-colors"
											classList={{
												"bg-muted text-foreground": e.id === entryId(),
												"text-muted-foreground hover:text-primary": e.id !== entryId(),
											}}
										>
											{e.title}
										</a>
									)}
								</For>
							</nav>
							<Button variant="ghost" size="sm" class="shrink-0" onClick={() => apply(!dark())}>
								<Show when={dark()} fallback={"Dark"}>
									Light
								</Show>
							</Button>
						</div>
					</header>
					<main class="mx-auto max-w-6xl px-6 py-8">
						<Show when={area()} fallback={<AreaIndex />}>
							{(current) => <AreaView area={current()} entryId={entryId()} />}
						</Show>
					</main>
					<nav class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2" aria-label="Gallery areas">
						<Dock items={dockItems()} dockMode="floating" />
					</nav>
				</div>
			</Show>
			<Toaster />
		</>
	);
}

render(() => <Gallery />, document.getElementById("root") as HTMLElement);
