import { createMemo, createSignal, For, onMount } from "solid-js";
import { CARD_BLUR } from "../../src";
import { Button, Slider, ToggleGroup, ToggleGroupItem } from "../../src/solid";
import themeCss from "../../src/styles/theme.css?raw";
import { parseThemeBlock } from "../../src/tokens";

/** Every `--glass-*` knob SPEC.md documents, set inline on one bare `.glass`
 *  element. No default is typed here: each one is read back from the theme, so
 *  an untouched knob and its label cannot disagree with the formula. */

const ROOT_BLOCK = parseThemeBlock(themeCss, ":root");

interface Knob {
	name: string;
	max: number;
	/** Slider ticks per CSS unit: 100 turns a 0..1 number into a 0..100 slider. */
	factor: number;
	compose: (value: number) => string;
	strength?: (raw: string) => number | null;
	fallback?: (own: CSSStyleDeclaration) => string;
}

const percent = (value: number) => `${value}%`;
const plain = (value: number) => String(value);
const mix = (color: string) => (value: number) =>
	`color-mix(in srgb, ${color} ${value}%, transparent)`;
const mixStrength = (raw: string) => {
	const share = /([\d.]+)%\s*,\s*transparent\s*\)\s*$/.exec(raw);
	if (share?.[1]) return Number(share[1]);
	return raw ? 100 : null;
};

function numeric(raw: string): number | null {
	const direct = /^(-?[\d.]+)(?:%|px|deg)?$/.exec(raw);
	if (direct?.[1]) return Number(direct[1]);
	const divided = /^calc\(\s*(-?[\d.]+)(?:%|px|deg)?\s*\/\s*(-?[\d.]+)\s*\)$/.exec(raw);
	if (divided?.[1] && divided[2]) return Number(divided[1]) / Number(divided[2]);
	const share = /(-?[\d.]+)%/.exec(raw);
	return share?.[1] ? Number(share[1]) : null;
}

