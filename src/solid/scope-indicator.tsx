import { Badge } from "./badge.js";

/**
 * Scope pill: `@scope (personal|org)`. The publisher-scope marker shared across
 * widget cards and detail surfaces in both apps.
 */
export function ScopeIndicator(props: { scope: string; type: "personal" | "organization" }) {
  return (
    <Badge tone="var(--muted-foreground)" class="gap-1 font-mono font-normal">
      @{props.scope} <span>({props.type === "personal" ? "personal" : "org"})</span>
    </Badge>
  );
}
