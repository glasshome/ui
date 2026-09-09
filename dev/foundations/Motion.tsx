import { createSignal, For } from "solid-js";
import { MODAL_MOTION, MORPH_MOTION, SETTLE_MOTION } from "../../src";
import { Button, Card } from "../../src/solid";
import themeCss from "../../src/styles/theme.css?raw";
import { parseThemeBlock } from "../../src/tokens";

const ROOT = parseThemeBlock(themeCss, ":root");

interface Play {
	duration: string;
	ease: string;
	using: string;
	class: string;
	state: "expanded" | "closed";
}

const PLAYS: Play[] = [
	{
		duration: "--duration-state",
		ease: "--ease-expand",
		using: "SETTLE_MOTION",
		class: SETTLE_MOTION,
		state: "expanded",
	},
	{
		duration: "--duration-expand",
		ease: "--ease-expand",
		using: "MODAL_MOTION, arriving",
		class: MODAL_MOTION,
		state: "expanded",
	},
	{
		duration: "--duration-micro",
		ease: "--ease-contract",
		using: "MODAL_MOTION, leaving",
		class: MODAL_MOTION,
		state: "closed",
	},
	{
		duration: "--duration-morph",
		ease: "--ease-morph",
		using: "MORPH_MOTION",
		class: MORPH_MOTION,
		state: "expanded",
	},
];

function Pair(props: { duration: string; ease: string; using: string }) {
	return (
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<span class="flex flex-wrap items-baseline gap-x-2">
				<code class="font-mono text-foreground text-xs">{props.duration}</code>
				<code class="font-mono text-[11px] text-primary tabular-nums">
					{ROOT[props.duration] ?? ""}
				</code>
			</span>
			<span class="flex flex-wrap items-baseline gap-x-2">
				<code class="font-mono text-foreground text-xs">{props.ease}</code>
				<code class="truncate font-mono text-[11px] text-primary">{ROOT[props.ease] ?? ""}</code>
			</span>
			<span class="text-[10px] text-muted-foreground">{props.using}</span>
		</div>
	);
}

function PlayRow(props: Play) {
	const [run, setRun] = createSignal(0);
	return (
		<div class="flex items-center gap-4 border-border/40 border-b py-4 last:border-b-0">
			<Pair duration={props.duration} ease={props.ease} using={props.using} />
			<div class="relative h-16 w-44 shrink-0">
				<For each={[run()]}>
					{() => (
						<div
							data-expanded={props.state === "expanded" ? "" : undefined}
							data-closed={props.state === "closed" ? "" : undefined}
							class={`absolute inset-0 rounded-lg border border-border bg-primary/25 ${props.class}`}
						/>
					)}
				</For>
			</div>
			<Button variant="outline" size="sm" onClick={() => setRun(run() + 1)}>
				Replay
			</Button>
		</div>
	);
}

function GlassStateRow() {
	const [lit, setLit] = createSignal(false);
	return (
		<div class="flex items-center gap-4 border-border/40 border-b py-4 last:border-b-0">
			<Pair
				duration="--duration-state"
				ease="--ease-emphasis"
				using="the .glass base transition: a tone swap never snaps"
			/>
			<Card
				padding="sm"
				class={`h-16 w-44 shrink-0 ${lit() ? "glass-tint" : ""}`}
				style={{ "--glass-tone": lit() ? "var(--accent)" : "transparent" }}
			>
				<span class="text-xs">--glass-tone</span>
			</Card>
			<Button variant="outline" size="sm" onClick={() => setLit(!lit())}>
				Swap
			</Button>
		</div>
	);
}

export default function Motion() {
	return (
		<section class="flex flex-col gap-4" data-foundation="motion">
			<p class="text-muted-foreground text-sm">
				Every duration and easing pair the theme declares, replayed through the exported motion
				classes. prefers-reduced-motion zeroes all of it.
			</p>
			<div class="flex flex-col">
				<For each={PLAYS}>{(play) => <PlayRow {...play} />}</For>
				<GlassStateRow />
			</div>
		</section>
	);
}
