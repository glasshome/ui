import { Show } from "solid-js";
import { Badge } from "./badge";

/**
 * Official / Community trust marker, single source for every widget surface
 * (browser card, picker card, detail dialog) in both apps. Was drifted: hub used
 * `lucide:badge-check`, dash used `mdi:check-decagram`; unified on the decagram,
 * inlined as SVG so it needs no iconify collection registered by the consumer
 * (hub has no `mdi` collection). The `title` is hover-only and ignored by screen
 * readers, so the sr-only span carries the verbal label alongside the glyph.
 */
export function WidgetTrustBadge(props: { isOfficial: boolean }) {
	return (
		<Show when={props.isOfficial} fallback={<Badge tone="var(--muted-foreground)">Community</Badge>}>
			<span class="inline-flex items-center text-primary" title="Official GlassHome widget">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
				</svg>
				<span class="sr-only">Official</span>
			</span>
		</Show>
	);
}
