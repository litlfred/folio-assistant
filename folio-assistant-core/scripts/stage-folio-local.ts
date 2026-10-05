#!/usr/bin/env bun
/**
 * stage-folio-local — a folio's STAGING preview built and published from a
 * checkout, running the same steps as `.github/workflows/folio-staging.yml`
 * in the same order, for when Actions are unavailable.
 *
 * ## Why this exists: a process failure, recorded
 *
 * Owner, 2026-10-05: Actions are off ("no $"), and asked for the qou folio on
 * staging. An agent assembled the preview BY HAND from the workflow's parts
 * and published four times; each time the owner found the step it had
 * skipped — no harness chrome (`rail-standalone-pages`), then no staging
 * banner (`staging-banner`), then a light-mode toggle that did nothing and
 * math taller than the text (never checked in a browser). *"figure out why
 * process failures in harnessing and using chrome from harness."* The cause
 * was not any one step: it was rebuilding a pipeline from memory instead of
 * running it. So the pipeline is this one command, and its last step before
 * publishing is a browser check (`folio-site-chrome-check.ts`) of exactly the
 * defects a person found.
 *
 * Steps, named as in `folio-staging.yml`:
 *   1. Build the folio's site            `--build` (default: build-folio-site.ts)
 *   2. Give every page the harness navbar and rail   rail-standalone-pages.ts --foreign-site
 *   3. Inject staging banner             staging-banner.ts
 *   4. Check the chrome in a browser     folio-site-chrome-check.ts (refuses to publish on a failure)
 *   5. Deploy the preview                `--deploy`: STAGING/<slug>/ on the publish branch, replaced whole
 *
 * Not run here, and said so rather than skipped silently: the ChangeSet, the
 * folio's QA sweep and the before/after screenshots. They need a base build
 * and a reviewer surface this local path does not have yet.
 *
 *   bun run folio-assistant-core/scripts/stage-folio-local.ts --repo <folio> --slug <slug> \
 *     --publish-repo owner/repo --pr-url <url> --run-url <url> [--check-page <path>] [--deploy]
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

import { checkChrome } from "./folio-site-chrome-check.js";

const PLATFORM = resolve(import.meta.dir, "../..");
const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const need = (n: string): string => {
  const v = arg(n);
  if (!v) {
    console.error(`stage-folio-local: --${n} is required`);
    process.exit(2);
  }
  return v;
};
const run = (cmd: string, args: string[], cwd: string) => {
  console.error(`$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
};

const repo = resolve(need("repo"));
const slug = need("slug");
const site = resolve(repo, arg("site-dir") ?? "_site");
const publishRepo = need("publish-repo");
const sha = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: repo }).toString().trim();

// 1. Build
rmSync(site, { recursive: true, force: true });
const build = arg("build");
if (build) run("bash", ["-c", build], repo);
else run("bun", ["run", join(PLATFORM, "folio-assistant-core/scripts/build-folio-site.ts"), "--out", site], repo);

// 2. Rail
run("bun", ["run", join(PLATFORM, "cat-harness/scripts/rail-standalone-pages.ts"), "--site", site, "--built", "cat-harness", "--foreign-site", "--home-label", arg("home-label") ?? slug], PLATFORM);

// 3. Banner
run(
  "bun",
  [
    "run", join(PLATFORM, "cat-harness/scripts/staging-banner.ts"),
    "--site", site, "--branch", slug, "--sha", sha, "--built", new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    "--pr", arg("pr") ?? "n/a", "--pr-url", need("pr-url"),
    "--branch-url", `https://github.com/${publishRepo}/tree/${arg("source-ref") ?? "main"}`,
    "--issues-url", `https://github.com/${publishRepo}/issues`, "--run-url", need("run-url"),
    "--main-site", arg("main-site") ?? `https://${publishRepo.split("/")[0]}.github.io/${publishRepo.split("/")[1]}`,
    "--before-ref", arg("before-ref") ?? "main",
  ],
  PLATFORM,
);

// 4. Chrome check, over a local server, on one representative page.
const types: Record<string, string> = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  let p = join(site, decodeURIComponent((req.url ?? "/").split("?")[0]!));
  if (p.endsWith("/")) p = join(p, "index.html");
  let body: Buffer;
  try {
    body = await readFile(p); // read BEFORE the header goes out, so a miss can still answer 404
  } catch {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[extname(p)] ?? "application/octet-stream" }).end(body);
});
await new Promise<void>((ok) => server.listen(0, ok));
const port = (server.address() as { port: number }).port;
// declared-path-literal: the default page to CHECK is build-folio-site's published URL route
// (the owner's `<base>/cat-harness/folio/`), under the built site — nothing is read from
// cat-harness's declared folio/ graph. `--check-page` overrides it.
const page = arg("check-page") ?? "cat-harness/folio/";
let checks;
try {
  checks = await checkChrome({ url: `http://localhost:${port}/${page.replace(/^\/+/, "")}`, assets: arg("assets"), katex: arg("katex") });
} catch (e) {
  server.close();
  console.error(`? chrome check could not run (${(e as Error).message}); NOT publishing — a check that did not run is not a pass.`);
  process.exit(2);
}
server.close();
for (const c of checks) console.error(`${c.ok ? "✓" : "✗"} ${c.name}: ${c.detail}`);
if (!checks.every((c) => c.ok)) {
  console.error("✗ chrome check failed; NOT publishing.");
  process.exit(1);
}
console.error("Not run locally (said, not skipped): ChangeSet, folio QA sweep, before/after screenshots.");

// 5. Deploy
if (!process.argv.includes("--deploy")) {
  console.error(`built and checked in ${site}; pass --deploy to publish STAGING/${slug}/`);
  process.exit(0);
}
const branch = arg("publish-branch") ?? "gh-pages";
const work = mkdtempSync(join(tmpdir(), "stage-"));
try {
  // Partial, sparse: the publish branch can hold tens of thousands of files, none of which we need.
  run("git", ["clone", "-q", "--depth=1", "--filter=blob:none", "--no-checkout", "--single-branch", "-b", branch, `https://github.com/${publishRepo}`, work], repo);
  run("git", ["sparse-checkout", "set", "--no-cone", `/STAGING/${slug}/`], work);
  run("git", ["checkout", "-q", branch], work);
  const dest = join(work, "STAGING", slug);
  if (existsSync(dest)) run("git", ["rm", "-r", "-q", `STAGING/${slug}`], work);
  cpSync(site, dest, { recursive: true });
  run("git", ["add", "-A", "STAGING"], work);
  run("git", ["-c", "gc.auto=0", "commit", "-q", "-m", `staging: ${slug} @ ${sha} (stage-folio-local)\n\n${arg("message") ?? ""}`.trim()], work);
  run("git", ["-c", "gc.auto=0", "push", "-q", "origin", branch], work);
  console.error(`✓ published STAGING/${slug}/ to ${publishRepo}@${branch}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
