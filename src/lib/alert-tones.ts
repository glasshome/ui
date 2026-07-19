export type AlertTone = "info" | "warning" | "success" | "destructive";

export type AlertToneStyle = {
	color: string;
	icon: string;
	text: string;
};

/* Text mixes in oklab: no hue channel, a hued tone desaturates without swinging yellow. */
export const ALERT_TONES: Record<AlertTone, AlertToneStyle> = {
	info: {
		color: "var(--primary)",
		icon: "lucide:info",
		text: "var(--primary-tint-foreground)",
	},
	warning: {
		color: "var(--warning)",
		icon: "lucide:alert-triangle",
		text: "color-mix(in oklab, var(--warning) 55%, var(--foreground))",
	},
	success: {
		color: "var(--success)",
		icon: "lucide:check-circle-2",
		text: "color-mix(in oklab, var(--success) 60%, var(--foreground))",
	},
	destructive: {
		color: "var(--destructive)",
		icon: "lucide:alert-octagon",
		text: "color-mix(in oklab, var(--destructive) 65%, var(--foreground))",
	},
};

/* Lucide glyph paths (viewBox 0 0 24 24), rendered by both the Solid and Astro <Alert>. */
export const ALERT_ICON_PATHS: Record<AlertTone, string> = {
	info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
	warning:
		'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
	success: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
	destructive:
		'<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688A2 2 0 0 1 15.312 22H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/>',
};

/* srgb, not oklch: oklch drags a tone mixed toward transparent down to mud. */
export const alertBorder = (c: string) => `color-mix(in srgb, ${c} 28%, transparent)`;
export const alertFill = (c: string) => `color-mix(in srgb, ${c} 9%, transparent)`;
export const alertIconFill = (c: string) => `color-mix(in srgb, ${c} 16%, transparent)`;

export const ALERT_CLASS =
	"relative overflow-hidden flex items-start gap-3 rounded-lg border p-3 backdrop-blur-sm";
export const ALERT_ICON_CLASS =
	"flex size-8 shrink-0 items-center justify-center rounded-md [&>svg]:size-[18px]";
export const ALERT_ICON_BG_CLASS =
	"pointer-events-none absolute -right-3 -bottom-4 [&>svg]:size-28 [&>svg]:[stroke-width:2.5px]";
export function alertIconBgStyle(color: string): Record<string, string> {
	return {
		color,
		opacity: "0.32",
		"-webkit-mask-image": "radial-gradient(140% 140% at 100% 100%, #000 45%, transparent 95%)",
		"mask-image": "radial-gradient(140% 140% at 100% 100%, #000 45%, transparent 95%)",
	};
}
export const ALERT_CONTENT_CLASS = "relative z-10 min-w-0 flex-1";
export const ALERT_TITLE_CLASS = "font-semibold text-base leading-snug";
export const ALERT_DESCRIPTION_CLASS =
	"text-foreground/80 text-sm leading-snug [&:not(:first-child)]:mt-0.5";
