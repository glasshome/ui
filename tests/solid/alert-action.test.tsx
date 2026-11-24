import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, it } from "vitest";
import { Alert } from "../../src/solid/alert.js";
import { Button } from "../../src/solid/button.js";

afterEach(cleanup);

it("an Alert without an action carries its corner watermark", () => {
  const view = render(() => <Alert>Heads up</Alert>);
  expect(view.container.querySelector(".gh-alert-icon-bg")).not.toBeNull();
});

it("an Alert with an action leaves the action's corner to the action", () => {
  const view = render(() => (
    <Alert size="sm" action={<Button aria-label="Close">x</Button>}>
      Heads up
    </Alert>
  ));
  expect(view.container.querySelector(".gh-alert-icon-bg")).toBeNull();
  expect(view.getByRole("button", { name: "Close" })).toBeTruthy();
});
