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
			<Show when={props.area.entries.length > 1}>
				<nav class="mb-5 flex flex-wrap gap-2">
					<For each={props.area.entries}>
						{(e) => (
							<Button
								variant={e.id === props.entryId ? "secondary" : "ghost"}
								size="sm"
								onClick={() => {
									window.location.hash = `#/${props.area.id}/${e.id}`;
								}}
							>
								{e.title}
							</Button>
						)}
					</For>
				</nav>
			</Show>
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
				<div class="min-h-screen bg-background pb-16 text-foreground">
					<header class="sticky top-0 z-50 flex w-full justify-center px-3 pt-2 sm:px-4 sm:pt-3 md:pt-4">
						<div
							class={cn(
								CARD_SURFACE,
								"flex h-14 w-full max-w-6xl items-center gap-3 rounded-2xl px-4 sm:h-16 sm:gap-4 sm:px-5",
							)}
						>
							<a class="min-w-0 shrink truncate font-bold text-base sm:text-lg" href="#/">
								@glasshome/ui
							</a>
							<nav
								class="flex shrink-0 items-center justify-end gap-1 sm:flex-1 sm:justify-center sm:gap-2"
								aria-label="Gallery areas"
							>
								<For each={AREAS}>
									{(a) => (
										<a
											href={`#/${a.id}/${a.entries[0]?.id ?? ""}`}
											aria-current={a.id === areaId() ? "page" : undefined}
											class="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-sm transition-colors"
											classList={{
												"bg-muted text-foreground": a.id === areaId(),
												"text-muted-foreground hover:text-primary": a.id !== areaId(),
											}}
										>
											<Icon icon={a.icon} width="18" height="18" />
											<span class="hidden sm:inline">{a.title}</span>
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
				</div>
			</Show>
			<Toaster />
		</>
	);
}

render(() => <Gallery />, document.getElementById("root") as HTMLElement);
