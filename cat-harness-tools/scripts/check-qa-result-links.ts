#!/usr/bin/env bun
/**
 * check-qa-result-links — no link to a QA result points where the result is
 * not. Bean `bejf`, issue #2217 (arc #1763).
 *
 * ## The defect it exists for
 *
 * Every QA panel on the site linked its result files as
 * `https://github.com/<repo>/blob/main/` + a path relative to the INSTANCE.
 * The owner found one on `/fr/` (`…/blob/main/test/results/translation-qa/…`,
 * a 404). The same renderer drew every panel in every family, so it was every
 * link. It was wrong twice: the path lacked `cat-harness/`, and a derived
 * result's record is the `qa-reports` branch, keyed by commit, not `main`.
 * The address now comes from ONE place, `cat-harness/scripts/qa-result-link.ts`.
 * This gate keeps a second one from appearing.
 *
 * ## What it judges
 *
 * **Sources** (the default). Every tracked renderer and generator file, and
 * every committed page, is scanned for a forge URL of the form
 * `blob/main/<path>`. A finding is either of two cases:
 *
 * - `<path>` lies inside a `qa` directory that declares `storage`. Its record
 *   is the branch, so a `main` address is wrong BY DECLARATION. This is asked
 *   of `resolveQaLocation`, never of a hand-written list, so a directory moves
 *   when its declaration does, and one that does not declare storage keeps its
 *   `blob/main` links legitimately.
 * - `<path>` has a `test/results/` segment that no declared `qa` directory
 *   holds. That is the instance-relative defect: a path that is not in the
 *   repository at all.
 *
 * **`--site <dir>`**, run after a site build. The same scan runs over the
 * built HTML, JS and JSON. On top of it, every published witness projection
 * (`assets/qa/**`, `$schema: qa-witness/v1`) that names sidecars must carry
 * `sidecarLinks`, because without them the panel shows no link. None of those
 * links may address a stored result on `main`.
 *
 * ## Four states
 *
 * `ok` 0, `finding` 1, `unknown` 2 (the declarations would not resolve, or
 * `--site` found no projection to judge), `error` 2. **An empty site is
 * UNKNOWN, never clean**: a build that published no witnesses has not shown
 * that its links are right. One exception: when the site's own
 * `assets/qa/availability.json` says `unavailable`, the empty set is
 * determined and already stated, and `qa-site-assets` keeps that from failing
 * a deploy. This gate does the same.
 *
 * Usage:
 *   bun run check:qa-result-links                 # sources
 *   bun run check:qa-result-links -- --site _site # a built site, sources too
 *
 * @module scripts/check-qa-result-links
 * @covers qa
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { resolveQaLocation } from "../../cat-harness/scripts/qa-store.ts";

export interface QaDirDecl {
  /** Repo-relative, no trailing slash. */
  path: string;
  stored: boolean;
}

export interface LinkFinding {
  file: string;
  line?: number;
  url: string;
  why: string;
}

