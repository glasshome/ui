import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = resolve(import.meta.dirname, "../..");
const ROOTS = ["dev/components", "dev/blocks"];
const folderRoot = (folder: string) =>
  ROOTS.find((root) => existsSync(join(pkg, root, folder, "contract.md"))) ?? "dev/components";
const folders = ROOTS.flatMap((root) =>
  existsSync(join(pkg, root))
    ? readdirSync(join(pkg, root), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [],
);

const contractIds = (folder: string) =>
  [
    ...readFileSync(join(pkg, folderRoot(folder), folder, "contract.md"), "utf8").matchAll(
      /^\|\s*([A-Z]+\d+)\s*\|/gm,
    ),
  ].map((m) => m[1]);

const testTitles = (folder: string) => {
  const file = join(pkg, "tests/contracts", `${folder}.contract.test.tsx`);
  if (!existsSync(file)) return [];
  return [...readFileSync(file, "utf8").matchAll(/\bit\(\s*["'`]([A-Z]+\d+)\b/g)].map((m) => m[1]);
};

describe("every contract line has its test", () => {
  it.each(folders)("%s", (folder) => {
    const ids = contractIds(folder);
    expect(ids.length).toBeGreaterThan(0);
    const missing = ids.filter((id) => !testTitles(folder).includes(id));
    expect(missing).toEqual([]);
  });
});

const ITEM = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/;
const workDir = resolve(pkg, "../../../docs/work");

describe("a11y gaps", () => {
  it("a gap entry names an open work item", () => {
    const entries = folders.flatMap((folder) => {
      const file = join(pkg, folderRoot(folder), folder, "a11y-gaps.json");
      if (!existsSync(file)) return [];
      const gaps: { scenario: string; rule: string; item: string }[] = JSON.parse(
        readFileSync(file, "utf8"),
      );
      return gaps.map((gap) => ({ folder, ...gap }));
    });
    // Standalone, ui has no docs/work beside it; the id still has to be one.
    const inDash = existsSync(workDir);
    const bad = entries.filter((gap) => {
      if (!ITEM.test(gap.item)) return true;
      if (!inDash) return false;
      const readme = join(workDir, gap.item, "README.md");
      const flat = join(workDir, `${gap.item}.md`);
      const path = existsSync(readme) ? readme : flat;
      return !existsSync(path) || /^status:\s*(done|gated)\s*$/m.test(readFileSync(path, "utf8"));
    });
    expect(bad).toEqual([]);
  });
});
