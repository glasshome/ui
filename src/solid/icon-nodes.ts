interface TrustedPolicy {
  createHTML(input: string): string;
}
let policy: TrustedPolicy | null | undefined;

// Icon bodies come from the build or the host's own icon route; under a
// require-trusted-types-for CSP the assignment still needs a policy.
export function trusted(html: string): string {
  if (policy === undefined) {
    const tt = (
      globalThis as {
        trustedTypes?: { createPolicy(name: string, rules: TrustedPolicy): TrustedPolicy };
      }
    ).trustedTypes;
    try {
      policy = tt ? tt.createPolicy("glasshome-ui", { createHTML: (s) => s }) : null;
    } catch {
      policy = null;
    }
  }
  return policy ? policy.createHTML(html) : html;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function parseBody(body: string): Element {
  const holder = document.createElementNS(SVG_NAMESPACE, "svg");
  holder.innerHTML = trusted(body);
  return holder;
}

export interface BodyParseCache {
  /** Fresh copies of the nodes `parse` makes for `body`; the caller owns them. */
  nodes(body: string): Node[];
}

/**
 * Parses each distinct body once and hands every caller its own deep copy, so no two icons
 * share a node. Holds at most `limit` bodies; past that the oldest is dropped and parsed again
 * if asked for later. A `parse` that throws leaves nothing cached.
 */
export function createBodyParseCache(
  limit: number,
  parse: (body: string) => Element,
): BodyParseCache {
  // A Map iterates in insertion order, so its first key is the oldest body.
  const parsed = new Map<string, Element>();
  return {
    nodes(body) {
      if (!body) return [];
      let holder = parsed.get(body);
      if (!holder) {
        holder = parse(body);
        if (parsed.size >= limit) {
          const oldest = parsed.keys().next();
          if (!oldest.done) parsed.delete(oldest.value);
        }
        parsed.set(body, holder);
      }
      return Array.from(holder.childNodes, (node) => node.cloneNode(true));
    },
  };
}

const MAX_PARSED_BODIES = 512;
const bodies = createBodyParseCache(MAX_PARSED_BODIES, parseBody);

/** The nodes of one icon body, parsed once per distinct body. Needs a DOM. */
export function iconNodes(body: string): Node[] {
  return bodies.nodes(body);
}
