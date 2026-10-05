import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { expect, it } from "vitest";

const src = resolve(dirname(fileURLToPath(import.meta.url)), "../../src");

const candidates = readdirSync(src, { recursive: true, encoding: "utf8" })
  .filter((file) => /\.tsx?$/.test(file))
  .flatMap((file) => readFileSync(resolve(src, file), "utf8").split(/[\s"'`]+/));

it("every utility the ui source names compiles to well-formed var() references", async () => {
  const compiler = await compile("@tailwind utilities;", { base: src });
  const css = compiler.build(candidates);

  expect(css.match(/[^\n]*var\(--\s[^\n]*/g) ?? []).toEqual([]);
});
