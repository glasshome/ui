/** True for a node inside a shadow root, where page-level layer logic sees only the root's host. */
export const inShadowRoot = (node: Node | undefined): boolean =>
  typeof ShadowRoot !== "undefined" && node?.getRootNode() instanceof ShadowRoot;
