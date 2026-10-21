import { page } from "vitest/browser";

/** Resizes the test frame and waits for the frame that reports the media query changes. */
export async function setViewportWidth(width: number): Promise<void> {
  await page.viewport(width, window.innerHeight);
  await new Promise(requestAnimationFrame);
}
