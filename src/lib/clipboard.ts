/** The one door to the clipboard. Call it from inside the click with text
 *  already in hand: Firefox refuses the selection copy once a network round
 *  trip separates it from the gesture. */
export async function copyText(text: string): Promise<boolean> {
  // Dashboards are reached over plain http on the LAN, where navigator.clipboard
  // does not exist; the selection path is the only copy those installs have.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permission or focus denial, fall through to the selection path
    }
  }
  return copyViaSelection(text);
}

/** An image that is still being made: the promise goes into the ClipboardItem
 *  so the write keeps the gesture (Safari). False where there is no image
 *  clipboard (plain http, Firefox by default). */
export async function copyImage(image: Promise<Blob>, type = "image/png"): Promise<boolean> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ [type]: image })]);
    return true;
  } catch {
    return false;
  }
}

function copyViaSelection(text: string): boolean {
  const previous = deepActiveElement();
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  // A focus trap only lets the textarea take focus when it sits inside the
  // trapped subtree, and a copy from an unfocused one reports success having
  // copied nothing.
  (previous?.parentElement ?? document.body).append(area);
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const root = area.getRootNode() as Document | ShadowRoot;
    if (root.activeElement !== area) return false;
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    previous?.focus();
  }
}

function deepActiveElement(): HTMLElement | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
  return element instanceof HTMLElement ? element : null;
}
