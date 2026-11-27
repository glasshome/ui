import { isStatic, merge, omit, untrack } from "solid-js";
import {
  type ComponentProps,
  createComponent,
  dynamic,
  type JSX,
  type ValidComponent,
} from "@solidjs/web";

export type PolymorphicProps<D extends ValidComponent> = {
  as?: ValidComponent;
  defaultAs: D;
} & ComponentProps<D>;

export function Polymorphic<D extends ValidComponent>(props: PolymorphicProps<D>): JSX.Element {
  const tag = () => props.as ?? props.defaultAs;
  // isStatic on a memo-backed merge reads its memo; a reactive source answers false either way.
  const fixed = untrack(() => isStatic(props, "as") && isStatic(props, "defaultAs"));
  const Tag = dynamic(tag, { static: fixed });
  const rest = omit(props as PolymorphicProps<ValidComponent>, "as", "defaultAs");
  // A button defaults to type="button", so it never submits a form around it.
  const own =
    fixed && untrack(tag) !== "button"
      ? rest
      : merge(
          {
            get type() {
              return tag() === "button" ? "button" : undefined;
            },
          },
          rest,
        );
  return createComponent(Tag, own);
}