const KNOBS: Knob[] = [
	{
		name: "--glass-base",
		max: 100,
		factor: 1,
		compose: mix("var(--card)"),
		strength: mixStrength,
	},
	{
		name: "--glass-edge",
		max: 100,
		factor: 1,
		compose: mix("var(--border)"),
		strength: mixStrength,
	},
	{ name: "--glass-wash", max: 100, factor: 1, compose: percent },
	{ name: "--glass-wash-2", max: 100, factor: 1, compose: percent },
	{ name: "--glass-wash-angle", max: 360, factor: 1, compose: (v) => `${v}deg` },
	{ name: "--glass-light", max: 1, factor: 100, compose: plain },
	{
		name: "--glass-sheen",
		max: 300,
		factor: 1,
		compose: (v) => `${v}% ${v}%`,
		fallback: (own) =>
			/radial-gradient\(\s*([\d.]+%\s+[\d.]+%)\s+at/.exec(own.backgroundImage)?.[1] ?? "",
	},
	{ name: "--glass-shade", max: 1, factor: 100, compose: plain },
	{ name: "--glass-glow", max: 100, factor: 1, compose: percent },
	{ name: "--glass-drop", max: 100, factor: 1, compose: percent },
	{ name: "--glass-lift", max: 1, factor: 100, compose: plain },
	{ name: "--glass-rim", max: 1, factor: 100, compose: plain },
	{ name: "--glass-text", max: 100, factor: 1, compose: percent },
	{
		name: "--glass-blur",
		max: 40,
		factor: 1,
		compose: (v) => `${v}px`,
		fallback: (own) => /blur\(([\d.]+px)\)/.exec(own.backdropFilter)?.[1] ?? "",
	},
];

/** [name, `--glass-tone` value]. Tone takes any CSS color; these are the
 *  semantic presets, and `neutral` is tone off. */
const TONES: [string, string][] = [
	["neutral", ""],
	["primary", "var(--primary)"],
	["accent", "var(--accent)"],
	["success", "var(--success)"],
	["warning", "var(--warning)"],
	["destructive", "var(--destructive)"],
];

const RIMS: [string, string][] = [
	["raised", ""],
	["recessed", "glass-sink"],
];

interface Derived {
	value: string;
	source: string;
}

function derive(name: string, root: CSSStyleDeclaration, own: CSSStyleDeclaration): Derived {
	const declared = ROOT_BLOCK[name];
	if (declared) return { value: declared, source: "theme.css" };
	const fromRoot = root.getPropertyValue(name).trim();
	if (fromRoot) return { value: fromRoot, source: ":root" };
	return { value: own.getPropertyValue(name).trim(), source: ".glass" };
}

export default function GlassPlayground() {
	const [derived, setDerived] = createSignal<Record<string, Derived>>({});
	const [ticks, setTicks] = createSignal<Record<string, number>>({});
	const [tone, setTone] = createSignal("");
	const [tone2, setTone2] = createSignal("");
	const [sink, setSink] = createSignal("");
	let sample: HTMLDivElement | undefined;

	onMount(() => {
		const el = sample;
		if (!el) return;
		const root = getComputedStyle(document.documentElement);
		const own = getComputedStyle(el);
		const read: Record<string, Derived> = {};
		for (const knob of [...KNOBS, { name: "--glass-tone" }, { name: "--glass-tone-2" }]) {
			read[knob.name] = derive(knob.name, root, own);
		}
		for (const knob of KNOBS) {
			const found = read[knob.name];
			if (knob.fallback && !found?.value) {
				read[knob.name] = { value: knob.fallback(own), source: "the formula's own fallback" };
			}
		}
		setDerived(read);
	});

	const defaultTick = (knob: Knob) => {
		const raw = derived()[knob.name]?.value ?? "";
		const parse = knob.strength ?? numeric;
		const value = parse(raw);
		return value === null ? 0 : Math.round(value * knob.factor);
	};
	const tickAt = (knob: Knob) => ticks()[knob.name] ?? defaultTick(knob);
	const shown = (knob: Knob) => {
		const touched = ticks()[knob.name];
		return touched === undefined
			? (derived()[knob.name]?.value ?? "")
			: knob.compose(touched / knob.factor);
	};

	const style = createMemo(() => {
		const out: Record<string, string> = {};
		for (const knob of KNOBS) {
			const tick = ticks()[knob.name];
			if (tick !== undefined) out[knob.name] = knob.compose(tick / knob.factor);
		}
		if (tone()) out["--glass-tone"] = tone();
		if (tone2()) out["--glass-tone-2"] = tone2();
		return out;
	});

	const reset = () => {
		setTicks({});
		setTone("");
		setTone2("");
		setSink("");
	};
	const toneName = createMemo(() => TONES.find(([, v]) => v === tone())?.[0] ?? "custom");
	const tone2Name = createMemo(() => TONES.find(([, v]) => v === tone2())?.[0] ?? "custom");

	return (
		<section class="flex flex-col gap-3" data-foundation="glass-playground">
			<p class="text-muted-foreground text-sm">
				One bare .glass element. Every knob starts at the value the theme itself reports, so the
				labels below cannot drift from the material.
			</p>
			<div
				class="relative flex w-full flex-col gap-6 overflow-hidden rounded-lg p-6 lg:flex-row"
				style={{
					background:
						"radial-gradient(32% 44% at 12% 16%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%), radial-gradient(30% 42% at 88% 84%, color-mix(in srgb, var(--primary) 44%, transparent), transparent 70%), var(--background)",
				}}
			>
				<div class="flex min-w-0 items-start justify-center lg:w-[360px] lg:shrink-0">
					<div
						ref={sample}
						class={`glass ${CARD_BLUR} w-full max-w-sm rounded-2xl p-4 ${tone() ? "glass-tint" : ""} ${sink()}`}
						style={style()}
					>
						<p class="font-semibold text-sm">Live glass</p>
						<p class="mt-1 text-muted-foreground text-xs">
							every knob, tone and rim is set inline on this one element
						</p>
						<div class="mt-4 h-16 rounded-md border border-border/40" />
					</div>
				</div>

				<div class="flex w-full min-w-0 flex-col gap-4 lg:flex-1">
					<div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
						<For each={KNOBS}>
							{(knob) => (
								<div class="flex flex-col gap-1">
									<span class="flex items-baseline justify-between gap-2">
										<code class="shrink-0 font-mono text-foreground text-xs">{knob.name}</code>
										<code class="min-w-0 truncate font-mono text-[11px] text-primary tabular-nums">
											{shown(knob)}
										</code>
									</span>
									<Slider
										min={0}
										max={knob.max * knob.factor}
										value={[tickAt(knob)]}
										onChange={(v) => {
											const next = v[0];
											if (next !== undefined) setTicks((p) => ({ ...p, [knob.name]: next }));
										}}
										aria-label={knob.name}
									/>
									<span class="flex items-baseline gap-1.5 text-[10px] text-muted-foreground">
										<span class="shrink-0 rounded bg-muted px-1 font-mono">
											{derived()[knob.name]?.source ?? ""}
										</span>
										<code class="min-w-0 truncate">{derived()[knob.name]?.value ?? ""}</code>
									</span>
								</div>
							)}
						</For>
					</div>

					<div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
						<div class="flex flex-col gap-1.5">
							<span class="flex items-baseline justify-between">
								<code class="font-mono text-foreground text-xs">--glass-tone</code>
								<span class="font-mono text-[11px] text-primary">{toneName()}</span>
							</span>
							<ToggleGroup size="sm" value={tone()} onChange={(v) => setTone(v ?? "")}>
								<For each={TONES}>
									{([name, value]) => (
										<ToggleGroupItem value={value} aria-label={name}>
											<span
												class="size-4 rounded-full border border-border/60"
												style={{ background: value || "transparent" }}
											/>
										</ToggleGroupItem>
									)}
								</For>
							</ToggleGroup>
							<span class="flex items-baseline gap-1.5 text-[10px] text-muted-foreground">
								<span class="shrink-0 rounded bg-muted px-1 font-mono">
									{derived()["--glass-tone"]?.source ?? ""}
								</span>
								<code class="truncate">{derived()["--glass-tone"]?.value ?? ""}</code>
							</span>
						</div>

						<div class="flex flex-col gap-1.5">
							<span class="flex items-baseline justify-between">
								<code class="font-mono text-foreground text-xs">--glass-tone-2</code>
								<span class="font-mono text-[11px] text-primary">{tone2Name()}</span>
							</span>
							<ToggleGroup size="sm" value={tone2()} onChange={(v) => setTone2(v ?? "")}>
								<For each={TONES}>
									{([name, value]) => (
										<ToggleGroupItem value={value} aria-label={`${name} second stop`}>
											<span
												class="size-4 rounded-full border border-border/60"
												style={{ background: value || "transparent" }}
											/>
										</ToggleGroupItem>
									)}
								</For>
							</ToggleGroup>
							<span class="flex items-baseline gap-1.5 text-[10px] text-muted-foreground">
								<span class="shrink-0 rounded bg-muted px-1 font-mono">
									{derived()["--glass-tone-2"]?.source ?? ""}
								</span>
								<code class="truncate">{derived()["--glass-tone-2"]?.value ?? ""}</code>
							</span>
						</div>
					</div>

					<div class="flex flex-wrap items-end justify-between gap-4">
						<div class="flex flex-col gap-1.5">
							<code class="font-mono text-foreground text-xs">rim mode (.glass-sink)</code>
							<ToggleGroup size="sm" value={sink()} onChange={(v) => setSink(v ?? "")}>
								<For each={RIMS}>
									{([label, value]) => (
										<ToggleGroupItem value={value} class="font-mono text-[11px]">
											{label}
										</ToggleGroupItem>
									)}
								</For>
							</ToggleGroup>
						</div>
						<Button variant="outline" size="sm" onClick={reset}>
							Reset to derived
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
