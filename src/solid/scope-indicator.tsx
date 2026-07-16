/**
 * Scope pill: `@scope (personal|org)`. The publisher-scope marker shared across
 * widget cards and detail surfaces in both apps.
 */
export function ScopeIndicator(props: { scope: string; type: "personal" | "organization" }) {
	return (
		<span class="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 font-mono text-muted-foreground text-xs">
			@{props.scope}{" "}
			<span class="text-xs">({props.type === "personal" ? "personal" : "org"})</span>
		</span>
	);
}
