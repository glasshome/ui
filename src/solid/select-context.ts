import { type Accessor, type Component, createContext } from "solid-js";
import { useRequired } from "../lib/context.js";
import { type JSX } from "@solidjs/web";
import { type SelectNode } from "./select-model.js";

type CloseReason = "commit" | "outside" | "parent";

export interface SelectContextValue {
  ids: { root: string; trigger: Accessor<string>; value: string; listbox: string };
  setTriggerId: (id: string) => void;
  open: Accessor<boolean>;
  openFrom: Accessor<"first" | "last">;
  show: (from: "first" | "last") => void;
  close: (reason: CloseReason) => void;
  /** The panel unmounted: a close by an outside press refocuses the trigger only if focus fell to the page. */
  settle: () => void;
  setCloseAutoFocus: (handler: ((event: Event) => void) | undefined) => void;
  nodes: Accessor<readonly SelectNode<unknown>[]>;
  optionId: (key: string | undefined) => string | undefined;
  multiple: Accessor<boolean>;
  isSelected: (key: string) => boolean;
  firstSelected: Accessor<string | undefined>;
  empty: Accessor<boolean>;
  choose: (key: string) => void;
  step: (by: 1 | -1) => void;
  typeahead: (event: KeyboardEvent) => boolean;
  selectedOptions: Accessor<unknown[]>;
  remove: (option: unknown) => void;
  clear: () => void;
  placeholder: () => JSX.Element;
  itemComponent: Accessor<Component<{ item: SelectNode<unknown> }> | undefined>;
  sectionComponent: Accessor<Component<{ section: SelectNode<unknown> }> | undefined>;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  labelId: Accessor<string | undefined>;
  setLabelId: (id: string | undefined) => void;
  listboxLabelledBy: Accessor<string | undefined>;
  setListboxLabelledBy: (ids: string | undefined) => void;
  blocked: Accessor<boolean>;
  disabled: Accessor<boolean>;
  busy: Accessor<boolean>;
  attrs: StateAttrs;
}

type StateAttrs = {
  [
    K in
      | "data-expanded"
      | "data-closed"
      | "data-valid"
      | "data-invalid"
      | "data-required"
      | "data-disabled"
      | "data-readonly"
  ]: "" | undefined;
};

export const SelectContext = createContext<SelectContextValue>();

export const useSelect = (): SelectContextValue => {
  const ctx = useRequired(SelectContext, "Select parts", "Select");
  return ctx;
};

interface SelectListValue {
  highlighted: Accessor<string | undefined>;
}

export const SelectListContext = createContext<SelectListValue>();

export const useSelectList = (): SelectListValue => {
  const ctx = useRequired(SelectListContext, "SelectItem", "SelectContent");
  return ctx;
};

export const ITEM = '[role="option"][data-key]';
export const TAP_SLOP_PX = 10;
export const flag = (on: boolean) => (on ? "" : undefined);
