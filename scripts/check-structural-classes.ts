// Gate B3 (sdk-contract-hardening.md): a package class string may not depend on the consumer's
// Tailwind scanning package source. Arbitrary variants like `[&>svg]:` are the
// tell: unlike plain utilities, no consumer's own code coincidentally
// generates them, so they silently vanish for any consumer whose build never
// scans this package (the stacked-carousel break). Structural child styling
// ships as real CSS in styles/globals.css instead (see .carousel-stack,
// .gh-alert-*). Escape hatch: a `structural-ok: <reason>` comment on or
// directly above the offending line.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const LIB_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src/lib");
const ARBITRARY_VARIANT = /\[&[^\]]*\]:/;
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

let findings = 0;

for (const entry of readdirSync(LIB_DIR).sort()) {
  if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) continue;
  const file = path.join(LIB_DIR, entry);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((text, i) => {
    if (COMMENT_LINE.test(text)) return;
    if (!ARBITRARY_VARIANT.test(text)) return;
    if (text.includes("structural-ok:")) return;
    // Walk the comment block directly above for the escape marker.
    for (let j = i - 1; j >= 0 && COMMENT_LINE.test(lines[j] ?? ""); j--) {
      if (lines[j]?.includes("structural-ok:")) return;
    }
    findings++;
    console.error(
      `src/lib/${entry}:${i + 1}  consumer-generated structural class (arbitrary variant): ${text.trim().slice(0, 120)}`,
    );
  });
}

if (findings > 0) {
  console.error(
    `\n${findings} arbitrary variant(s) in lib class modules. Move the styling to real CSS in src/styles/globals.css (see .carousel-stack) or annotate with a \`structural-ok: <reason>\` comment.`,
  );
  process.exit(1);
}
console.log("check-structural-classes: lib class strings are consumer-independent.");
