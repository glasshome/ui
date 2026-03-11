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
import { cn } from "../lib/utils";
import { Label } from "./label";
import { Separator } from "./separator";

const FieldSet: Component<ComponentProps<"fieldset">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <fieldset
      data-slot="field-set"
      class={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
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
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
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
      class={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        local.class,
      )}
      {...rest}
    />
  );
};

const fieldVariants = cva({
  base: "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  variants: {
    orientation: {
      vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center",
        "[&>[data-slot=field-label]]:flex-auto",
        "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      responsive: [
        "@md/field-group:flex-row flex-col @md/field-group:items-center @md/field-group:[&>*]:w-auto [&>*]:w-full [&>.sr-only]:w-auto",
        "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
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
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10",
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
      data-slot="field-label"
      class={cn(
        "flex w-fit items-center gap-2 font-medium text-sm leading-snug group-data-[disabled=true]/field:opacity-50",
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
        "font-normal text-muted-foreground text-sm leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        local.class,
      )}
      {...rest}
    />
  );
};

const FieldSeparator: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <div
      data-slot="field-separator"
      data-content={!!local.children}
      class={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        local.class,
      )}
      {...rest}
    >
      <Separator class="absolute inset-0 top-1/2" />
      <Show when={local.children}>
        <span
          class="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
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
      <ul class="ml-4 flex list-disc flex-col gap-1">
        <For each={uniqueErrors}>
          {(error) => (
            <Show when={error?.message}>
              <li>{error!.message}</li>
            </Show>
          )}
        </For>
      </ul>
    );
  });

  return (
    <Show when={content()}>
      <div
        role="alert"
        data-slot="field-error"
        class={cn("font-normal text-destructive text-sm", local.class)}
        {...rest}
      >
        {content()}
      </div>
    </Show>
  );
};

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
