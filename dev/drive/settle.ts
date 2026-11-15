import type { CDPSession, Page } from "playwright";

const BUDGET_MS = 2000;
const QUIET_FRAMES = 2;
const MUTATIONS = [
  "DOM.childNodeInserted",
  "DOM.childNodeRemoved",
  "DOM.attributeModified",
  "DOM.attributeRemoved",
  "DOM.characterDataModified",
] as const;
const RUNNING = `function () { return this.getAnimations().filter((a) => a.playState === "running").length; }`;

interface Settled {
  settled: boolean;
  settleMs: number;
}

/**
 * Waits until nothing animates and two frames pass without a DOM mutation, or the budget runs out.
 * Mutations come from CDP DOM events, live; a trace only hands its events over once it stops.
 */
export async function createSettler(page: Page, cdp: CDPSession) {
  let mutations = 0;
  for (const event of MUTATIONS) cdp.on(event, () => mutations++);
  await cdp.send("DOM.enable", {});

  const frame = () => page.evaluate(() => new Promise((done) => requestAnimationFrame(done)));

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

  async function running(roots: string[]): Promise<number> {
    const counts = await Promise.all(
      roots.map((objectId) =>
        cdp
          .send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: RUNNING,
            returnByValue: true,
          })
          .then((r) => (typeof r.result.value === "number" ? r.result.value : 0))
          .catch(() => 0),
      ),
    );
    const inDocument = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === "running").length,
    );
    return counts.reduce((a, b) => a + b, inDocument);
  }

  return async function settle(budgetMs = BUDGET_MS): Promise<Settled> {
    const start = performance.now();
    const roots = await closedRoots();
    let quiet = 0;
    while (performance.now() - start < budgetMs) {
      const before = mutations;
      await frame();
      const still = (await running(roots)) === 0 && mutations === before;
      quiet = still ? quiet + 1 : 0;
      if (quiet >= QUIET_FRAMES) return { settled: true, settleMs: performance.now() - start };
    }
    return { settled: false, settleMs: performance.now() - start };
  };
}
