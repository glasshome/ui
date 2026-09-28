#!/usr/bin/env bun
// publint and attw ignore custom conditions, so a `solid` target can point outside the tarball.
import pkg from "../package.json" with { type: "json" };

const root = new URL("..", import.meta.url).pathname;
const pack = Bun.spawnSync(["npm", "pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: root,
});
if (pack.exitCode !== 0) {
  console.error(pack.stderr.toString());
  process.exit(pack.exitCode ?? 1);
}
const files = new Set<string>(
  (JSON.parse(pack.stdout.toString())[0].files as { path: string }[]).map((f) => f.path),
);

function targets(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(targets);
  return [];
}

const missing = [...new Set(targets(pkg.exports))]
  .map((t) => t.replace(/^\.\//, ""))
  .filter((t) =>
    t.endsWith("/*") ? ![...files].some((f) => f.startsWith(t.slice(0, -1))) : !files.has(t),
  );
if (missing.length > 0) {
  console.error(`check-pack: exports point outside the tarball:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log(`check-pack: ${files.size} files, every export target present`);
