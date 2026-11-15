import { readFileSync } from "node:fs";
import type { Page } from "playwright";

export interface Cell {
  label: string;
  png: string;
}

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

const STYLE = `
  body { margin: 0; background: #2a2a2e; color: #e8e8ea; font: 13px/1.4 system-ui, sans-serif; }
  #sheet { display: inline-grid; gap: 12px; padding: 16px; align-items: start; }
  .head { font-weight: 600; text-align: center; }
  .row { font-weight: 600; padding-top: 4px; white-space: nowrap; }
  img { display: block; outline: 1px solid #55555c; }
`;

/** Rows are `cells` taken `columns.length` at a time, labelled by each row's first cell. */
export async function contactSheet(
  page: Page,
  cells: Cell[],
  columns: string[],
  path: string,
): Promise<string> {
  const rows: string[] = [];
  for (let start = 0; start < cells.length; start += columns.length) {
    const row = cells.slice(start, start + columns.length);
    const images = row.map(
      (c) => `<img src="data:image/png;base64,${readFileSync(c.png).toString("base64")}">`,
    );
    rows.push(`<div class="row">${escape(row[0]?.label ?? "")}</div>${images.join("")}`);
  }
  const head = columns.map((c) => `<div class="head">${escape(c)}</div>`).join("");
  await page.setContent(
    `<style>${STYLE}</style><div id="sheet" style="grid-template-columns: auto repeat(${columns.length}, auto)"><div></div>${head}${rows.join("")}</div>`,
  );
  await page.locator("#sheet").screenshot({ path });
  return path;
}
