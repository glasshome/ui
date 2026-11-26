export const DOCUMENT_NODE = 9;
export const SHADOW_ROOT_NODE = 11;

export const outermostHost = (root: ShadowRoot): Element => {
  let host = root.host;
  for (let up = host.getRootNode(); up.nodeType === SHADOW_ROOT_NODE; up = host.getRootNode())
    host = (up as ShadowRoot).host;
  return host;
};

function readFocus(root: Node): Element | null {
  if (root.nodeType === DOCUMENT_NODE) return (root as Document).activeElement;
  const host = outermostHost(root as ShadowRoot);
  // A shadow root holds focus only while the document's focus sits on its outermost host.
  return host.ownerDocument.activeElement === host ? (root as ShadowRoot).activeElement : null;
}

const focusByRoot = new WeakMap<Node, { at: Element | null }>();

/** The focused element in the node's own root, kept from focusin and focusout, which a sealed widget receives without asking the page. */
export function focusedIn(node: Node): Element | null {
  const root = node.getRootNode();
  if (root.nodeType !== DOCUMENT_NODE && root.nodeType !== SHADOW_ROOT_NODE) return null;
  let tracked = focusByRoot.get(root);
  if (!tracked) {
    // One read when the listeners attach; a focus move runs its events inside the call that makes it.
    const seen = { at: readFocus(root) };
    root.addEventListener(
      "focusin",
      (e) => {
        seen.at = e.target instanceof Element ? e.target : null;
      },
      true,
    );
    root.addEventListener("focusout", () => (seen.at = null), true);
    focusByRoot.set(root, seen);
    tracked = seen;
  }
  const at = tracked.at;
  if (!at?.isConnected || at.getRootNode() !== root) return null;
  return at === at.ownerDocument.body ? null : at;
}
