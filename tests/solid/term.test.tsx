import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Term } from "../../src/solid/term.js";

afterEach(cleanup);

const HUB_ACCOUNT = {
  icon: "lucide:cloud",
  title: "Hub account",
  line: "Your account on glasshome.app.",
  href: "https://glasshome.app/docs/hub/faq",
};

describe("Term", () => {
  it("explains the word in place when tapped", async () => {
    const view = render(() => (
      <p>
        Connect your <Term term={HUB_ACCOUNT} /> to share.
      </p>
    ));

    expect(screen.queryByText("Your account on glasshome.app.")).toBeNull();
    await userEvent.click(view.getByRole("button", { name: "Hub account" }));

    expect(await screen.findByText("Your account on glasshome.app.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Learn more/ }).getAttribute("href")).toBe(
      HUB_ACCOUNT.href,
    );
  });
});
