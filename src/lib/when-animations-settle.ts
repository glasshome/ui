export async function whenAnimationsSettle(
  el: Element,
  options: { subtree?: boolean; filter?: (animation: Animation) => boolean } = {},
): Promise<void> {
  // One microtask so styles written in the same tick start their animations first.
  await Promise.resolve();
  if (typeof el.getAnimations !== "function") return;
  const all = el.getAnimations({ subtree: options.subtree ?? false });
  const running = options.filter ? all.filter(options.filter) : all;
  if (running.length === 0) return;
  await Promise.allSettled(running.map((animation) => animation.finished));
}
