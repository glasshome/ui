import { createSignal, For, onMount } from "solid-js";
import themeCss from "../../src/styles/theme.css?raw";
import { parseThemeBlock } from "../../src/tokens";

const ROOT = parseThemeBlock(themeCss, ":root");
const SCALE = parseThemeBlock(themeCss, "@theme inline");

const STEPS: [name: string, declared: string][] = [
	["--radius", ROOT["--radius"] ?? ""],
	...Object.entries(SCALE).filter(([name]) => name.startsWith("--radius-")),
];

/** Tailwind inlines an `@theme inline` token into its utilities and emits no
 *  custom property for most of them, so the ladder is drawn from the declared
 *  expression with each step substituted down to --radius, which does exist. */
function expand(value: string, depth = 0): string {
	if (depth > 4) return value;
	return value.replace(/var\((--radius-[\w-]+)\)/g, (whole: string, name: string) => {
		const inner = SCALE[name];
		return inner ? expand(inner, depth + 1) : whole;
	});
}

export default function Radii() {
	const [resolved, setResolved] = createSignal<Record<string, string>>({});
	const boxes = new Map<string, HTMLElement>();
	onMount(() => {
		const measured: Record<string, string> = {};
		for (const [name, box] of boxes) {
			measured[name] = getComputedStyle(box).borderTopLeftRadius;
		}
		setResolved(measured);
	});

	return (
		<section class="flex flex-col gap-4" data-foundation="radii">
			<p class="text-muted-foreground text-sm">
				The ladder every surface rounds to, each step declared against --radius.
			</p>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<For each={STEPS}>
					{([name, declared]) => (
						<div class="flex flex-col items-center gap-2">
							<div
								ref={(el) => boxes.set(name, el)}
								class="h-20 w-full border border-border bg-card"
								style={{ "border-radius": expand(declared) }}
							/>
							<code class="font-mono text-foreground text-xs">{name}</code>
							<code class="text-center font-mono text-[10px] text-muted-foreground">
								{declared}
							</code>
							<code class="font-mono text-[10px] text-primary tabular-nums">
								{resolved()[name] ?? ""}
							</code>
						</div>
					)}
				</For>
			</div>
		</section>
	);
}
