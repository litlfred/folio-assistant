#!/usr/bin/env bun
/**
 * stage-local — build a folio's staging preview in the agent's own checkout
 * and push it to the publish branch at `STAGING/<slug>/`, without waiting for
 * an Actions runner to pick up the staging workflow.
 *
 * @module scripts/stage-local
 * @covers none — a PUBLISHER, not an audit: it builds and deploys one preview and judges nothing
 *
 * ```sh
 * bun run cat-harness/scripts/stage-local.ts --repo ../smart-ra [--branch B] [--dry-run]
 * ```
 *
 * ## Why this exists
 *
 * Owner, 2026-10-07: *"do agent-triggered staging next"* — chosen over
 * logging it, after a measurement. smart-ra's dispatch of `staging.yml` that
 * morning (run 37584204273) waited **33 min** for a runner and then ran for
 * 45 s. The agent that asked for it had the checkout, the platform and bun in
 * hand the whole time.
 *
 * ## What it does NOT remove, and says so
 *
 * A push to the publish branch is deployed by GitHub's own `pages build and
 * deployment`, which is ALSO an Actions run. The same morning that run took
 * **47 min**, of which about a minute was work. Nothing here can skip it: the
 * official URL is served by Pages, and Pages deploys on a runner. So this
 * removes the first wait and not the second, and its output says the preview
 * is live only once that deploy has run.
 *
 * ## The same steps as the workflow, read from the folio
 *
 * The folio's own `.github/workflows/staging.yml` passes `build_command`,
 * `site_dir`, `folio_dir`, `platform_dir` and `publish_branch` to the
 * reusable `folio-staging.yml`. Those inputs are READ from that file, never
 * restated here, so a folio that changes its build changes it once. Then, in
 * the workflow's order:
 *
 * 1. the slug, by the workflow's rule ({@link slugOf}), refused when it names
 *    no single path segment (bean `fuzm`);
 * 2. the folio's build command, run in the folio checkout;
 * 3. the rail, `rail-standalone-pages.ts`, with the workflow's arguments;
 * 4. the ChangeSet and the rendered impact against the base branch, so the
 *    review page has its data;
 * 5. the banner, `staging-banner.ts`, saying the preview was built locally;
 * 6. the push, held by `staging-push-gate.ts` exactly as the workflow is
 *    (issue #1956): a preview never lands while the main site's Pages build
 *    it would cancel is running. The commit message starts `staging(<slug>)`,
 *    which is how the gate and every later push recognise a staging commit.
 *    The preview REPLACES the slug's directory (bean `85im`), the build is
 *    checked non-empty before anything is deleted (bean `oisv`), and the
 *    render log gets its entry (`render-log.ts`).
 *
 * Not run: the QA sweep, block screenshots, review-comment ingestion and the
 * PR comment. The banner names the preview as built locally so a reviewer is
 * not told those exist.
 *
 * ## `--artifact <dir>`: a preview with no GitHub in the loop
 *
 * The second half of the owner's choice: the same build, written as a BUNDLE a
 * claude.ai Artifact can carry, and nothing pushed. The agent then publishes
 * `<dir>/index.html` with the files `<dir>/artifact.json` lists; it is live in
 * about a minute and private until shared. An Artifact holds at most
 * {@link ARTIFACT_MAX_FILES} files per publish and {@link ARTIFACT_MAX_BYTES}
 * bytes, so when the site is bigger, whole top-level directories are left out,
 * the ones holding the most files first (smart-ra's 2,931 node-kind pages
 * under `en/`), and `artifact.json` names each one left out and how many
 * files it held: a link into one of them 404s in the Artifact, and a reviewer
 * is told rather than left to find out.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

import { decide, readTip } from "./staging-push-gate.ts";

/** Files one Artifact publish may carry, the page included (the Artifact tool's limit is 255; one is the page). */
export const ARTIFACT_MAX_FILES = 254;
/** Bytes one Artifact publish may carry (the tool's limit is 64 MB; a margin for the page). */
export const ARTIFACT_MAX_BYTES = 60 * 1024 * 1024;

export interface ArtifactBundle {
  page: "index.html";
  /** Published paths, relative to the bundle directory, the page excluded. */
  files: string[];
  bytes: number;
  /** Top-level directories left out to fit, with how many files each held. */
  dropped: { dir: string; files: number; bytes: number }[];
}

/**
 * Which files of a built site fit one Artifact publish. Pure over the listing:
 * `files` maps each site-relative path to its size. Whole top-level
 * directories are dropped, most files first, until the rest fits; a site whose
 * root files alone do not fit is refused.
 */
