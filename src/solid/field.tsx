import { cva, type VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createMemo,
  For,
  type ParentComponent,
  Show,
  splitProps,
} from "solid-js";
import { cn } from "../lib/utils.js";
import { Label } from "./label.js";
import { Separator } from "./separator.js";

const FieldSet: Component<ComponentProps<"fieldset">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <fieldset
      data-slot="field-set"
      class={cn(
        // min-w-0: a native <fieldset> computes its own min-content width
        // from its widest child and ignores descendant min-w-0 overrides,
        // so wide unwrapped content (a card title) can push it past a flex
        // parent's width instead of shrinking with it.
        // [&>legend]: the rendered legend is not a flex item, so the gap
        // above cannot reach it; the container still owns that distance.
        "flex min-w-0 flex-col gap-4 [&>legend]:mb-4",
        local.class,
      )}
      {...rest}
    />
  );
};

const FieldLegend: Component<ComponentProps<"legend"> & { variant?: "legend" | "label" }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "variant"] as const);
  const variant = () => local.variant ?? "legend";
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant()}
      class={cn(
        "leading-tight",
        "data-[variant=legend]:text-base data-[variant=legend]:font-semibold",
        "data-[variant=label]:text-sm data-[variant=label]:font-medium",
        local.class,
      )}
      {...rest}
    />
  );
};

const FieldGroup: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="field-group"
      class={cn("group/field-group @container/field-group flex w-full flex-col gap-6", local.class)}
      {...rest}
    />
  );
};

const fieldVariants = cva({
  base: "group/field data-[invalid=true]:text-destructive flex w-full",
  variants: {
    orientation: {
      vertical: ["flex-col gap-2 [&>*]:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        // A stack of content tops out against the control; a single-line
        // caption row centres on it.
        "flex-row items-start gap-3 not-has-[>[data-slot=field-content]]:items-center",
        "[&>[data-slot=field-label]]:flex-auto [&>[data-slot=field-title]]:flex-auto",
      ],
      responsive: [
        "flex-col gap-2 @md/field-group:flex-row @md/field-group:items-start @md/field-group:gap-3 [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto",
        "@md/field-group:not-has-[>[data-slot=field-content]]:items-center",
        "@md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:[&>[data-slot=field-title]]:flex-auto",
      ],
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

const Field: Component<ComponentProps<"div"> & VariantProps<typeof fieldVariants>> = (props) => {
  const [local, rest] = splitProps(props, ["class", "orientation"] as const);
  const orientation = () => local.orientation ?? "vertical";
  return (
    // biome-ignore lint/a11y/useSemanticElements: fieldset would carry default browser styling and break the flex layout; role=group conveys the same semantics.
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation()}
      class={cn(fieldVariants({ orientation: orientation() }), local.class)}
      {...rest}
    />
  );
};

const FieldContent: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="field-content"
      class={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", local.class)}
      {...rest}
    />
  );
};

const FieldLabel: Component<ComponentProps<typeof Label>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <Label
      data-slot="field-label"
      class={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        // Card-shaped labels only: a plain checkbox label wraps a checked control
        // too, and would take the whole tint with it.
        "has-[>[data-slot=field]]:has-data-[checked]:border-primary has-[>[data-slot=field]]:has-data-[checked]:bg-primary/5 dark:has-[>[data-slot=field]]:has-data-[checked]:bg-primary/10",
        local.class,
      )}
      {...rest}
    />
  );
};

const FieldTitle: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="field-title"
      class={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        local.class,
      )}
      {...rest}
    />
  );
};

const FieldDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <p
      data-slot="field-description"
      class={cn(
        "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        // Dims with its title, else a disabled row reads as description-first.
        "group-data-[disabled=true]/field:opacity-50",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        local.class,
      )}
      {...rest}
    />
  );
};

/** Rows that belong to the control above them: stacked flush, grouped by proximity alone. */
const FieldSubGroup: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div data-slot="field-sub-group" class={cn("flex flex-col gap-1", local.class)} {...rest} />
  );
};

const FieldSeparator: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <div
      data-slot="field-separator"
      data-content={!!local.children}
      class={cn("relative h-5 text-sm", local.class)}
      {...rest}
    >
      <Separator class="absolute inset-0 top-1/2" />
      <Show when={local.children}>
        <span
          class="bg-card text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {local.children}
        </span>
      </Show>
    </div>
  );
};

const FieldError: Component<
  ComponentProps<"div"> & {
    errors?: Array<{ message?: string } | undefined>;
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "errors"] as const);

  const content = createMemo(() => {
    if (local.children) {
      return local.children;
    }

    if (!local.errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(local.errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul class="flex list-disc flex-col gap-1 pl-4">
        <For each={uniqueErrors}>
          {(error) => <Show when={error?.message}>{(message) => <li>{message()}</li>}</Show>}
        </For>
      </ul>
    );
  });

  return (
    <Show when={content()}>
      <div
        role="alert"
        data-slot="field-error"
        class={cn("text-destructive text-sm font-normal", local.class)}
        {...rest}
      >
        {content()}
      </div>
    </Show>
  );
};

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldSubGroup,
  FieldTitle,
};
