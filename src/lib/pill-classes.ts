/* Small tinted things share the Badge material. A chip is a glass pill at the
 * theme's corner, so it squares off with a sharp theme (Badge, CountPill, scope
 * chips); an icon pill is the square-ish glass
 * well behind a glyph (SectionIcon, ItemMedia, EmptyMedia). Tone comes from the
 * caller's --glass-tone (via Badge's style or a [--glass-tone:…] utility);
 * neutral wells set none and read as foreground glass. */
export const CHIP =
	"glass glass-tint inline-flex w-fit shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-0.5 font-medium text-xs";

export const ICON_PILL =
	"glass flex shrink-0 items-center justify-center [--glass-rim:0.4] [--glass-light:0.08] [--glass-base:color-mix(in_srgb,var(--foreground)_10%,transparent)]";

export const ICON_PILL_TINT =
	"glass glass-tint flex shrink-0 items-center justify-center [--glass-rim:0.4] [--glass-wash:18%]";
