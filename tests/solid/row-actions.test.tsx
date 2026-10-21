import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { RowActions } from "../../src/solid/settings-row.js";

afterEach(cleanup);

describe("RowActions", () => {
  it("names its icon buttons for the row they act on", () => {
    render(() => <RowActions name="Kitchen" onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole("button", { name: "Edit Kitchen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete Kitchen" })).toBeTruthy();
  });

  it("names them by the action alone when the row has no name", () => {
    render(() => <RowActions onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });
});
