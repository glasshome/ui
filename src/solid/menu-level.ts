import { type Accessor, createContext, createSignal, merge } from "solid-js";
import type { Align, Side } from "../lib/anchor-placement.js";
import { createMenu, type Menu, type MenuOptions } from "../lib/behavior/menu.js";
import { useRequired } from "../lib/context.js";

export type MenuPlacement = Side | `${Side}-${Exclude<Align, "center">}`;

export function parsePlacement(placement: MenuPlacement): [Side, Align] {
  const [side, align] = placement.split("-") as [Side, Align?];
  return [side, align ?? "center"];
}

/** One open level of a menu tree: the root menu or a submenu, with the ids its trigger and panel name each other by. */
export interface MenuLevel {
  menu: Menu;
  parent: MenuLevel | undefined;
  triggerId: Accessor<string | undefined>;
  setTriggerId: (id: string | undefined) => void;
  contentId: Accessor<string | undefined>;
  setContentId: (id: string | undefined) => void;
}

const MenuLevelContext = createContext<MenuLevel>();

export const MenuLevelProvider = MenuLevelContext;

export function useMenuLevel(): MenuLevel {
  return useRequired(MenuLevelContext, "Menu parts", ["DropdownMenu", "ContextMenu"]);
}

export function createMenuLevel(options: MenuOptions, parent?: MenuLevel): MenuLevel {
  const menu = createMenu(parent ? merge(options, { parent: parent.menu }) : options);
  const [triggerId, setTriggerId] = createSignal<string>();
  const [contentId, setContentId] = createSignal<string>();
  return { menu, parent, triggerId, setTriggerId, contentId, setContentId };
}
