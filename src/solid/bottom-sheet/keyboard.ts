/**
 * Tracks the on-screen keyboard via visualViewport and applies an inline
 * `bottom` offset to the sheet content so it stays above the keyboard.
 *
 * No-op when visualViewport is unavailable (older browsers).
 */

const KEYBOARD_THRESHOLD_PX = 100;

export interface KeyboardWatchHandle {
  destroy: () => void;
}

export function watchKeyboard(el: HTMLElement): KeyboardWatchHandle {
  if (typeof window === "undefined") return { destroy: () => {} };
  const vv = window.visualViewport;
  if (!vv) return { destroy: () => {} };

  const update = () => {
    const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    if (offset > KEYBOARD_THRESHOLD_PX) {
      el.style.setProperty("--bs-keyboard-offset", `${offset}px`);
      el.setAttribute("data-keyboard-open", "");
    } else {
      el.style.removeProperty("--bs-keyboard-offset");
      el.removeAttribute("data-keyboard-open");
    }
  };

  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  update();

  return {
    destroy() {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      el.style.removeProperty("--bs-keyboard-offset");
      el.removeAttribute("data-keyboard-open");
    },
  };
}
