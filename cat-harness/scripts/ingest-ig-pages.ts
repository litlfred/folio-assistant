#!/usr/bin/env bun
/**
 * ingest-ig-pages.ts — copy a FHIR IG's narrative pages out of its source.
 *
 * Sibling of `ingest-ig-menu.ts`: that one reads the IG's navigation from
 * `sushi-config.yaml`, this one reads the pages that navigation points at —
 * `input/pagecontent/*.md` — and the `pages:` tree that titles them.
 *
 * ```sh
 * bun run cat-harness/scripts/ingest-ig-pages.ts \
 *   --source /path/to/smart-trust --out smart-trust/ig-pages
 * bun run cat-harness/scripts/ingest-ig-pages.ts --source … --out … --check
 * ```
 *
 * Writes `<out>/pages.json` (schema `folio-ig-pages/v1`) and `<out>/pages/*.md`,
 * the latter VERBATIM. Rendering — resolving the IG's Liquid — is the
 * consumer's job; see `smart-trust/scripts/narrative-pages.ts`.
 *
 * ## `--check` without `--source` is the third state
 *
 * Same line `ingest-ig-menu.ts` draws: with no upstream checkout there is
 * nothing to compare against, so it says it could not determine and exits
 * **2**, never 0.
 *
 * @module scripts/ingest-ig-pages
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { parse as parseYaml } from "yaml";

import { IG_PAGES_SCHEMA_TAG, IgPagesSchema, flattenPageTree, type IgPages } from "../schemas/ig-pages.js";

const MANIFEST = "pages.json";
const PAGES_DIR = "pages";
const SOURCE_DIR = join("input", "pagecontent");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1]!.startsWith("--") ? process.argv[i + 1] : undefined;
}

function git(repo: string, ...args: string[]): string {
  const r = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed in ${repo}: ${r.stderr.trim()}`);
  return r.stdout.trim();
}

/** The repository's `origin` as an https URL, which is what `source.of` records. */
function originUrl(repo: string): string {
  const url = git(repo, "remote", "get-url", "origin").replace(/\.git$/, "");
  const ssh = /^git@github\.com:(.+)$/.exec(url);
  return ssh ? `https://github.com/${ssh[1]}` : url;
}

/** Build the manifest and the file map from a checkout. Pure apart from reads. */
export function readIgPages(repo: string, readAt: string): { manifest: IgPages; files: Map<string, string> } {
  const config = parseYaml(readFileSync(join(repo, "sushi-config.yaml"), "utf8")) as Record<string, unknown>;
  const tree = (config.pages ?? {}) as Record<string, unknown>;
  const dir = join(repo, SOURCE_DIR);
  const onDisk = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  const flat = flattenPageTree(tree);
  const listed = new Map(flat.map((n) => [n.key, n]));
  const pages: IgPages["pages"] = [];
  for (const n of flat) {
    if (!onDisk.includes(n.key)) continue;
    pages.push({ file: n.key, title: n.title, parent: n.parent, order: n.order, listed: true });
  }
  let extra = 0;
  for (const f of onDisk) {
    if (!listed.has(f)) pages.push({ file: f, order: extra++, listed: false });
  }

  const files = new Map(onDisk.map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  const manifest = IgPagesSchema.parse({
    $schema: IG_PAGES_SCHEMA_TAG,
    id: String(config.id),
    canonical: String(config.canonical),
    license: typeof config.license === "string" ? config.license : undefined,
    source: { kind: "ig-source", of: originUrl(repo), ref: git(repo, "rev-parse", "HEAD"), path: SOURCE_DIR, readAt },
    pages,
    notInSource: flat.map((n) => n.key).filter((k) => !onDisk.includes(k)),
  });
  return { manifest, files };
}

if (import.meta.main) {
  const source = arg("source");
  const out = arg("out");
  const check = process.argv.includes("--check");
  if (!out) {
    console.error("usage: ingest-ig-pages.ts --source <ig-repo> --out <dir> [--check]");
    process.exit(64);
  }
  const outDir = resolve(out);
  if (!source) {
    if (check) {
      console.error("could not determine: --check needs --source <ig-repo> to compare against. This is NOT a pass.");
      process.exit(2);
    }
    console.error("--source <ig-repo> is required");
    process.exit(64);
  }

  // `readAt` is carried over from the committed manifest when the pin has not
  // moved, so a re-run at the same commit is byte-identical rather than a diff
  // that says only "the date changed".
  const prior = existsSync(join(outDir, MANIFEST))
    ? IgPagesSchema.safeParse(JSON.parse(readFileSync(join(outDir, MANIFEST), "utf8")))
    : undefined;
  const head = git(resolve(source), "rev-parse", "HEAD");
  const readAt = prior?.success && prior.data.source.ref === head ? prior.data.source.readAt : new Date().toISOString().slice(0, 10);
  const { manifest, files } = readIgPages(resolve(source), readAt);
  const json = `${JSON.stringify(manifest, null, 2)}\n`;

  if (check) {
    const stale: string[] = [];
    if (!existsSync(join(outDir, MANIFEST)) || readFileSync(join(outDir, MANIFEST), "utf8") !== json) stale.push(MANIFEST);
    const committedDir = join(outDir, PAGES_DIR);
    const committed = existsSync(committedDir) ? readdirSync(committedDir) : [];
    for (const [f, text] of files) {
      const p = join(committedDir, f);
      if (!existsSync(p) || readFileSync(p, "utf8") !== text) stale.push(join(PAGES_DIR, f));
    }
    for (const f of committed) if (!files.has(f)) stale.push(`${join(PAGES_DIR, f)} (orphan)`);
    if (stale.length) {
      console.error(`✗ ${stale.length} file(s) differ from ${manifest.source.of} @ ${head.slice(0, 8)}:`);
      for (const s of stale.slice(0, 10)) console.error(`    ${s}`);
      process.exit(1);
    }
    console.log(`✓ ${files.size} page source(s) match ${manifest.source.of} @ ${head.slice(0, 8)}`);
  } else {
    mkdirSync(outDir, { recursive: true });
    rmSync(join(outDir, PAGES_DIR), { recursive: true, force: true });
    mkdirSync(join(outDir, PAGES_DIR), { recursive: true });
    for (const [f, text] of files) writeFileSync(join(outDir, PAGES_DIR, f), text);
    writeFileSync(join(outDir, MANIFEST), json);
    const listed = manifest.pages.filter((p) => p.listed).length;
    console.log(`${outDir}: ${files.size} page source(s) from ${manifest.source.of} @ ${head.slice(0, 8)}`);
    console.log(`  ${listed} in the pages: tree, ${files.size - listed} unlisted (fragments or orphans)`);
    if (manifest.notInSource.length) console.log(`  named by the tree but generated by the Publisher: ${manifest.notInSource.join(", ")}`);
  }
}
