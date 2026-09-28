import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SECTION_ROW_INTERACTIVE } from "../../src/lib/card-classes.js";
import { ListRow } from "../../src/solid/section-card.js";

afterEach(cleanup);

function row(container: HTMLElement) {
  const found = container.querySelector<HTMLElement>('[data-slot="section-row"]');
  if (!found) throw new Error("ListRow rendered no section row");
  return found;
}

const INTERACTIVE_MARKER = SECTION_ROW_INTERACTIVE.split(" ")[0];

describe("ListRow", () => {
  it("renders title, subtitle, badges and meta in one row", () => {
    const { container } = render(() => (
      <ListRow
        title="Pulse"
        subtitle="@glasshome"
        badges={<span data-testid="badge">Update</span>}
        meta={<span data-testid="meta">1.2.4</span>}
      />
    ));

    expect(screen.getByText("Pulse")).toBeTruthy();
    expect(screen.getByText("@glasshome")).toBeTruthy();
    expect(screen.getByTestId("badge")).toBeTruthy();
    expect(screen.getByTestId("meta")).toBeTruthy();
    expect(row(container)).toBeTruthy();
  });

  it("stays inert without onOpen: no overlay button, no interactive surface", () => {
    const { container } = render(() => <ListRow title="Pulse" />);

    expect(container.querySelector("button")).toBeNull();
    expect(row(container).className).not.toContain(INTERACTIVE_MARKER);
  });

  it("activates from the whole row and carries the interactive surface", () => {
    const onOpen = vi.fn();
    const { container } = render(() => (
      <ListRow title="Ihsen" onOpen={onOpen} openLabel="Open Ihsen" />
    ));

    expect(row(container).className).toContain(INTERACTIVE_MARKER);
    fireEvent.click(screen.getByLabelText("Open Ihsen"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows the chevron only when the row opens and owns no actions", () => {
    const withChevron = render(() => <ListRow title="A" onOpen={() => {}} openLabel="A" />);
    expect(withChevron.container.querySelector('[data-icon="lucide:chevron-right"]')).toBeTruthy();
    cleanup();

    const withActions = render(() => (
      <ListRow
        title="A"
        onOpen={() => {}}
        openLabel="A"
        actions={<button type="button">x</button>}
      />
    ));
    expect(withActions.container.querySelector('[data-icon="lucide:chevron-right"]')).toBeNull();
  });

  it("keeps actions clickable above the open overlay", () => {
    const onOpen = vi.fn();
    const onAction = vi.fn();
    render(() => (
      <ListRow
        title="Main"
        onOpen={onOpen}
        openLabel="Open Main"
        actions={
          <button type="button" onClick={onAction}>
            Delete
          </button>
        }
      />
    ));

    fireEvent.click(screen.getByText("Delete"));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
