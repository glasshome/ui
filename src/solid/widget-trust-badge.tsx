import { Show } from "solid-js";

/**
 * Official / Community trust marker, single source for every widget surface
 * (browser card, picker card, detail dialog) in both apps. Was drifted: hub used
 * `lucide:badge-check`, dash used `mdi:check-decagram`; unified on the decagram,
 * inlined as SVG so it needs no iconify collection registered by the consumer
 * (hub has no `mdi` collection). The `title` is hover-only and ignored by screen
 * readers, so the sr-only span carries the verbal label alongside the glyph.
 *
 * Both states are glyph-only: official is the decagram check (primary),
 * community is the account-group people icon (muted). Community was a full
 * `Badge` word before, but the label ate horizontal space next to the widget
 * name, so it now matches the official marker's compact icon form.
 */
export function WidgetTrustBadge(props: { isOfficial: boolean }) {
	return (
		<Show
			when={props.isOfficial}
			fallback={
				<span class="inline-flex items-center text-muted-foreground" title="Community widget">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9 3.5 3.5 0 0 1 12 5.5M5 8c.56 0 1.08.15 1.53.42-.15 1.43.27 2.85 1.13 3.96C7.16 13.34 6.16 14 5 14a3 3 0 0 1-3-3 3 3 0 0 1 3-3m14 0a3 3 0 0 1 3 3 3 3 0 0 1-3 3c-1.16 0-2.16-.66-2.66-1.62a5.54 5.54 0 0 0 1.13-3.96c.45-.27.97-.42 1.53-.42M5.5 18.25c0-2.07 2.91-3.75 6.5-3.75s6.5 1.68 6.5 3.75V20h-13v-1.75M0 20v-1.5c0-1.39 1.89-2.56 4.45-2.9-.59.68-.95 1.62-.95 2.65V20H0m24 0h-3.5v-1.75c0-1.03-.36-1.97-.95-2.65 2.56.34 4.45 1.51 4.45 2.9V20Z" />
					</svg>
					<span class="sr-only">Community</span>
				</span>
			}
		>
			<span class="inline-flex items-center text-primary" title="Official GlassHome widget">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
				</svg>
				<span class="sr-only">Official</span>
			</span>
		</Show>
	);
}
