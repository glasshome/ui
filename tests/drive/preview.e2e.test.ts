import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { PKG } from "../../dev/drive/serve";

function preview(args: string[], env: Record<string, string> = {}) {
  const run = spawnSync("bun", [join(PKG, "dev/drive/main.ts"), "preview", ...args], {
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
  expect(run.stderr).toBe("");
  expect(existsSync(run.last), run.stdout).toBe(true);
  return run.last;
}

const scenarioIds = (component: string) =>
  readdirSync(join(PKG, "tests/harness/__transcripts__"))
    .filter((f) => f.startsWith(`${component}.`))
    .map((f) => f.slice(component.length + 1, -".txt".length));

/** A repository with one empty commit, so nothing has changed whatever this checkout holds. */
function emptyRepo(): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), "ui-preview-git-"));
  const git = (...args: string[]) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  git("init", "-q");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "init");
  return { GIT_DIR: join(dir, ".git"), GIT_WORK_TREE: dir };
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

  it("preview --against a ref without dev/components exits 2 with the message", () => {
    const git = (args: string[], input?: string) =>
      spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
        cwd: PKG,
        encoding: "utf8",
        input,
        env: { ...process.env, GIT_AUTHOR_DATE: "@0 +0000", GIT_COMMITTER_DATE: "@0 +0000" },
      }).stdout.trim();
    const before = git(["commit-tree", git(["mktree"], ""), "-m", "empty"]);
    const run = preview(["spinner", "--against", before]);
    expect(run.code).toBe(2);
    expect(run.stderr).toContain(`${before} has no scenario folders`);
  });

  it("preview --changed with no changes previews nothing and says so", () => {
    const run = preview(["--changed", "--since", "HEAD"], emptyRepo());
    expect(run.code, run.stderr).toBe(0);
    expect(run.last).toBe("No component changed since HEAD.");
  });

  it("preview of an unknown component exits 2 listing the known ones", () => {
    const run = preview(["nope"]);
    expect(run.code).toBe(2);
    const known = readdirSync(join(PKG, "dev/components")).toSorted().join(", ");
    expect(known).toContain("select, spinner, tabs");
    expect(run.stderr).toContain(`no component nope; known: ${known}`);
  });
});
