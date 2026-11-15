import type { CDPSession } from "playwright";

const fullTree = async (cdp: CDPSession) =>
  (await cdp.send("Accessibility.getFullAXTree", {})).nodes;
type AXNode = Awaited<ReturnType<typeof fullTree>>[number];

const STATES = ["focused", "selected", "expanded", "checked", "pressed", "disabled", "hidden"];
const SILENT = new Set(["generic", "none", "InlineTextBox", "LineBreak"]);

const text = (v: { value?: unknown } | undefined) => (typeof v?.value === "string" ? v.value : "");
const role = (n: AXNode) => text(n.role);
const name = (n: AXNode) => text(n.name).trim();
const prop = (n: AXNode, key: string) => n.properties?.find((p) => p.name === key)?.value.value;

function kept(n: AXNode, parentName: string): boolean {
  if (n.ignored || role(n) === "InlineTextBox") return false;
  if (SILENT.has(role(n)) && !name(n)) return false;
  // A static text repeating its parent's name adds nothing.
  return !(role(n) === "StaticText" && parentName.includes(name(n)));
}

function states(n: AXNode): string {
  return STATES.map((s) => {
    const v = prop(n, s);
    if (v === true || v === "true") return ` ${s}`;
    if (v === "mixed") return ` ${s}=mixed`;
    return "";
  }).join("");
}

const label = (n: AXNode) => role(n) + (name(n) ? ` "${name(n)}"` : "");

export async function axTree(cdp: CDPSession): Promise<string> {
  const nodes = await fullTree(cdp);
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const lines: string[] = [];
  const walk = (n: AXNode, depth: number, parentName: string) => {
    const keep = kept(n, parentName);
    if (keep) lines.push("  ".repeat(depth) + label(n) + states(n));
    for (const id of n.childIds ?? []) {
      const child = byId.get(id);
      if (child) walk(child, keep ? depth + 1 : depth, keep ? name(n) : parentName);
    }
  };
  for (const root of nodes.filter((n) => n.parentId === undefined)) walk(root, 0, "");
  return lines.join("\n");
}

/** The AX path from the root to the focused node, one `role "name"` per kept ancestor. */
export async function focusPath(cdp: CDPSession): Promise<string[]> {
  const nodes = await fullTree(cdp);
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const focused = nodes.filter((n) => prop(n, "focused") === true);
  const target = focused.find((n) => role(n) !== "RootWebArea") ?? focused[0];
  const path: string[] = [];
  for (let n = target; n; n = n.parentId === undefined ? undefined : byId.get(n.parentId)) {
    if (!n.ignored && !(SILENT.has(role(n)) && !name(n))) path.unshift(label(n));
  }
  return path;
}
