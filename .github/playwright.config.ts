/**
 * The index checkout's Playwright config: cat-harness-tools' config, plus one
 * project for each other mounted layer that carries `*.e2e.ts` specs.
 *
 * cat-harness-tools' config collects only its own `test/` (`testDir`). A
 * browser test that belongs to another layer, such as fhir-harness's
 * `ig-page-render-qa.e2e.ts`, would otherwise run nowhere, since the
 * `bun test` shards install no browser (owner, 2026-10-14). The layers are
 * read from `index.lock.json`, so a newly mounted layer's specs are collected
 * without an edit here (owner card, 2026-11-13: Q1 A).
 *
 * Every path in the tools config is relative to that file's directory, and
 * Playwright resolves a config's relative paths against the config that is
 * loaded, so they are made absolute here.
 *
 * @covers none — a browser-test runner's configuration, not a graph audit
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";
import base from "../cat-harness-tools/playwright.config.ts";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const TOOLS = join(ROOT, "cat-harness-tools");
const abs = (p: string | undefined): string | undefined => (p === undefined || isAbsolute(p) ? p : resolve(TOOLS, p));

/** True when `dir` holds a `*.e2e.ts` anywhere below it, `node_modules/` aside. */
function holdsE2e(dir: string): boolean {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    if (e.isDirectory() ? holdsE2e(join(dir, e.name)) : e.name.endsWith(".e2e.ts")) return true;
  }
  return false;
}

const lock = JSON.parse(readFileSync(join(ROOT, "index.lock.json"), "utf-8")) as { mounts: { harness: string }[] };
const layers = lock.mounts.map((m) => m.harness).filter((h) => h !== "cat-harness-tools" && existsSync(join(ROOT, h)) && holdsE2e(join(ROOT, h)));

const toolsProjects = (base.projects ?? []).map((p) => ({ ...p, testDir: abs(p.testDir ?? base.testDir) }));
const chromium = toolsProjects.find((p) => p.name === "chromium");

const reporter = Array.isArray(base.reporter)
  ? base.reporter.map(([name, o]) => [name, o && "outputFolder" in o ? { ...o, outputFolder: abs(o.outputFolder as string) } : o] as [string, unknown])
  : base.reporter;

export default defineConfig({
  ...base,
  testDir: abs(base.testDir),
  globalSetup: typeof base.globalSetup === "string" ? abs(base.globalSetup) : base.globalSetup,
  outputDir: abs(base.outputDir),
  reporter: reporter as PlaywrightTestConfig["reporter"],
  webServer: base.webServer && !Array.isArray(base.webServer) ? { ...base.webServer, cwd: abs(base.webServer.cwd) } : base.webServer,
  projects: [
    ...toolsProjects,
    ...layers.map((h) => ({ name: `chromium:${h}`, use: chromium?.use, testDir: join(ROOT, h), testIgnore: ["**/node_modules/**"] })),
  ],
});
