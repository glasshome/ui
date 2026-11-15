import type { CDPSession } from "playwright";
import type { MarkerRow } from "./types";

const documentTree = async (cdp: CDPSession) =>
  (await cdp.send("DOM.getDocument", { depth: -1, pierce: true })).root;
type DomNode = Awaited<ReturnType<typeof documentTree>>;

const ELEMENT = 1;

function attributes(node: DomNode): Record<string, string> {
  const flat = node.attributes ?? [];
  const out: Record<string, string> = {};
  for (let i = 0; i + 1 < flat.length; i += 2) out[flat[i] ?? ""] = flat[i + 1] ?? "";
  return out;
}

async function part(cdp: CDPSession, node: DomNode, attrs: Record<string, string>) {
  const { nodes } = await cdp.send("Accessibility.getPartialAXTree", {
    backendNodeId: node.backendNodeId,
    fetchRelatives: false,
  });
  const ax = nodes[0];
  const role = typeof ax?.role?.value === "string" ? ax.role.value : "";
  const name = typeof ax?.name?.value === "string" ? ax.name.value.trim() : "";
  if (ax && !ax.ignored && role && name) return `${role} "${name}"`;
  const slot = attrs["data-slot"];
  return slot === undefined ? node.localName : `${node.localName}[data-slot=${slot}]`;
}

/** Every element carrying a `data-*` marker, closed shadow roots and portals included. */
export async function markers(cdp: CDPSession): Promise<MarkerRow[]> {
  const rows: MarkerRow[] = [];
  const walk = async (node: DomNode): Promise<void> => {
    if (node.nodeType === ELEMENT) {
      const attrs = attributes(node);
      const data = Object.fromEntries(
        Object.entries(attrs).filter(([k]) => k.startsWith("data-") && k !== "data-scenario"),
      );
      if (Object.keys(data).length > 0)
        rows.push({ part: await part(cdp, node, attrs), attrs: data });
    }
    for (const child of [...(node.shadowRoots ?? []), ...(node.children ?? [])]) await walk(child);
    if (node.contentDocument) await walk(node.contentDocument);
  };
  await walk(await documentTree(cdp));
  return rows;
}
