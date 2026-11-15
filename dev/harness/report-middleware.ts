// Serves the driver's newest run of a scenario to the gallery: /__drive/<component>/<scenario>/latest.json and its step-N.png.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { join } from "node:path";
import type { Plugin } from "vite";
import { driveCacheDir } from "../drive/serve";

const SLUG = /^[a-z0-9-]+$/;
const FILE = /^(latest\.json|step-\d+\.png)$/;
const RUN_SUFFIX = /^[A-Za-z0-9]{6}$/;

function newestRun(cache: string, component: string, scenario: string): string | undefined {
  if (!existsSync(cache)) return undefined;
  const prefix = `${component}-${scenario}-`;
  return readdirSync(cache)
    .filter((d) => d.startsWith(prefix) && RUN_SUFFIX.test(d.slice(prefix.length)))
    .map((d) => join(cache, d))
    .filter((dir) => existsSync(join(dir, "report.json")))
    .map((dir) => ({ dir, at: statSync(join(dir, "report.json")).mtimeMs }))
    .sort((a, b) => b.at - a.at)[0]?.dir;
}

const notFound = (res: ServerResponse) => {
  res.statusCode = 404;
  res.end();
};

export function driveReports(cache = driveCacheDir()): Plugin {
  return {
    name: "drive-reports",
    configureServer(server) {
      server.middlewares.use("/__drive", (req, res) => {
        const url = new URL(req.url ?? "/", "http://gallery");
        const [component = "", scenario = "", file = ""] = url.pathname.split("/").filter(Boolean);
        if (!SLUG.test(component) || !SLUG.test(scenario) || !FILE.test(file)) return notFound(res);
        const run = url.searchParams.get("run");
        const dir =
          run === null
            ? newestRun(cache, component, scenario)
            : join(cache, `${component}-${scenario}-${run}`);
        if (run !== null && !RUN_SUFFIX.test(run)) return notFound(res);
        const path = dir && join(dir, file === "latest.json" ? "report.json" : file);
        if (!path || !existsSync(path)) return notFound(res);
        res.setHeader("content-type", file.endsWith(".png") ? "image/png" : "application/json");
        res.setHeader("cache-control", "no-store");
        res.end(readFileSync(path));
      });
    },
  };
}
