/** The one door to the clipboard. Call it from the click: browsers refuse a
 *  copy more than a few seconds after it. Text still loading goes in as a
 *  promise so a ClipboardItem write keeps the gesture (Safari). */
export async function copyText(text: string | Promise<string>): Promise<boolean> {
  if (typeof text !== "string") {
    if (await copyPending(text)) return true;
    const loaded = await text.catch(() => null);
    return loaded === null ? false : copyText(loaded);
  }
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
  if (!canWriteItems()) return false;
  return writeItem(type, image);
}

async function copyPending(text: Promise<string>): Promise<boolean> {
  if (!canWriteItems()) return false;
  return writeItem(
    "text/plain",
    text.then((t) => new Blob([t], { type: "text/plain" })),
  );
}

function canWriteItems(): boolean {
  return typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";
}

async function writeItem(type: string, data: Promise<Blob>): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [type]: data })]);
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
