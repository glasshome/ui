import { createContext, useContext } from "solid-js";

/**
 * Where overlays (dialogs, sheets, popovers, menus, tooltips) portal to. Unset, they portal to
 * `document.body`; a host that renders a tree inside a shadow root sets it to a node in that root,
 * so the overlay keeps the root's styles and never reaches the page.
 */
export const PortalMountContext = createContext<Node>();

export const usePortalMount = (): Node | undefined => useContext(PortalMountContext);
