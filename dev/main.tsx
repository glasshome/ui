/* Dev-only gallery entry (`bun run dev:gallery`): every package primitive live,
 * hot-reloading against src. Never shipped. */

import { createSignal, Show } from "solid-js";
import { render } from "solid-js/web";
import { Button, Toaster } from "../src/solid";
import { PackageCatalog } from "./PackageCatalog";
import "./styles.css";

function Gallery() {
	const [dark, setDark] = createSignal(window.matchMedia("(prefers-color-scheme: dark)").matches);
	const apply = (d: boolean) => {
		setDark(d);
		document.documentElement.classList.toggle("dark", d);
	};
	apply(dark());

	return (
		<div class="min-h-screen bg-background text-foreground">
			<header class="sticky top-0 z-50 flex items-center justify-between gap-4 border-border/50 border-b bg-background/80 px-6 py-3 backdrop-blur-md">
				<div>
					<span class="font-bold text-lg">@glasshome/ui</span>
					<span class="ml-3 text-muted-foreground text-sm">
						live gallery — edits to src hot-reload
					</span>
				</div>
				<Button variant="outline" size="sm" onClick={() => apply(!dark())}>
					<Show when={dark()} fallback={"Dark"}>
						Light
					</Show>
				</Button>
			</header>
			<main class="mx-auto max-w-6xl px-6 py-8">
				<PackageCatalog />
			</main>
			<Toaster />
		</div>
	);
}

render(() => <Gallery />, document.getElementById("root") as HTMLElement);
