import { cleanup, render } from "@solidjs/testing-library";
import { type JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../src/solid";
import { input } from "../harness/input";
import { settle } from "../harness/mount";

afterEach(cleanup);

const STEP = 20;

type Case = {
  name: string;
  panel: string;
  view: (gutter: () => number) => JSX.Element;
  open?: (container: HTMLElement) => Promise<void>;
};

const CASES: Case[] = [
  {
    name: "Popover",
    panel: "popover-content",
    view: (gutter) => (
      <Popover open gutter={gutter()}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Panel</PopoverContent>
      </Popover>
    ),
  },
  {
    name: "DropdownMenu",
    panel: "dropdown-menu-content",
    view: (gutter) => (
      <DropdownMenu open gutter={gutter()}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    name: "DropdownMenuSub",
    panel: "dropdown-menu-sub-content",
    view: (gutter) => (
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub open gutter={gutter()}>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Two</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    name: "ContextMenu",
    panel: "context-menu-content",
    view: (gutter) => (
      <ContextMenu gutter={gutter()}>
        <ContextMenuTrigger>
          <div style={{ width: "200px", height: "120px" }}>Area</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>One</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
    open: async (container) => {
      const area = container.querySelector<HTMLElement>('[data-slot="context-menu-trigger"]');
      if (!area) throw new Error("no context menu area");
      await input.contextMenu(area);
    },
  },
  {
    name: "Tooltip",
    panel: "tooltip-content",
    view: (gutter) => (
      <Tooltip open gutter={gutter()}>
        <TooltipTrigger>Open</TooltipTrigger>
        <TooltipContent>Tip</TooltipContent>
      </Tooltip>
    ),
  },
  {
    name: "HoverCard",
    panel: "hover-card-content",
    view: (gutter) => (
      <HoverCard open gutter={gutter()}>
        <HoverCardTrigger>Open</HoverCardTrigger>
        <HoverCardContent>Card</HoverCardContent>
      </HoverCard>
    ),
  },
];

const panelOf = (slot: string) => {
  const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!el) throw new Error(`no ${slot}`);
  return el.getBoundingClientRect();
};

describe("an open overlay follows its gutter", () => {
  for (const c of CASES) {
    it(`${c.name} moves by the gutter change while it stays open`, async () => {
      const [gutter, setGutter] = createSignal(4);
      const { container } = render(() => <div style={{ padding: "160px" }}>{c.view(gutter)}</div>);
      await c.open?.(container);
      await settle();
      const before = panelOf(c.panel);
      setGutter(4 + STEP);
      flush();
      const after = panelOf(c.panel);
      const moved = Math.abs(after.left - before.left) + Math.abs(after.top - before.top);
      expect(Math.abs(moved - STEP)).toBeLessThanOrEqual(1);
    });
  }
});
