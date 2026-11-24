import { Badge } from "./badge.js";
import { useUiText } from "./locale.js";

/**
 * Scope pill: `@scope (personal|org)`. The publisher-scope marker shared across
 * widget cards and detail surfaces in both apps.
 */
export function ScopeIndicator(props: { scope: string; type: "personal" | "organization" }) {
  const text = useUiText();
  return (
    <Badge tone="var(--muted-foreground)" class="gap-1 font-mono font-normal">
      @{props.scope}{" "}
      <span>
        (
        {text(props.type === "personal" ? "ui.scope-indicator.personal" : "ui.scope-indicator.org")}
        )
      </span>
    </Badge>
  );
}
