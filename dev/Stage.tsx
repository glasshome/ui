// A real viewport, not a CSS box: use-is-mobile reads window.innerWidth and modals portal to body (GALLERY.md, Shell).
import { createSignal, For, onCleanup, onMount } from "solid-js";
import { Icon, ToggleGroup, ToggleGroupItem } from "../src/solid";

interface StageWidth {
	id: string;
	label: string;
	icon: string;
	width: number;
	height: number;
}

const PHONE: StageWidth = {
	id: "phone",
	label: "Phone",
	icon: "lucide:smartphone",
	width: 390,
	height: 844,
};
const TABLET: StageWidth = {
	id: "tablet",
	label: "Tablet",
	icon: "lucide:tablet",
	width: 834,
	height: 1112,
};
const DESKTOP: StageWidth = {
	id: "desktop",
	label: "Desktop",
	icon: "lucide:monitor",
	width: 1280,
	height: 900,
};

const WIDTHS = [PHONE, TABLET, DESKTOP];
const CHROME_HEIGHT = 260;

function useParentTheme() {
	const read = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
	const [theme, setTheme] = createSignal(read());
	const observer = new MutationObserver(() => setTheme(read()));
	observer.observe(document.documentElement, { attributeFilter: ["class"] });
	onCleanup(() => observer.disconnect());
	return theme;
}

export function Stage(props: { route: string }) {
	const theme = useParentTheme();
	const [size, setSize] = createSignal(DESKTOP);
	const [hostWidth, setHostWidth] = createSignal(0);
	const [viewportHeight, setViewportHeight] = createSignal(window.innerHeight);
	let host: HTMLDivElement | undefined;

	onMount(() => {
		const observer = new ResizeObserver((entries) => {
			const first = entries[0];
			if (first) setHostWidth(first.contentRect.width);
		});
		if (host) observer.observe(host);
		const onResize = () => setViewportHeight(window.innerHeight);
		window.addEventListener("resize", onResize);
		onCleanup(() => {
			observer.disconnect();
			window.removeEventListener("resize", onResize);
		});
	});

	const available = () => hostWidth() || size().width;
	const scale = () => Math.min(1, available() / size().width);
	const frameHeight = () =>
		Math.min(size().height, Math.max(360, viewportHeight() - CHROME_HEIGHT));
	const offset = () => Math.max(0, (available() - size().width * scale()) / 2);

	const pick = (value: string | string[] | null) => {
		const next = WIDTHS.find((w) => w.id === value);
		if (next) setSize(next);
	};

	return (
		<div class="flex flex-col gap-3">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<ToggleGroup value={size().id} onChange={pick}>
					<For each={WIDTHS}>
						{(width) => (
							<ToggleGroupItem value={width.id}>
								<Icon icon={width.icon} width="16" height="16" />
								{width.label}
							</ToggleGroupItem>
						)}
					</For>
				</ToggleGroup>
				<span class="font-mono text-muted-foreground text-xs">
					{size().width} × {size().height}
				</span>
			</div>
			<div ref={host} class="w-full" style={{ height: `${frameHeight() * scale()}px` }}>
				<iframe
					title={`${props.route} at ${size().label} width`}
					src={`/stage.html#/${props.route}?theme=${theme()}`}
					class="rounded-xl border border-border/60 bg-background"
					style={{
						width: `${size().width}px`,
						height: `${frameHeight()}px`,
						transform: `translateX(${offset()}px) scale(${scale()})`,
						"transform-origin": "top left",
					}}
				/>
			</div>
		</div>
	);
}