/** `…/blob/main/<path>` — the path stops at a quote, whitespace, `)`, `#`, `?` or `<`. */
const BLOB_MAIN = /\/blob\/main\/([^\s"'`)<>#?\\]+)/g;

/**
 * Judge one `blob/main` path against the declarations, or `undefined` when
 * it is fine. Pure, and the whole rule: a test pins it over plain inputs.
 */
export function judgeBlobMainPath(path: string, dirs: readonly QaDirDecl[]): string | undefined {
  const p = decodeURI(path).replace(/^\/+/, "");
  const owner = dirs.find((d) => p === d.path || p.startsWith(`${d.path}/`));
  if (owner?.stored) {
    return `inside \`${owner.path}\`, which declares storage: the record is the qa-reports branch, so address it through qa-result-link.ts`;
  }
  if (!owner && /(^|\/)test\/results\//.test(p)) {
    return "a `test/results/` path no declared qa directory holds (the instance-relative defect: the instance prefix is missing)";
  }
  return undefined;
}

/** Every `blob/main/…` URL in a text, with its 1-based line. */
export function scanText(text: string, dirs: readonly QaDirDecl[], file: string): LinkFinding[] {
  const out: LinkFinding[] = [];
  const lines = text.split("\n");
  for (const [i, line] of lines.entries()) {
    if (!line.includes("/blob/main/")) continue;
    for (const m of line.matchAll(BLOB_MAIN)) {
      const why = judgeBlobMainPath(m[1]!, dirs);
      if (why) out.push({ file, line: i + 1, url: m[0], why });
    }
  }
  return out;
}

/**
 * Judge one parsed witness projection. Returns findings, and whether it was a
 * projection at all (so the caller can tell "judged none" from "none clean").
 */
export function judgeProjection(doc: unknown, dirs: readonly QaDirDecl[], file: string): { projection: boolean; findings: LinkFinding[] } {
  const d = doc as { $schema?: unknown; sidecars?: unknown; sidecarLinks?: unknown };
  if (!d || typeof d !== "object" || d.$schema !== "qa-witness/v1") return { projection: false, findings: [] };
  const sidecars = Array.isArray(d.sidecars) ? (d.sidecars as string[]) : [];
  const findings: LinkFinding[] = [];
  if (sidecars.length > 0 && !Array.isArray(d.sidecarLinks)) {
    findings.push({ file, url: "(none)", why: "a projection naming sidecars carries no `sidecarLinks`, so the panel cannot link them (generate it with gen-docs-pages.ts)" });
  }
  for (const l of (Array.isArray(d.sidecarLinks) ? d.sidecarLinks : []) as Array<{ path?: string; href?: string; addressedBy?: string }>) {
    const owner = dirs.find((x) => l.path === x.path || (l.path ?? "").startsWith(`${x.path}/`));
    if (owner?.stored && l.addressedBy === "main") {
      findings.push({ file, url: l.href ?? "(no href)", why: `\`${l.path}\` is stored on the qa-reports branch but is addressed on main` });
    }
    if (l.href) {
      for (const m of l.href.matchAll(BLOB_MAIN)) {
        const why = judgeBlobMainPath(m[1]!, dirs);
        if (why) findings.push({ file, url: l.href, why });
      }
    }
  }
  return { projection: true, findings };
}

/** Tracked files a renderer, generator or committed page lives in. */
const SOURCE_EXT = /\.(ts|tsx|js|mjs|cjs|html|liquid|ya?ml)$/;
/** Prose and fixtures quote the defect; they do not render it. Nor does this gate's own docblock. */
const SOURCE_SKIP = [/\.test\.ts$/, /\.e2e\.ts$/, /(^|\/)tests?\//, /(^|\/)docs\/proposals\//, /(^|\/)beans\//, /check-qa-result-links\.ts$/];

function trackedFiles(repoRoot: string): string[] {
  const r = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf-8", maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr}`);
  return r.stdout.split("\0").filter(Boolean);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

export function declaredDirs(repoRoot: string): QaDirDecl[] {
  return resolveQaLocation(repoRoot).directories.map((d) => ({ path: d.path, stored: d.storage !== undefined }));
}

export function checkSources(repoRoot: string, dirs: readonly QaDirDecl[]): { files: number; findings: LinkFinding[] } {
  const findings: LinkFinding[] = [];
  let files = 0;
  for (const f of trackedFiles(repoRoot)) {
    if (!SOURCE_EXT.test(f) || SOURCE_SKIP.some((r) => r.test(f))) continue;
    const abs = join(repoRoot, f);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    files++;
    const text = readFileSync(abs, "utf-8");
    if (text.includes("/blob/main/")) findings.push(...scanText(text, dirs, f));
  }
  return { files, findings };
}

export function checkSite(site: string, dirs: readonly QaDirDecl[]): { files: number; projections: number; findings: LinkFinding[] } {
  const findings: LinkFinding[] = [];
  let files = 0;
  let projections = 0;
  for (const abs of walk(site)) {
    if (!/\.(html|js|json)$/.test(abs)) continue;
    files++;
    const rel = relative(site, abs);
    const text = readFileSync(abs, "utf-8");
    if (text.includes("/blob/main/")) findings.push(...scanText(text, dirs, rel));
    if (abs.endsWith(".json") && text.includes("qa-witness/v1")) {
      try {
        const j = judgeProjection(JSON.parse(text), dirs, rel);
        if (j.projection) projections++;
        findings.push(...j.findings);
      } catch {
        findings.push({ file: rel, url: "(unparseable)", why: "a published witness projection does not parse" });
      }
    }
  }
  return { files, projections, findings };
}

/** `source` from the site's `assets/qa/availability.json`, or `undefined` when absent or unreadable. */
export function siteAvailability(site: string): string | undefined {
  try {
    const j = JSON.parse(readFileSync(join(site, "assets", "qa", "availability.json"), "utf-8")) as { source?: unknown };
    return typeof j.source === "string" ? j.source : undefined;
  } catch {
    return undefined;
  }
}

function main(argv: string[]): number {
  const i = argv.indexOf("--site");
  const site = i >= 0 ? argv[i + 1] : undefined;
  if (i >= 0 && !site) {
    console.error("check:qa-result-links: --site needs a directory");
    return 2;
  }
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf-8" });
  if (r.status !== 0) {
    console.error("check:qa-result-links: not inside a git checkout — could not determine. NOT a pass.");
    return 2;
  }
  const repoRoot = r.stdout.trim();
  let dirs: QaDirDecl[];
  try {
    dirs = declaredDirs(repoRoot);
  } catch (e) {
    console.error(`check:qa-result-links: the qa declarations would not resolve (${(e as Error).message}) — UNKNOWN, not a pass.`);
    return 2;
  }
  const stored = dirs.filter((d) => d.stored).length;
  const src = checkSources(repoRoot, dirs);
  const findings = [...src.findings];
  console.log(`check:qa-result-links: ${dirs.length} qa director${dirs.length === 1 ? "y" : "ies"} declared, ${stored} stored; ${src.files} source file(s) scanned`);

  let unknown = false;
  if (site) {
    const abs = resolve(site);
    if (!existsSync(abs)) {
      console.error(`check:qa-result-links: no site at ${site} — UNKNOWN, not a pass.`);
      return 2;
    }
    const s = checkSite(abs, dirs);
    findings.push(...s.findings);
    console.log(`  site ${site}: ${s.files} file(s), ${s.projections} witness projection(s)`);
    if (s.projections === 0) {
      // A build whose evidence was UNAVAILABLE has already said so three ways
      // (qa-site-assets), and must not fail the deploy for it. That empty is
      // determined and stated, not one nobody looked at. Any other empty is
      // unknown.
      const av = siteAvailability(abs);
      if (av === "unavailable") {
        console.log("  no witness projection: this build's QA evidence was unavailable (assets/qa/availability.json), so there is no panel link to judge.");
      } else {
        console.error(`  no witness projection was published (availability: ${av ?? "not recorded"}), so no panel link was judged — UNKNOWN, not clean.`);
        unknown = true;
      }
    }
  }

  for (const f of findings) console.error(`  ✗ ${f.file}${f.line ? `:${f.line}` : ""}  ${f.url}\n      ${f.why}`);
  if (findings.length) {
    console.error(`check:qa-result-links: ${findings.length} link(s) point where the result is not.`);
    return 1;
  }
  if (unknown) return 2;
  console.log("check:qa-result-links: ok — no link addresses a stored QA result on main.");
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
