import { type Accessor, createSignal, type JSX, onCleanup, Show } from "solid-js";
import { createMenu, createMenuButton, type Menu } from "../../../src/lib/behavior/menu";
import { defineScenarios } from "../../harness/types";

type ItemRole = "menuitem" | "menuitemcheckbox" | "menuitemradio";

const PANEL: JSX.CSSProperties = {
  "min-width": "160px",
  padding: "4px",
  background: "white",
  color: "black",
  border: "1px solid #888",
  "border-radius": "8px",
};

function Row(props: {
  menu: Menu;
  id: string;
  label: string;
  role?: ItemRole;
  checked?: Accessor<boolean>;
  disabled?: boolean;
  closeOnSelect?: boolean;
  onSelect?: () => void;
  submenu?: Menu;
}) {
  props.menu.register(props.id, {
    disabled: () => props.disabled ?? false,
    closeOnSelect: () => props.closeOnSelect ?? true,
    onSelect: () => props.onSelect?.(),
    submenu: props.submenu,
  });
  return (
    <div
      ref={(el) => props.submenu?.setTrigger(el)}
      data-key={props.id}
      role={props.role ?? "menuitem"}
      tabIndex={props.menu.tabIndex(props.id)}
      aria-disabled={props.disabled ? "true" : undefined}
      aria-checked={props.checked ? (props.checked() ? "true" : "false") : undefined}
      aria-haspopup={props.submenu ? "menu" : undefined}
      aria-expanded={props.submenu ? props.submenu.open() : undefined}
      data-highlighted={props.menu.highlighted() === props.id ? "" : undefined}
      style={{
        padding: "6px 10px",
        "border-radius": "4px",
        opacity: props.disabled ? "0.5" : "1",
        background: props.menu.highlighted() === props.id ? "#ddd" : "transparent",
      }}
    >
      {props.label}
    </div>
  );
}

function PanelBody(props: { menu: Menu; label: string; children: JSX.Element }) {
  onCleanup(() => props.menu.setContent(undefined));
  return (
    <div
      ref={(el) => props.menu.setContent(el)}
      role="menu"
      aria-label={props.label}
      tabIndex={-1}
      style={PANEL}
    >
      {props.children}
    </div>
  );
}

const Panel = (props: { menu: Menu; label: string; children: JSX.Element }) => (
  <Show when={props.menu.open()}>
    <PanelBody menu={props.menu} label={props.label}>
      {props.children}
    </PanelBody>
  </Show>
);

/** A menu button with a plain item, a disabled one, a checkbox, two radios and a submenu, built on the block alone. */
export function ActionsMenu() {
  const [open, setOpen] = createSignal(false);
  const [subOpen, setSubOpen] = createSignal(false);
  const [chosen, setChosen] = createSignal("nothing");
  const [grid, setGrid] = createSignal(false);
  const [size, setSize] = createSignal("Small");
  const menu = createMenu({
    open,
    onOpenChange: setOpen,
    side: () => "bottom",
    align: () => "start",
    offset: 4,
  });
  const sub = createMenu({ open: subOpen, onOpenChange: setSubOpen, parent: menu });
  const button = createMenuButton(menu, () => false);
  return (
    <div style={{ padding: "24px" }}>
      <button
        type="button"
        ref={(el) => menu.setTrigger(el)}
        aria-haspopup="menu"
        aria-expanded={open()}
        on:pointerdown={(event) => button.onPointerDown(event)}
        on:click={() => button.onClick()}
        on:keydown={(event) => button.onKeyDown(event)}
      >
        Actions
      </button>
      <output aria-label="Chosen" style={{ "margin-left": "16px" }}>
        {chosen()}
      </output>
      <Panel menu={menu} label="Actions">
        <Row menu={menu} id="copy" label="Copy" onSelect={() => setChosen("Copy")} />
        <Row menu={menu} id="paste" label="Paste" disabled />
        <Row
          menu={menu}
          id="grid"
          label="Show grid"
          role="menuitemcheckbox"
          checked={grid}
          closeOnSelect={false}
          onSelect={() => setGrid(!grid())}
        />
        <Row
          menu={menu}
          id="small"
          label="Small"
          role="menuitemradio"
          checked={() => size() === "Small"}
          closeOnSelect={false}
          onSelect={() => setSize("Small")}
        />
        <Row
          menu={menu}
          id="large"
          label="Large"
          role="menuitemradio"
          checked={() => size() === "Large"}
          closeOnSelect={false}
          onSelect={() => setSize("Large")}
        />
        <Row menu={menu} id="more" label="More" submenu={sub} />
        <Row menu={menu} id="close" label="Close" onSelect={() => setChosen("Close")} />
      </Panel>
      <Panel menu={sub} label="More">
        <Row menu={sub} id="rename" label="Rename" onSelect={() => setChosen("Rename")} />
        <Row menu={sub} id="delete" label="Delete" onSelect={() => setChosen("Delete")} />
      </Panel>
    </div>
  );
}

const ACTIONS = { press: { role: "button", name: "Actions" } };

export default defineScenarios({
  component: "menu",
  kind: "block",
  scenarios: [
    {
      id: "open",
      title: "A press opens the menu below its button",
      render: () => <ActionsMenu />,
      steps: [ACTIONS],
    },
    {
      id: "choose",
      title: "Choosing an item closes the menu",
      render: () => <ActionsMenu />,
      steps: [ACTIONS, { press: { role: "menuitem", name: "Copy" } }],
    },
    {
      id: "submenu",
      title: "A submenu opens beside its item, and its item closes the whole menu",
      render: () => <ActionsMenu />,
      steps: [
        ACTIONS,
        { press: { role: "menuitem", name: "More" } },
        { press: { role: "menuitem", name: "Rename" } },
      ],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root a menu opens and chooses",
      within: "shadow-root",
      render: () => <ActionsMenu />,
      steps: [ACTIONS, { press: { role: "menuitem", name: "Copy" } }],
    },
  ],
});
