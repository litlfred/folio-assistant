#!/usr/bin/env bun
/**
 * iri-sync.ts — keep every literal copy of an instance's release IRIs at the
 * version its declaration states.
 *
 * ## Why a sync, when everything else is derived
 *
 * `release-iri.ts` derives an instance's addresses from `iriBase` and
 * `version`, and every generator and template asks it rather than spelling
 * one out. Some copies cannot ask: an `xmlns` attribute in a BPMN file, a
 * value in a code list, a fixture string in a test. Those are literal by
 * nature. This keeps them at the declared version, so bumping a version — or
 * moving the address, in a fork — is ONE edit to the declaration and one run.
 *
 * ## The rewrites
 *
 * For each instance declaring `iriBase` (see `releaseIris`):
 *
 * - `<iriBase><other semver>/` → `<iriBase><version>/` — agent-facing
 * - `<iriBase>v<other major>/` → `<iriBase>v<major>/` — person-facing
 * - with `--from <old base>` (a one-time move): `<old base><path>` →
 *   `<iriBase><version>/<path>`. Only for a move; `--check` never needs it.
 *
 * `beans/` is left alone: a bean records what was true when it was written,
 * and rewriting history to today's address would make it say something it
 * never said.
 *
 * ```sh
 * bun run iri:sync                     # rewrite stale copies
 * bun run iri:sync:check               # fail on any (CI, gates)
 * bun run iri:sync -- --from https://old.example/base/   # move the base
 * ```
 *
 * @module scripts/iri-sync
 * @covers cat-harness
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import { gitCorpus } from "../schemas/git-corpus.ts";
import { type ReleaseIris, releaseIris } from "../schemas/release-iri.ts";

/** Text a person or program reads; binaries and lockfiles are never IRI carriers here. */
const TEXT = /\.(bpmn|dmn|json|jsonld|ts|md|xml|svg|liquid|html|ya?ml|pot|po|ttl|txt)$/;
/** Paths never rewritten, with the reason in the module header. */
const SKIP = [/^beans\//, /(^|\/)node_modules\//];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One file's text rewritten to `r`, and how many copies changed. */
export function rewrite(text: string, r: ReleaseIris, from?: string): { text: string; changes: number } {
  let changes = 0;
  const base = esc(r.iriBase);
  let out = text.replace(new RegExp(`${base}(\\d+\\.\\d+\\.\\d+)/`, "g"), (m, v: string) => {
    if (v === r.version) return m;
    changes++;
    return r.agent;
  });
  out = out.replace(new RegExp(`${base}v(\\d+)/`, "g"), (m, v: string) => {
    if (Number(v) === r.major) return m;
    changes++;
    return r.human;
  });
  if (from) {
    const old = from.endsWith("/") ? from : `${from}/`;
    // Only an old address followed by a path: the bare base, a page to read,
    // is not an identifier, and where it should now point is a person's call.
    out = out.replace(new RegExp(`${esc(old)}(?=[A-Za-z0-9_])`, "g"), () => {
      changes++;
      return r.agent;
    });
  }
  return { text: out, changes };
}

/** Every instance that declares an `iriBase`, with its release. */
export function releases(repoRoot: string): { root: string; release: ReleaseIris }[] {
  const out: { root: string; release: ReleaseIris }[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    const r = releaseIris(readDeclaration(root));
    if (r) out.push({ root, release: r });
  }
  return out;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const fromAt = args.indexOf("--from");
  const from = fromAt >= 0 ? args[fromAt + 1] : undefined;
  const repo = repoRootFor(join(import.meta.dir, ".."));
  const rels = releases(repo);
  if (rels.length === 0) {
    console.log("No instance declares an iriBase; nothing to keep in step.");
    process.exit(0);
  }
  if (from && rels.length !== 1) {
    console.error(`--from moves ONE instance's base, and ${rels.length} declare one. Name it by editing only that declaration first.`);
    process.exit(2);
  }
  const files = gitCorpus(repo);
  if (!files) {
    console.error("git could not list the corpus, so nothing was checked — that is not a pass.");
    process.exit(2);
  }
  const stale: string[] = [];
  let total = 0;
  for (const abs of files) {
    const rel = relative(repo, abs);
    if (!TEXT.test(rel) || SKIP.some((re) => re.test(rel))) continue;
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isFile() || st.size > 8_000_000) continue;
    const before = readFileSync(abs, "utf-8");
    let text = before;
    let n = 0;
    for (const { release } of rels) {
      const r = rewrite(text, release, from);
      text = r.text;
      n += r.changes;
    }
    if (n === 0) continue;
    total += n;
    stale.push(`${rel} (${n})`);
    if (!check) writeFileSync(abs, text);
  }
  for (const { root, release } of rels) {
    console.log(`${relative(repo, root) || "."}: agent ${release.agent}  ·  person ${release.human}`);
  }
  if (stale.length === 0) {
    console.log("✓ every literal release IRI is at its declared version.");
    process.exit(0);
  }
  console.log(`${check ? "✗ stale" : "rewrote"}: ${total} IRI(s) in ${stale.length} file(s)`);
  for (const s of stale.sort()) console.log(`  · ${s}`);
  if (check) {
    console.log("Run `bun run iri:sync` and commit.");
    process.exit(1);
  }
}
