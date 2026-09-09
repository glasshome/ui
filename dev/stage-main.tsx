// One entry, no chrome (stage.html#/screens/settings-shape?theme=dark); the theme rides in the hash because a class on the parent's documentElement stops at the iframe.
import { bundled } from "virtual:gallery-icons";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Dynamic, render } from "solid-js/web";
import { provideIcons, Toaster } from "../src/solid";
import { findEntry } from "./routes";
import "./styles.css";

provideIcons({ bundled });

interface StageRoute {
	areaId: string;
	entryId: string;
	theme: string | null;
}

function readRoute(): StageRoute {
	const [path = "", query = ""] = window.location.hash.replace(/^#\/?/, "").split("?");
	const [areaId = "", entryId = ""] = path.split("/").filter(Boolean);
	return { areaId, entryId, theme: new URLSearchParams(query).get("theme") };
}

function useStageRoute() {
	const [route, setRoute] = createSignal(readRoute());
	const onChange = () => setRoute(readRoute());
	window.addEventListener("hashchange", onChange);
	onCleanup(() => window.removeEventListener("hashchange", onChange));
	return route;
}

function StageEntry() {
	const route = useStageRoute();
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
	const entry = () => findEntry(route().areaId, route().entryId);

	createEffect(() => {
		const theme = route().theme;
		const dark = theme === null ? prefersDark.matches : theme === "dark";
		document.documentElement.classList.toggle("dark", dark);
	});

	return (
		<div class="min-h-screen bg-background text-foreground">
			<Show when={entry()}>{(e) => <Dynamic component={e().component} />}</Show>
			<Toaster />
		</div>
	);
}

render(() => <StageEntry />, document.getElementById("root") as HTMLElement);
