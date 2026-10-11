/**
 * A panel that opens on pointerdown under the pointer (an overlaid Select, a menu anchored on
 * its trigger) would receive that press's release, and Kobalte acts on release. Only a press
 * that starts inside the panel may act; with or without an opening animation.
 */
export function ignoreOpeningRelease(panel: HTMLElement): () => void {
  let pressedInside = false;
  const onDown = () => {
    pressedInside = true;
  };
  const onUp = (event: PointerEvent) => {
    if (pressedInside) {
      pressedInside = false;
      return;
    }
    event.stopPropagation();
    event.preventDefault();
  };
  panel.addEventListener("pointerdown", onDown, true);
  panel.addEventListener("pointerup", onUp, true);
  return () => {
    panel.removeEventListener("pointerdown", onDown, true);
    panel.removeEventListener("pointerup", onUp, true);
  };
}
