import { For } from "solid-js";
import themeCss from "../../src/styles/theme.css?raw";
import { parseThemeBlock } from "../../src/tokens";

const ROOT = parseThemeBlock(themeCss, ":root");
const SHADOW = /^--shadow(-(2xs|xs|sm|md|lg|xl|2xl))?$/;
const STEPS = Object.entries(ROOT).filter(([name]) => SHADOW.test(name));

export default function Elevation() {
	return (
		<section class="flex flex-col gap-4" data-foundation="elevation">
			<p class="text-muted-foreground text-sm">
				The shadow tokens theme.css declares. Glass owns its own box-shadow, so these dress the flat
				surfaces only.
			</p>
			<div class="grid grid-cols-1 gap-6 p-2 sm:grid-cols-2 lg:grid-cols-4">
				<For each={STEPS}>
					{([name, value]) => (
						<div class="flex flex-col gap-2">
							<div
								class="h-24 rounded-lg border border-border bg-card"
								style={{ "box-shadow": `var(${name})` }}
							/>
							<code class="font-mono text-foreground text-xs">{name}</code>
							<code class="font-mono text-[10px] text-muted-foreground">{value}</code>
						</div>
					)}
				</For>
			</div>
		</section>
	);
}
