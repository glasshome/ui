import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import { Dynamic } from "@solidjs/web";
import { merge, omit } from "./solid.js";

export type PolymorphicProps<D extends ValidComponent> = {
  as?: ValidComponent;
  defaultAs: D;
} & ComponentProps<D>;

export function Polymorphic<D extends ValidComponent>(props: PolymorphicProps<D>): JSX.Element {
  const component = () => props.as ?? props.defaultAs;
  const rest = omit(props as PolymorphicProps<ValidComponent>, "as", "defaultAs");
  return (
    <Dynamic
      {...merge(
        {
          get type() {
            return component() === "button" ? "button" : undefined;
          },
        },
        rest,
        {
          get component() {
            return component();
          },
        },
      )}
    />
  );
}
