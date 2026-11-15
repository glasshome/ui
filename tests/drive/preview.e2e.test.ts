import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { createServer, connect } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { PKG } from "../../dev/drive/serve";

function preview(args: string[], env: Record<string, string> = {}) {
  const run = spawnSync("bun", ["dev/drive/main.ts", "preview", ...args], {
    cwd: PKG,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  const lines = run.stdout.trim().split("\n");
  return { code: run.status, stdout: run.stdout, stderr: run.stderr, last: lines.at(-1) ?? "" };
}

function sheetOf(args: string[], env: Record<string, string> = {}): string {
  const run = preview([...args, "--out", mkdtempSync(join(tmpdir(), "ui-preview-"))], env);
  expect(run.code, run.stderr).toBe(0);
  expect(existsSync(run.last), run.stdout).toBe(true);
  return run.last;
}

const scenarioIds = (component: string) =>
  readdirSync(join(PKG, "tests/harness/__transcripts__"))
    .filter((f) => f.startsWith(`${component}.`))
    .map((f) => f.slice(component.length + 1, -".txt".length));

const freePort = () =>
  new Promise<number>((done) => {
    const server = createServer().listen(0, () => {
      const address = server.address();
      server.close(() => done(typeof address === "object" && address ? address.port : 0));
    });
  });

const refuses = (port: number) =>
  new Promise<boolean>((done) => {
    const socket = connect(port, "127.0.0.1");
    socket.on("connect", () => {
      socket.destroy();
      done(false);
    });
    socket.on("error", () => done(true));
  });

function workingTreeRef(): string {
  const git = (...args: string[]) =>
    spawnSync("git", args, { cwd: PKG, encoding: "utf8" }).stdout.trim();
  return git("stash", "create") || git("rev-parse", "HEAD");
}

describe("preview", () => {
  it("preview tabs writes one sheet with a cell per scenario and theme", () => {
    const sheet = sheetOf(["tabs"]);
    expect(sheet.endsWith("tabs.sheet.png")).toBe(true);
    const cells = readdirSync(dirname(sheet)).filter((f) => f !== "tabs.sheet.png");
    const expected = scenarioIds("Tabs").flatMap((id) => [`${id}.light.png`, `${id}.dark.png`]);
    expect(cells.toSorted()).toEqual(expected.toSorted());
  });

  it("preview select --after-steps shows the open list", () => {
    const dir = dirname(sheetOf(["select", "closed", "open", "--after-steps"]));
    const closed = readFileSync(join(dir, "closed.dark.png"));
    const open = readFileSync(join(dir, "open.dark.png"));
    expect(open.equals(closed)).toBe(false);
    expect(readdirSync(dir).filter((f) => f.startsWith("pick."))).toEqual([]);
  });

  it("preview --against HEAD splits every column into base and head", () => {
    const dir = dirname(sheetOf(["spinner", "labelled", "--against", "HEAD"]));
    expect(readdirSync(dir).toSorted()).toEqual([
      "labelled.dark.base.png",
      "labelled.dark.head.png",
      "labelled.light.base.png",
      "labelled.light.head.png",
      "spinner.sheet.png",
    ]);
  });

  it("preview leaves no server listening", async () => {
    const port = await freePort();
    const run = preview(["spinner", "labelled"], { GALLERY_PORT: String(port) });
    expect(run.code, run.stderr).toBe(0);
    expect(run.stderr).toContain(`:${port}`);
    expect(await refuses(port)).toBe(true);
  });

  it("preview --changed with no changes previews nothing and says so", () => {
    const ref = workingTreeRef();
    const run = preview(["--changed", "--since", ref]);
    expect(run.code, run.stderr).toBe(0);
    expect(run.last).toBe(`No component changed since ${ref}.`);
  });

  it("preview of an unknown component exits 2 listing the known ones", () => {
    const run = preview(["nope"]);
    expect(run.code).toBe(2);
    const known = readdirSync(join(PKG, "dev/components")).toSorted().join(", ");
    expect(known).toContain("select, spinner, tabs");
    expect(run.stderr).toContain(`no component nope; known: ${known}`);
  });
});
