import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { LabeledInput } from "../../src/solid/settings-row.js";

afterEach(cleanup);

describe("LabeledField", () => {
  it("names its control by the label, not the placeholder", () => {
    render(() => (
      <LabeledInput label="Name" value="" onInput={() => {}} placeholder="Living Room" />
    ));
    expect(screen.getByRole("textbox", { name: "Name" })).toBeTruthy();
  });
});
