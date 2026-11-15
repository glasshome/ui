import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = resolve(import.meta.dirname, "../..");
const folders = readdirSync(join(pkg, "dev/components"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const contractIds = (folder: string) =>
  [
    ...readFileSync(join(pkg, "dev/components", folder, "contract.md"), "utf8").matchAll(
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
