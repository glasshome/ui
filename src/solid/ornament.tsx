import { Match, Switch } from "solid-js";
import { ALERT_ICON_BG_CLASS, alertIconBgStyle, iconBgMaskStyle } from "../lib/alert-tones.js";

/* The big glyph bleeding out of a card's lower-right corner (HeroAction,
 * HeroOption, OptionCard). "arrow" is always on, in the card's tone, and
 * nudges on hover; "check" is the selection mark, in the card's tone as
 * well, fading in while an ancestor carries data-checked. Absolutely positioned, a sibling of the
 * card's row, so it never competes for row gap. */
export function Ornament(props: { kind: "arrow" | "check" | "none" }) {
  return (
    <Switch>
      <Match when={props.kind === "arrow"}>
        <span
          data-slot="ornament-arrow"
          class={`${ALERT_ICON_BG_CLASS} transition-transform duration-(--duration-state) group-hover:translate-x-1`}
          style={alertIconBgStyle("var(--surface-tone)")}
          aria-hidden="true"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </Match>
      <Match when={props.kind === "check"}>
        <span
          data-slot="ornament-check"
          class={`${ALERT_ICON_BG_CLASS} opacity-0 transition-opacity duration-(--duration-state) [[data-checked]_&]:opacity-[0.32]`}
          style={iconBgMaskStyle("var(--surface-tone)")}
          aria-hidden="true"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </Match>
    </Switch>
  );
}