export function artifactBundle(files: Map<string, number>): ArtifactBundle {
  if (!files.has("index.html")) throw new Error("the site has no index.html to open the Artifact on");
  const top = new Map<string, { files: number; bytes: number }>();
  for (const [p, n] of files) {
    const i = p.indexOf("/");
    if (i < 0) continue;
    const d = p.slice(0, i);
    const t = top.get(d) ?? { files: 0, bytes: 0 };
    top.set(d, { files: t.files + 1, bytes: t.bytes + n });
  }
  const dropped: ArtifactBundle["dropped"] = [];
  const kept = () => [...files.entries()].filter(([p]) => p !== "index.html" && !dropped.some((d) => p.startsWith(`${d.dir}/`)));
  const fits = () => {
    const k = kept();
    return k.length <= ARTIFACT_MAX_FILES && k.reduce((a, [, n]) => a + n, 0) + (files.get("index.html") ?? 0) <= ARTIFACT_MAX_BYTES;
  };
  const order = [...top.entries()].sort((a, b) => b[1].files - a[1].files || b[1].bytes - a[1].bytes || a[0].localeCompare(b[0]));
  for (const [dir, t] of order) {
    if (fits()) break;
    dropped.push({ dir, ...t });
  }
  if (!fits()) throw new Error(`even the site's root files exceed one Artifact publish (${ARTIFACT_MAX_FILES} files, ${ARTIFACT_MAX_BYTES} bytes)`);
  const k = kept();
  return { page: "index.html", files: k.map(([p]) => p).sort(), bytes: k.reduce((a, [, n]) => a + n, 0) + files.get("index.html")!, dropped };
}

function listSite(dir: string): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (d: string, rel: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(d, e.name), r);
      else if (e.isFile()) out.set(r, statSync(join(d, e.name)).size);
    }
  };
  walk(dir, "");
  return out;
}

/** The staging workflow's inputs this needs, as the folio's own file passes them. */
export interface StagingInputs {
  build_command: string;
  site_dir: string;
  folio_dir: string;
  platform_dir: string;
  publish_branch: string;
}

const DEFAULTS: Omit<StagingInputs, "build_command"> = {
  site_dir: "_site",
  folio_dir: "folio",
  platform_dir: "folio-assistant",
  publish_branch: "gh-pages",
};

/**
 * The `with:` inputs of the folio's staging workflow. A line-level read, not a
 * YAML parser: the file is one `uses:` job whose inputs are single-line scalars,
 * which is the shape `folio_init` writes. Undefined when there is no
 * `build_command`, since nothing can be built without it.
 */
export function readStagingInputs(yaml: string): StagingInputs | undefined {
  const got: Record<string, string> = {};
  for (const m of yaml.matchAll(/^\s+(build_command|site_dir|folio_dir|platform_dir|publish_branch):\s*(.+?)\s*$/gm)) {
    let v = m[2]!;
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    if (m[2]!.startsWith("'")) v = v.replace(/''/g, "'");
    got[m[1]!] = v;
  }
  if (!got.build_command) return undefined;
  return { ...DEFAULTS, ...got } as StagingInputs;
}

/**
 * The workflow's slug rule: anything outside `[A-Za-z0-9._-]` becomes `-`,
 * runs collapse, ends trim. Undefined when the result names no single path
 * segment, because the deploy then deletes `STAGING/<slug>` (bean `plj1`).
 */
export function slugOf(branch: string): string | undefined {
  const s = branch.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return s === "" || s === "." || s === ".." ? undefined : s;
}

/** Files a preview's data steps write that are not a site on their own (the workflow's list). */
const DATA_ONLY = /^(changeset\.json|changeset-text\.json|rendered-impact\.json|rendered-measured\.json|blocks\.json|block-qa\.json|review-comments\.json|visual-diff\.json|visual)$/;

/** True when the build wrote at least one file that is a page, not only data (bean `oisv`). */
export function builtSomething(siteDir: string): boolean {
  return existsSync(siteDir) && readdirSync(siteDir).some((f) => !DATA_ONLY.test(f));
}

/** `owner/repo` from a GitHub remote URL, or undefined. */
export function ownerRepoOf(remote: string): string | undefined {
  return /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(remote.trim())?.[1];
}

/** `<instance>/<rel>` in the first of the platform's top-level directories that has it, or undefined. */
export function inPlatform(platform: string, rel: string): string | undefined {
  if (!existsSync(platform)) return undefined;
  for (const d of readdirSync(platform, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name).sort()) {
    const f = join(platform, d, rel);
    if (existsSync(f)) return f;
  }
  return undefined;
}

