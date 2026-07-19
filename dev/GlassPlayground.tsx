import { createMemo, createSignal, For } from "solid-js";
import { Card, Slider, ToggleGroup, ToggleGroupItem } from "../src/solid";

/** Live glass demo: every `--glass-*` knob + tone + sink mode set inline on one
 *  Card. Defaults mirror what <Card> (CARD_SURFACE) renders, so the starting
 *  state IS a real card and each slider shows how far a knob can be pushed. */

type Knob = {
	key: string;
	prop: string;
	min: number;
	max: number;
	/** `%`/`px` render suffix, or `scale` for a 0..1 alpha shown as 0.00. */
	unit?: string;
	scale?: number;
	def: number;
};

const KNOBS: Knob[] = [
	{ key: "fill", prop: "--glass-base (card %)", min: 0, max: 100, unit: "%", def: 60 },
	{ key: "blur", prop: "--glass-blur", min: 0, max: 40, unit: "px", def: 24 },
	{ key: "light", prop: "--glass-light", min: 0, max: 100, scale: 100, def: 5 },
	{ key: "rim", prop: "--glass-rim", min: 0, max: 100, scale: 100, def: 30 },
	{ key: "shade", prop: "--glass-shade", min: 0, max: 30, scale: 100, def: 5 },
	{ key: "wash", prop: "--glass-wash", min: 0, max: 100, unit: "%", def: 20 },
	{ key: "text", prop: "--glass-text", min: 0, max: 100, unit: "%", def: 65 },
	{ key: "glow", prop: "--glass-glow", min: 0, max: 100, unit: "%", def: 16 },
	{ key: "drop", prop: "--glass-drop", min: 0, max: 100, unit: "%", def: 20 },
	{ key: "lift", prop: "--glass-lift", min: 0, max: 100, scale: 100, def: 45 },
];

/** [name, `--glass-tone` value, swatch color]. Tone takes any CSS color; these
 *  are the semantic presets. `neutral` = tone off; a non-neutral tone also adds
 *  `.glass-tint` so edge/text/wash pick up the tinted look, exactly like Badge. */
const TONES: [string, string, string][] = [
	["neutral", "transparent", "transparent"],
	["primary", "var(--primary)", "var(--primary)"],
	["accent", "var(--accent)", "var(--accent)"],
	["success", "var(--success)", "var(--success)"],
	["warning", "var(--warning)", "var(--warning)"],
	["destructive", "var(--destructive)", "var(--destructive)"],
];

const RIMS: [string, string][] = [
	["raised", ""],
	["recessed", "glass-sink"],
];

const DEFAULTS: Record<string, number> = Object.fromEntries(KNOBS.map((k) => [k.key, k.def]));

function knobValue(k: Knob, raw: number): string {
	return k.scale ? String(raw / k.scale) : `${raw}${k.unit ?? ""}`;
}

function knobVars(v: Record<string, number>): Record<string, string> {
	const out: Record<string, string> = {
		"--glass-base": `color-mix(in srgb, var(--card) ${v.fill}%, transparent)`,
	};
	for (const k of KNOBS) {
		if (k.key === "fill") continue;
		out[`--glass-${k.key}`] = knobValue(k, v[k.key]);
	}
	return out;
}

export function GlassPlayground() {
	const [vals, setVals] = createSignal<Record<string, number>>({ ...DEFAULTS });
	const [tone, setTone] = createSignal("transparent");
	const [sink, setSink] = createSignal("");

	const style = () => ({ "--glass-tone": tone(), ...knobVars(vals()) });

	const set = (key: string, n: number) => setVals((p) => ({ ...p, [key]: n }));
	const fmt = (k: Knob) => {
		const raw = vals()[k.key];
		return k.scale ? (raw / k.scale).toFixed(2) : `${raw}${k.unit ?? ""}`;
	};
	const toneName = createMemo(() => TONES.find(([, v]) => v === tone())?.[0] ?? "custom");

	return (
		<div
			class="relative flex w-full flex-col gap-6 overflow-hidden rounded-lg p-6 sm:flex-row"
			style={{
				background:
					"radial-gradient(32% 44% at 12% 16%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%), radial-gradient(30% 42% at 88% 84%, color-mix(in srgb, var(--primary) 44%, transparent), transparent 70%), var(--background)",
			}}
		>
			{/* the live element */}
			<div class="flex min-w-0 items-center justify-center sm:w-[420px] sm:shrink-0">
				<Card
					padding="md"
					class={`w-full max-w-sm ${tone() === "transparent" ? "" : "glass-tint"} ${sink()}`}
					style={style()}
				>
					<p class="font-semibold text-sm">Live glass card</p>
					<p class="mt-1 text-muted-foreground text-xs">
						every knob, tone and rim below is set inline on this one element
					</p>
					<div class="mt-4 h-16 rounded-md border border-border/40" />
				</Card>
			</div>

			{/* the knobs */}
			<div class="flex w-full min-w-0 flex-col gap-4 sm:flex-1">
				<div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
					<For each={KNOBS}>
						{(k) => (
							<div class="flex flex-col gap-1.5">
								<span class="flex items-baseline justify-between">
									<span class="font-mono text-foreground text-xs">{k.prop}</span>
									<span class="font-mono text-[11px] text-primary tabular-nums">{fmt(k)}</span>
								</span>
								<Slider
									min={k.min}
									max={k.max}
									value={[vals()[k.key]]}
									onChange={(v) => set(k.key, v[0])}
									aria-label={k.prop}
								/>
							</div>
						)}
					</For>
				</div>

				<div class="flex flex-col gap-1.5">
					<span class="flex items-baseline justify-between">
						<span class="font-mono text-foreground text-xs">--glass-tone</span>
						<span class="font-mono text-[11px] text-primary">{toneName()}</span>
					</span>
					<ToggleGroup size="sm" value={tone()} onChange={(v) => setTone(v ?? "transparent")}>
						<For each={TONES}>
							{([name, value, swatch]) => (
								<ToggleGroupItem value={value} aria-label={name}>
									<span
										class="size-4 rounded-full border border-border/60"
										style={{ background: swatch }}
									/>
								</ToggleGroupItem>
							)}
						</For>
					</ToggleGroup>
				</div>

				<div class="flex flex-col gap-1.5">
					<span class="font-mono text-foreground text-xs">rim mode (.glass-sink)</span>
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
			</div>
		</div>
	);
}
