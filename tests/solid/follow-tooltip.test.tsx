import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, expect, it } from "vitest";
import { ariaBool } from "../../src/index.js";
import { FollowTooltip, trusted } from "../../src/solid/index.js";

afterEach(cleanup);

it("renders nothing until it has a point, then trails it in a layer on the body", async () => {
  const [at, setAt] = createSignal<{ x: number; y: number }>();
  const { container } = render(() => <FollowTooltip at={at()}>Clock</FollowTooltip>);
  expect(document.querySelector("[data-slot=follow-tooltip]")).toBeNull();
  setAt({ x: 100, y: 50 });
  await Promise.resolve();
  const tip = document.querySelector<HTMLElement>("[data-slot=follow-tooltip]");
  if (!tip) throw new Error("no tooltip");
  expect(container.contains(tip)).toBe(false);
  expect(tip.getAttribute("role")).toBe("tooltip");
  expect(tip.textContent).toBe("Clock");
  expect([tip.style.left, tip.style.top]).toEqual(["116px", "70px"]);
  setAt(undefined);
  await Promise.resolve();
  expect(document.querySelector("[data-slot=follow-tooltip]")).toBeNull();
});

it("ariaBool writes both states as strings", () => {
  expect([ariaBool(true), ariaBool(false)]).toEqual(["true", "false"]);
});

it("trusted keeps the markup it is given", () => {
  const holder = document.createElement("div");
  holder.innerHTML = trusted("<b>x</b>");
  expect(holder.innerHTML).toBe("<b>x</b>");
});