const git = (cwd: string, args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8" }).trim();

function run(cwd: string, cmd: string, args: string[], env: NodeJS.ProcessEnv = {}): void {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} … exited ${r.status}`);
}

export interface StageOptions {
  repo: string;
  branch?: string;
  base?: string;
  runUrl?: string;
  dryRun?: boolean;
  /** Write an Artifact bundle here instead of pushing. */
  artifact?: string;
  log?: (s: string) => void;
}

export interface StageResult {
  slug: string;
  url: string;
  pushed: boolean;
  commit?: string;
  site: string;
  /** With `artifact`: the bundle written, and where. */
  bundle?: ArtifactBundle & { dir: string };
}

export async function stageLocal(o: StageOptions): Promise<StageResult> {
  const log = o.log ?? ((s: string) => console.error(s));
  const repo = resolve(o.repo);
  const wf = join(repo, ".github", "workflows", "staging.yml");
  const inputs = existsSync(wf) ? readStagingInputs(readFileSync(wf, "utf-8")) : undefined;
  if (!inputs) throw new Error(`${wf}: no build_command — this folio has no staging workflow to mirror`);
  const branch = o.branch ?? git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const slug = slugOf(branch);
  if (!slug) throw new Error(`branch '${branch}' gives no safe staging slug`);
  const sha = git(repo, ["rev-parse", "HEAD"]);
  const ownerRepo = ownerRepoOf(git(repo, ["remote", "get-url", "origin"]));
  if (!ownerRepo) throw new Error("origin is not a GitHub remote");
  const [owner, name] = ownerRepo.split("/") as [string, string];
  const pagesRoot = `https://${owner}.github.io/${name}`;
  const url = `${pagesRoot}/STAGING/${slug}/`;
  const platform = resolve(repo, inputs.platform_dir);
  if (!existsSync(join(platform, "cat-harness"))) throw new Error(`${platform}: the platform is not checked out where staging.yml names it`);
  const site = resolve(repo, inputs.site_dir);
  const base = o.base ?? "main";

  log(`· building ${ownerRepo}@${branch} (${sha.slice(0, 7)}) → STAGING/${slug}/`);
  rmSync(site, { recursive: true, force: true });
  run(repo, "bash", ["-c", inputs.build_command]);
  if (!builtSomething(site)) throw new Error(`the build produced no site in ${site} — refusing to deploy`);

  run(repo, "bun", ["run", join(platform, "cat-harness/scripts/rail-standalone-pages.ts"), "--site", site, "--built", "cat-harness", "--foreign-site", "--home-label", name]);

  git(repo, ["fetch", "-q", "origin", base]);
  // The ChangeSet and the rendered impact are a content layer's, above this
  // one: found in whichever of the platform's instances carries them, never
  // named here. A platform without them gets no review data, and the review
  // page says so, as the workflow does when it has no renderer.
  const changeset = inPlatform(platform, "schemas/changeset.ts");
  if (changeset) run(repo, "bun", ["run", changeset, "--folio", inputs.folio_dir, "--base", `origin/${base}`, "--head", "worktree", "--out", join(site, "changeset.json"), "--text-out", join(site, "changeset-text.json")]);
  else log("· this platform has no ChangeSet tool: no review data on this preview");
  const impact = inPlatform(platform, "scripts/document-rendered-impact.ts");
  if (changeset && impact) {
    run(repo, "bun", ["run", impact, "--root", ".", "--base", `origin/${base}`, "--head", "HEAD", "--changeset", join(site, "changeset.json"), "--outline", join(site, "outline.json"), "--build-command", inputs.build_command, "--out", join(site, "rendered-impact.json")]);
  }

  const gh = `https://github.com/${ownerRepo}`;
  const runUrl = o.runUrl ?? `${gh}/commit/${sha}`;
  run(repo, "bun", [
    "run", join(platform, "cat-harness/scripts/staging-banner.ts"),
    "--site", site, "--branch", branch, "--sha", sha.slice(0, 7),
    "--built", `${new Date().toISOString().replace(/\.\d+Z$/, "Z")} (built locally by an agent)`,
    "--pr", "n/a", "--pr-url", `${gh}/pulls?q=head%3A${encodeURIComponent(branch)}`,
    "--branch-url", `${gh}/tree/${branch}`, "--issues-url", `${gh}/issues`,
    "--run-url", runUrl, "--main-site", pagesRoot, "--before-ref", base,
  ]);

  if (o.artifact) {
    const out = resolve(o.artifact);
    const b = artifactBundle(listSite(site));
    rmSync(out, { recursive: true, force: true });
    for (const p of [b.page, ...b.files]) {
      mkdirSync(dirname(join(out, p)), { recursive: true });
      cpSync(join(site, p), join(out, p));
    }
    writeFileSync(join(out, "artifact.json"), JSON.stringify({ $schema: "stage-local-artifact/v1", slug, branch, sha, ...b }, null, 1) + "\n");
    for (const d of b.dropped) log(`· left out ${d.dir}/ (${d.files} files) to fit one Artifact publish; links into it 404 there`);
    log(`✓ Artifact bundle in ${out}: index.html + ${b.files.length} files, ${(b.bytes / 1048576).toFixed(1)} MB; nothing pushed`);
    return { slug, url, pushed: false, site, bundle: { ...b, dir: out } };
  }

  if (o.dryRun) {
    log(`✓ built and bannered in ${site}; --dry-run, nothing pushed`);
    return { slug, url, pushed: false, site };
  }

  const pages = mkdtempSync(join(tmpdir(), "stage-local-"));
  try {
    git(repo, ["fetch", "-q", "--depth=1", "origin", inputs.publish_branch]);
    git(repo, ["worktree", "add", "-q", "--detach", pages, "FETCH_HEAD"]);
    const queuedMs = Date.now();
    for (let lost = 0, failed = 0; ; ) {
      git(pages, ["fetch", "-q", "--depth=1", "origin", inputs.publish_branch]);
      git(pages, ["reset", "-q", "--hard", "FETCH_HEAD"]);
      const tip = readTip(pages);
      if (!tip) throw new Error("could not read the publish branch tip — refusing to call the window open");
      const d = decide(tip, Date.now(), queuedMs);
      if (d.expired) throw new Error("waited past the gate's deadline: the publish branch is being pushed continuously; not deployed");
      if (!d.open) {
        const ms = Math.max(d.openAtMs - Date.now(), 0) + 5_000;
        log(`· gate closed — ${d.reason}; waiting ${Math.round(ms / 1000)}s`);
        await new Promise((r) => setTimeout(r, ms));
        continue;
      }
      const before = git(pages, ["rev-parse", "HEAD"]);
      const dest = join(pages, "STAGING", slug);
      rmSync(dest, { recursive: true, force: true });
      cpSync(site, dest, { recursive: true });
      const prose = JSON.stringify({ summary: "folio staging preview published (built locally by an agent)" });
      execFileSync("bun", ["run", join(platform, "cat-harness/scripts/render-log.ts"), "--dir", pages, "--event", "rendered", "--kind", "staging-preview", "--path", `STAGING/${slug}`, "--slug", slug, "--branch", branch, "--commit", sha, "--run", runUrl], { input: prose, stdio: ["pipe", "inherit", "inherit"] });
      git(pages, ["add", "-A", `STAGING/${slug}`, "_render-log"]);
      if (git(pages, ["status", "--porcelain"]) === "") {
        log("· the preview is unchanged; nothing to push");
        return { slug, url, pushed: false, site };
      }
      git(pages, ["commit", "-q", "-m", `staging(${slug}): from ${sha}`, "-m", `render-log: rendered STAGING/${slug}`, "-m", `built locally: ${runUrl}`]);
      const r = spawnSync("git", ["-C", pages, "push", "-q", "origin", `HEAD:${inputs.publish_branch}`], { stdio: "inherit" });
      if (r.status === 0) {
        const commit = git(pages, ["rev-parse", "HEAD"]);
        log(`✓ pushed ${commit.slice(0, 7)} to ${inputs.publish_branch}; live at ${url} once GitHub's Pages deploy has run`);
        return { slug, url, pushed: true, commit, site };
      }
      // A rejection with the tip MOVED is a lost race: the gate now holds this
      // push for that one's window. With the tip UNMOVED it is our failure.
      git(pages, ["fetch", "-q", "--depth=1", "origin", inputs.publish_branch]);
      if (git(pages, ["rev-parse", "FETCH_HEAD"]) !== before) {
        if (++lost > 20) throw new Error("lost the race to the publish branch 20 times; not deployed");
      } else if (++failed >= 3) throw new Error("push rejected 3 times with the tip unmoved; not deployed");
    }
  } finally {
    spawnSync("git", ["-C", repo, "worktree", "remove", "--force", pages]);
  }
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const opt = (k: string) => {
    const i = argv.indexOf(`--${k}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  try {
    const r = await stageLocal({
      repo: opt("repo") ?? process.cwd(),
      ...(opt("branch") ? { branch: opt("branch")! } : {}),
      ...(opt("base") ? { base: opt("base")! } : {}),
      ...(opt("run-url") ? { runUrl: opt("run-url")! } : {}),
      dryRun: argv.includes("--dry-run"),
      ...(opt("artifact") ? { artifact: opt("artifact")! } : {}),
    });
    console.log(JSON.stringify(r));
  } catch (e) {
    console.error(`✗ stage-local (${basename(process.argv[1] ?? "")}): ${(e as Error).message}`);
    process.exit(1);
  }
}
