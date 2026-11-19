/** Waits n real frames; each one's layout and ResizeObserver callbacks have run once it resolves the next. */
export async function frames(n: number): Promise<void> {
  for (let i = 0; i < n; i++) await new Promise((done) => requestAnimationFrame(done));
}
