import { page } from "vitest/browser";
import { settle } from "./harness/mount";

/** Resizes the test frame and settles once the frame reports the new width. */
export async function setViewportWidth(width: number): Promise<void> {
  if (innerWidth === width) return;
  const resized = new Promise((done) => addEventListener("resize", done, { once: true }));
  await page.viewport(width, innerHeight);
  await resized;
  await settle();
}
