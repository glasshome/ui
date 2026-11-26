import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { scenarioScope } from "../../dev/harness/steps";
import { Avatar, AvatarFallback, AvatarImage } from "../../src/solid";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%232563eb'/%3E%3C/svg%3E";
const OTHER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%23dc2626'/%3E%3C/svg%3E";
const BROKEN = "data:image/png;base64,AA==";

const slot = (name: string) =>
  scenarioScope()
    .map((s) => s.querySelector<HTMLElement>(`[data-slot="${name}"]`))
    .find((el) => el !== null) ?? null;
const image = () => slot("avatar-image") as HTMLImageElement | null;
const fallback = () => slot("avatar-fallback");
const until = async (ok: () => boolean) => {
  await expect.poll(() => ok()).toBe(true);
};

describe("Avatar contract", () => {
  it("AV1 without an image, a span with the fallback and no img", async () => {
    await mountScenario("Avatar", "fallback");
    expect(slot("avatar")?.tagName).toBe("SPAN");
    expect(fallback()?.textContent).toBe("AL");
    expect(image()).toBeNull();
  });

  it("AV2 the fallback holds until the photo loads, then the img replaces it", async () => {
    render(() => (
      <Avatar>
        <AvatarImage src={PHOTO} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ));
    expect(fallback()).not.toBeNull();
    expect(image()).toBeNull();
    await until(() => image() !== null);
    expect(image()?.getAttribute("alt")).toBe("Ada Lovelace");
    expect(image()?.getAttribute("src")).toBe(PHOTO);
    expect(fallback()).toBeNull();
  });

  it("AV3 a photo that fails keeps the fallback", async () => {
    const heard: string[] = [];
    render(() => (
      <Avatar onLoadingStatusChange={(s) => heard.push(s)}>
        <AvatarImage src={BROKEN} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ));
    await until(() => heard.includes("error"));
    await settle();
    expect(fallback()?.textContent).toBe("AL");
    expect(image()).toBeNull();
  });

  it("AV5 onLoadingStatusChange hears loading, then loaded", async () => {
    const heard: string[] = [];
    render(() => (
      <Avatar onLoadingStatusChange={(s) => heard.push(s)}>
        <AvatarImage src={PHOTO} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ));
    await until(() => heard.includes("loaded"));
    expect(heard).toEqual(["loading", "loaded"]);
  });

  it("AV6 a new source brings the fallback back until it loads", async () => {
    const [src, setSrc] = createSignal(PHOTO);
    render(() => (
      <Avatar>
        <AvatarImage src={src()} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ));
    await until(() => image() !== null);
    setSrc(OTHER);
    flush();
    expect(fallback()).not.toBeNull();
    expect(image()).toBeNull();
    await until(() => image()?.getAttribute("src") === OTHER);
    expect(fallback()).toBeNull();
  });
});
