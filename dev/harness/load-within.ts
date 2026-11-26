import type { JSX } from "@solidjs/web";
import type { Within } from "./types";

export type WithinFrame = (props: { children: JSX.Element }) => JSX.Element;

const Page: WithinFrame = (props) => props.children;

/** Loads only the frame a mode needs, so a page scenario links no dialog. */
export async function loadWithin(mode: Within): Promise<WithinFrame> {
  if (mode === "page") return Page;
  if (mode === "shadow-root") return (await import("./within-shadow")).ClosedShadowRoot;
  const modal = await import("./within-modal");
  return mode === "dialog" ? modal.InDialog : modal.InSheet;
}
