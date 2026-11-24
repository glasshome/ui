import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Button } from "../../src/solid/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../src/solid/dropdown-menu.js";
import { press } from "../press.js";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const content = () => document.querySelector('[data-slot="dropdown-menu-content"]');

describe("menu row busy", () => {
  it("a busy row ignores a press, keeps the menu open and says it is busy", async () => {
    const onSelect = vi.fn();
    render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem busy onSelect={onSelect}>
            Save
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    await press(screen.getByRole("button", { name: "Open" }));
    const row = screen.getByRole("menuitem", { name: "Save" });
    expect(row.getAttribute("aria-busy")).toBe("true");
    expect(row.getAttribute("aria-disabled")).toBe("true");
    expect(row.hasAttribute("data-disabled")).toBe(false);
    await userEvent.hover(row);
    await press(row, { force: true });
    expect(onSelect).not.toHaveBeenCalled();
    expect(content()).not.toBeNull();
  });

  it("a busy radio row keeps the group's value, its highlight and the open menu", async () => {
    const onChange = vi.fn();
    render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="en" onChange={onChange}>
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="fr" busy>
              Français
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    await press(screen.getByRole("button", { name: "Open" }));
    const french = screen.getByRole("menuitemradio", { name: "Français" });
    await userEvent.hover(french);
    await press(french, { force: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(french.getAttribute("aria-checked")).toBe("false");
    expect(french.hasAttribute("data-highlighted")).toBe(true);
    expect(content()).not.toBeNull();
  });

  it("a row that is not busy selects as usual", async () => {
    const onSelect = vi.fn();
    render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Save</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    await press(screen.getByRole("button", { name: "Open" }));
    const row = screen.getByRole("menuitem", { name: "Save" });
    expect(row.hasAttribute("aria-busy")).toBe(false);
    await press(row);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
