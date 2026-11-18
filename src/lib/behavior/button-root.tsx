import { type ComponentProps, createSignal, type JSX, type ValidComponent } from "solid-js";
import { Polymorphic } from "./polymorphic";
import { callEventHandler, effect, merge, omit } from "./solid";

export type ButtonRootProps<T extends ValidComponent = "button"> = Omit<
  ComponentProps<T>,
  "as" | "disabled"
> & {
  as?: T;
  disabled?: boolean;
};

type Passed = {
  onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>;
  ref?: unknown;
  href?: unknown;
};

const NATIVE = new Set(["button", "input"]);

/** A press target: a native button, a link, or any other element made one (role, Tab stop, Enter and Space). */
export function ButtonRoot<T extends ValidComponent = "button">(props: ButtonRootProps<T>) {
  const own = props as ButtonRootProps<ValidComponent> & Passed;
  const [el, setEl] = createSignal<HTMLElement>();
  const tag = () =>
    typeof own.as === "string" ? own.as : own.as === undefined ? "button" : el()?.localName;
  const native = () => NATIVE.has(tag() ?? "");
  const made = () => !native() && !(tag() === "a" && own.href !== undefined);

  // Bound on the element, since Solid's delegated handlers never reach inside a closed shadow root.
  effect(el, (node) => {
    if (!node) return;
    const click = (event: MouseEvent) => {
      if (own.disabled && !native()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      callEventHandler(
        event as MouseEvent & { currentTarget: HTMLElement; target: Element },
        own.onClick,
      );
    };
    const keydown = (event: KeyboardEvent) => {
      if (!made() || own.disabled || event.target !== node) return;
      if (event.key === "Enter") {
        event.preventDefault();
        node.click();
      } else if (event.key === " ") event.preventDefault();
    };
    const keyup = (event: KeyboardEvent) => {
      if (!made() || own.disabled || event.target !== node || event.key !== " ") return;
      event.preventDefault();
      node.click();
    };
    node.addEventListener("click", click);
    node.addEventListener("keydown", keydown);
    node.addEventListener("keyup", keyup);
    return () => {
      node.removeEventListener("click", click);
      node.removeEventListener("keydown", keydown);
      node.removeEventListener("keyup", keyup);
    };
  });

  return (
    <Polymorphic
      {...merge(
        {
          get type() {
            return native() ? "button" : undefined;
          },
          get role() {
            return made() ? "button" : undefined;
          },
          get tabIndex() {
            return made() && !own.disabled ? 0 : undefined;
          },
          get disabled() {
            return native() ? own.disabled : undefined;
          },
          get "aria-disabled"() {
            return !native() && own.disabled ? true : undefined;
          },
          get "data-disabled"() {
            return own.disabled ? "" : undefined;
          },
        },
        omit(own, "as", "disabled", "onClick", "ref"),
        {
          get as() {
            return own.as;
          },
          defaultAs: "button" as ValidComponent,
          ref: (node: HTMLElement) => {
            setEl(node);
            if (typeof own.ref === "function") own.ref(node);
          },
        },
      )}
    />
  );
}
