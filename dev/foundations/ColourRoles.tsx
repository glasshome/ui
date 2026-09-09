import { For, Show } from "solid-js";
import themeCss from "../../src/styles/theme.css?raw";
import { contrastRatio, parseThemeBlock } from "../../src/tokens";

const LIGHT = parseThemeBlock(themeCss, ":root");
const DARK = parseThemeBlock(themeCss, ".dark");

const ROLES = [
	"--foreground",
	"--muted-foreground",
	"--primary",
	"--accent",
	"--secondary",
	"--border",
	"--ring",
	"--success",
	"--warning",
	"--destructive",
	"--love",
	"--chart-1",
	"--chart-2",
	"--chart-3",
	"--chart-4",
	"--chart-5",
];

interface Swatch {
	name: string;
	value: string;
	literal: boolean;
	ratio: number | null;
}

function swatches(vars: Record<string, string>): Swatch[] {
	const background = vars["--background"] ?? "";
	return ROLES.map((name) => {
		const value = vars[name] ?? "";
		const literal = value.startsWith("oklch(");
		if (!literal || !background) return { name, value, literal, ratio: null };
		try {
			return { name, value, literal, ratio: contrastRatio(value, background) };
		} catch {
			return { name, value, literal: false, ratio: null };
		}
	});
}

function Column(props: { theme: string; vars: Record<string, string> }) {
	const background = () => props.vars["--background"] ?? "";
	const foreground = () => props.vars["--foreground"] ?? "";
	const border = () => props.vars["--border"] ?? "";
	return (
		<div
			class="flex flex-col gap-3 rounded-xl border p-4"
			style={{ background: background(), color: foreground(), "border-color": border() }}
		>
			<header class="flex items-baseline justify-between gap-3">
				<span class="font-semibold text-sm">{props.theme}</span>
				<code class="truncate font-mono text-[11px] opacity-70">--background {background()}</code>
			</header>
			<ul class="flex flex-col gap-2">
				<For each={swatches(props.vars)}>
					{(role) => (
						<li class="flex items-center gap-3">
							<Show
								when={role.literal}
								fallback={
									<span
										class="size-9 shrink-0 rounded-md border border-dashed"
										style={{ "border-color": foreground() }}
									/>
								}
							>
								<span
									class="size-9 shrink-0 rounded-md border"
									style={{ background: role.value, "border-color": border() }}
								/>
							</Show>
							<span class="flex min-w-0 flex-1 flex-col">
								<code class="font-mono text-xs">{role.name}</code>
								<code class="truncate font-mono text-[10px] opacity-60">{role.value}</code>
							</span>
							<Show
								when={role.ratio}
								fallback={<span class="text-[10px] opacity-60">no literal oklch</span>}
							>
								{(ratio) => (
									<span class="font-mono text-xs tabular-nums">{ratio().toFixed(2)}:1</span>
								)}
							</Show>
						</li>
					)}
				</For>
			</ul>
		</div>
	);
}

export default function ColourRoles() {
	return (
		<section class="flex flex-col gap-4" data-foundation="colour-roles">
			<p class="text-muted-foreground text-sm">
				Every role in both themes, measured against that theme's --background.
			</p>
			<div class="grid gap-4 lg:grid-cols-2">
				<Column theme="light" vars={LIGHT} />
				<Column theme="dark" vars={DARK} />
			</div>
		</section>
	);
}
