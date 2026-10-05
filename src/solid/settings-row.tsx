import { createUniqueId, type JSX, Show } from "solid-js";
import { Button } from "./button.js";
import { Field, FieldContent, FieldDescription, FieldLabel } from "./field.js";
import { Icon } from "./icon.js";
import { IconPicker, type IconPickerProps } from "./icon-picker.js";
import { Input } from "./input.js";
import { Switch } from "./switch.js";

/**
 * Generic settings/list row primitives, shared by dash settings and any list UI.
 * Presentational only — no app data or routing.
 */

export function SectionAddButton(props: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={props.onClick}>
      <Icon icon="lucide:plus" width={14} height={14} />
      Add
    </Button>
  );
}

export function SectionEmpty(props: { children: JSX.Element }) {
  return (
    <p data-slot="section-empty" class="text-muted-foreground py-4 text-center text-sm">
      {props.children}
    </p>
  );
}

export function RowActions(props: {
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  deleteTitle?: string;
  showDelete?: boolean;
}) {
  return (
    <div data-slot="row-actions" class="flex items-center gap-1">
      <Button variant="ghost" size="icon" class="size-8" onClick={props.onEdit}>
        <Icon icon="lucide:pencil" width={14} height={14} />
      </Button>
      <Show when={props.showDelete ?? true}>
        <Button
          variant="ghost"
          size="icon"
          class="text-destructive hover:text-destructive size-8"
          onClick={props.onDelete}
          disabled={props.deleteDisabled}
          title={props.deleteTitle}
        >
          <Icon icon="lucide:trash-2" width={14} height={14} />
        </Button>
      </Show>
    </div>
  );
}

export function LabeledField(props: { label: string; children: JSX.Element }) {
  return (
    <div data-slot="labeled-field" class="flex flex-col gap-1">
      <p data-slot="labeled-field-label" class="text-sm font-medium">
        {props.label}
      </p>
      {props.children}
    </div>
  );
}

export function LabeledIconPicker(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** @deprecated Pass `search` to `provideIcons` once; removed in 2.0.0. */
  searchIcons?: IconPickerProps["searchIcons"];
}) {
  return (
    <LabeledField label={props.label}>
      <IconPicker
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        searchIcons={props.searchIcons}
      />
    </LabeledField>
  );
}

export function LabeledInput(props: {
  label: string;
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <LabeledField label={props.label}>
      <Input
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        placeholder={props.placeholder}
      />
    </LabeledField>
  );
}

export function SwitchRow(props: {
  label: string;
  description?: string;
  /** Iconify id shown before the label (sensitive-device rows, platform toggles). */
  icon?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = createUniqueId();
  return (
    <Field
      orientation="horizontal"
      class="py-2"
      data-disabled={props.disabled ? "true" : undefined}
    >
      <Show when={props.icon}>
        {(icon) => (
          <Icon
            icon={icon()}
            width={16}
            height={16}
            aria-hidden="true"
            class="text-muted-foreground shrink-0"
          />
        )}
      </Show>
      <Show
        when={props.description}
        fallback={
          <FieldLabel for={id} class="cursor-pointer">
            {props.label}
          </FieldLabel>
        }
      >
        {(description) => (
          <FieldContent>
            <FieldLabel for={id} class="cursor-pointer">
              {props.label}
            </FieldLabel>
            <FieldDescription class="text-xs">{description()}</FieldDescription>
          </FieldContent>
        )}
      </Show>
      <Switch
        id={id}
        checked={props.checked}
        disabled={props.disabled}
        onChange={props.onChange}
        aria-label={props.label}
      />
    </Field>
  );
}
