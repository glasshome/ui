import type { CDPSession } from "playwright";

const BUDGET_MS = 2000;
const QUIET_MS = 34;
const MUTATIONS = [
  "DOM.childNodeInserted",
  "DOM.childNodeRemoved",
  "DOM.attributeModified",
  "DOM.attributeRemoved",
  "DOM.characterDataModified",
] as const;
// Each getAnimations() call restyles every animating element, and an animation frame request draws one, so the wait awaits `finished` once instead of polling.
const UNTIL_DONE = `function (ms) {
  const running = this.getAnimations().filter((a) => a.playState === "running");
  const done = Promise.all(running.map((a) => a.finished.catch(() => undefined)));
  return Promise.race([done, new Promise((r) => setTimeout(r, ms))]).then(() => running.length);
}`;

interface Settled {
  settled: boolean;
  settleMs: number;
}

/**
 * Waits until nothing animates and two frames' time passes without a DOM mutation, or the budget runs out.
 * Mutations come from CDP DOM events, live; a trace only hands its events over once it stops.
 */
export async function createSettler(cdp: CDPSession) {
  let mutations = 0;
  for (const event of MUTATIONS) cdp.on(event, () => mutations++);
  await cdp.send("DOM.enable", {});

  async function closedRoots(): Promise<string[]> {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const found: number[] = [];
    const walk = (node: typeof root) => {
      for (const shadow of node.shadowRoots ?? []) {
        if (shadow.shadowRootType === "closed") found.push(shadow.backendNodeId);
        walk(shadow);
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(root);
    const ids = await Promise.all(
      found.map((backendNodeId) => cdp.send("DOM.resolveNode", { backendNodeId })),
    );
    return ids.flatMap((r) => (r.object.objectId ? [r.object.objectId] : []));
  }

  async function untilDone(roots: string[], ms: number): Promise<number> {
    const call = (objectId: string) =>
      cdp
        .send("Runtime.callFunctionOn", {
          objectId,
          functionDeclaration: UNTIL_DONE,
          arguments: [{ value: ms }],
          awaitPromise: true,
          returnByValue: true,
        })
        .then((r) => (typeof r.result.value === "number" ? r.result.value : 0))
        .catch(() => 0);
    const { result } = await cdp.send("Runtime.evaluate", { expression: "document" });
    const all = [...roots, ...(result.objectId ? [result.objectId] : [])];
    const counts = await Promise.all(all.map(call));
    return counts.reduce((a, b) => a + b, 0);
  }

  return async function settle(budgetMs = BUDGET_MS): Promise<Settled> {
    const start = performance.now();
    const roots = await closedRoots();
    while (performance.now() - start < budgetMs) {
      const before = mutations;
      const left = Math.max(0, budgetMs - (performance.now() - start));
      const animating = await untilDone(roots, left);
      await Bun.sleep(QUIET_MS);
      if (animating === 0 && mutations === before) {
        return { settled: true, settleMs: performance.now() - start };
      }
    }
    return { settled: false, settleMs: performance.now() - start };
  };
}
