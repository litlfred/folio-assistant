#!/usr/bin/env bun
/**
 * Formal dependency-graph ingest — populates
 * `docs/audits/lean-atlas-deps.json`, the cache
 * `content/pipeline/content-graph.ts` reads to build **formal** edges.
 *
 * The formal relation answers "what does this proof actually invoke?"
 * It is machine-derived and never hand-written. It is NOT `uses[]`,
 * which is the editorial relation (see `BlockBase.uses`).
 *
 * ## Two sources, different confidence
 *
 * - **`atlas`** — [Lean Atlas](https://github.com/NyxFoundation/lean-atlas)
 *   (arXiv 2604.16347, MIT). Elaborates the project and emits real
 *   constant dependencies, classified into **type** edges (the
 *   declaration's signature mentions the target) and **value** edges
 *   (only the proof term does). Authoritative. Fed in via `--ingest`.
 *
 *   Atlas is a **Lake require in the content repo**, not a standalone
 *   binary. In that repo's `lakefile.toml`:
 *
 *     [[require]]
 *     name  = "lean-atlas"
 *     scope = "NyxFoundation"
 *     git   = "https://github.com/NyxFoundation/lean-atlas"
 *     rev   = "main"          # pin a commit for reproducibility
 *
 *   then `lake update lean-atlas` (needs github.com egress) and
 *   `lake exe atlas graph-data --output graph.json --pretty`.
 *   Requires Lean >= 4.17.0.
 *
 *   NOTE: `graph-data`'s JSON schema has not been verified against a
 *   live Atlas run here (no Lean toolchain in this environment), so
 *   `--ingest` deliberately takes folio's own JSONL shape and a small
 *   adapter converts Atlas output to it. Confirm the field names
 *   against a real export before writing that adapter — do not assume
 *   they match the names used below.
 *
 * - **`scan`** — this script's fallback (`--scan`). Indexes every
 *   block's `lean.ref` declaration by name, then scans each sibling
 *   `.lean` for occurrences of the others. **Approximate**: it sees
 *   syntactic mentions, not elaboration, so it misses dependencies
 *   introduced through `simp` sets, typeclass instances, and
 *   definitional unfolding, and can over-report a name used
 *   coincidentally. Exists because Atlas needs a Lean toolchain and a
 *   version-compatible Lake build that most folios will not have.
 *
 * Every entry records which source produced it. Consumers that need
 * the trustworthy type/value split — notably staleness propagation —
 * must require `source: "atlas"` and treat `scan` as unavailable.
 *
 * ## Usage
 *
 *   bun run content/pipeline/lean-atlas-ingest.ts --list
 *   bun run content/pipeline/lean-atlas-ingest.ts --ingest <deps.jsonl>
 *   bun run content/pipeline/lean-atlas-ingest.ts --scan [content-root]
 *   bun run content/pipeline/lean-atlas-ingest.ts --stale
 *
 * `--ingest` JSONL, one declaration per line:
 *   { "decl": "QOU.Foo.bar", "type_deps": [...], "value_deps": [...] }
 *
 * @module content/pipeline/lean-atlas-ingest
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, extname, resolve, sep } from "path";
import { hashFile, walkBlocks } from "./qa-utils";
import { findContentRepoRoot } from "./repo-root";
import { parseLeanRef, refToDecl } from "./content-graph";

const OUTPUT_REL = "docs/audits/lean-atlas-deps.json";

/** Provenance of a cache entry. See the module doc for confidence. */
export type DepSource = "atlas" | "scan";

interface DeclEntry {
  /** Statement-level dependencies (fully-qualified decl names). */
  type_deps: string[];
  /** Proof-level dependencies. */
  value_deps: string[];
  /** 12-char SHA of the owning `.lean` at extraction time. */
  lean_sha?: string;
  /** Repo-relative path of the `.lean` the decl was extracted from. */
  lean_path?: string;
  source: DepSource;
  checked_at: string;
}

interface DepsCache {
  $schema: "lean-atlas-deps/v1";
  generated_at: string;
  /** `mixed` when entries from both sources coexist. */
  source: DepSource | "mixed";
  decls: Record<string, DeclEntry>;
}

const EMPTY: DepsCache = {
  $schema: "lean-atlas-deps/v1",
  generated_at: "",
  source: "scan",
  decls: {},
};

function outputPath(repoRoot: string): string {
  return join(repoRoot, OUTPUT_REL);
}

function loadCache(repoRoot: string): DepsCache {
  const p = outputPath(repoRoot);
  if (!existsSync(p)) return { ...EMPTY, decls: {} };
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return { ...EMPTY, decls: {} };
  }
}

function saveCache(repoRoot: string, cache: DepsCache): void {
  const p = outputPath(repoRoot);
  mkdirSync(dirname(p), { recursive: true });
  const sources = new Set(Object.values(cache.decls).map((d) => d.source));
  cache.source =
    sources.size > 1 ? "mixed" : ((sources.values().next().value ?? "scan") as DepSource);
  cache.generated_at = new Date().toISOString();
  cache.$schema = "lean-atlas-deps/v1";
  writeFileSync(p, JSON.stringify(cache, null, 2) + "\n");
}

/**
 * Hash a `.lean` path with the sidecar SHA convention.
 *
 * Containment + extension guard, mirroring `lean-compile-audit.ts`:
 * `--ingest` keys come from JSONL input, so a crafted path must not be
 * able to read outside the repo. A rejected path returns `undefined`,
 * which downstream treats as "no SHA → stale" (fail-safe).
 */
function leanSha(repoRoot: string, p: string): string | undefined {
  const abs = resolve(repoRoot, p);
  if (abs !== repoRoot && !abs.startsWith(repoRoot + sep)) return undefined;
  if (extname(abs) !== ".lean") return undefined;
  return hashFile(abs);
}

// ── Lean source lexing (comment-stripped) ───────────────────────

/**
 * Strip Lean comments: `--` to end of line, and nestable `/- … -/`.
 *
 * Replaces comment bodies with equal-length whitespace so byte offsets
 * are preserved — the declaration splitter below indexes into the
 * result and must stay aligned with the original source.
 *
 * Doc comments (`/-- … -/`) are comments too: a decl name mentioned
 * only in prose is not a dependency. Skipping this step is how a
 * scanner invents edges out of documentation.
 */
export function stripLeanComments(src: string): string {
  const out = src.split("");
  let i = 0;
  let depth = 0;
  while (i < src.length) {
    if (depth === 0 && src[i] === "-" && src[i + 1] === "-") {
      while (i < src.length && src[i] !== "\n") out[i++] = " ";
      continue;
    }
    if (src[i] === "/" && src[i + 1] === "-") {
      depth++;
      out[i++] = " ";
      out[i++] = " ";
      continue;
    }
    if (depth > 0 && src[i] === "-" && src[i + 1] === "/") {
      depth--;
      out[i++] = " ";
      out[i++] = " ";
      continue;
    }
    if (depth > 0) out[i] = " ";
    i++;
  }
  return out.join("");
}

const DECL_RE =
  /^\s*(?:@\[[^\]]*\]\s*)?(?:private\s+|protected\s+|noncomputable\s+|partial\s+)*(theorem|lemma|def|abbrev|structure|inductive|instance|class|example)\s+([A-Za-z_][A-Za-z0-9_'.!?]*)/gm;

interface DeclSpan {
  name: string;
  /** Signature text (before `:=` / `where`). */
  signature: string;
  /** Body text (after `:=` / `where`), empty when there is none. */
  body: string;
}

/**
 * Split comment-stripped Lean source into per-declaration spans, each
 * separated into signature and body at the first top-level `:=` or
 * `where`.
 *
 * This is what lets scan mode emit a type/value split at all. It is a
 * lexical approximation — no elaboration, no scope tracking — hence
 * `source: "scan"` on everything it produces.
 */
export function splitDeclarations(stripped: string): DeclSpan[] {
  const starts: Array<{ name: string; at: number }> = [];
  for (const m of stripped.matchAll(DECL_RE)) {
    starts.push({ name: m[2], at: m.index ?? 0 });
  }
  const spans: DeclSpan[] = [];
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i].at;
    const to = i + 1 < starts.length ? starts[i + 1].at : stripped.length;
    const text = stripped.slice(from, to);
    const cut = text.search(/:=|\bwhere\b/);
    spans.push({
      name: starts[i].name,
      signature: cut === -1 ? text : text.slice(0, cut),
      body: cut === -1 ? "" : text.slice(cut),
    });
  }
  return spans;
}

/**
 * Shortest decl-name suffix long enough to match on.
 *
 * Sibling `.lean` files refer to each other by short local names, so
 * matching happens on the final component of a `lean.ref` decl path.
 * Very short components (`mul`, `one`, `map`) collide with Mathlib
 * names constantly, so they are excluded rather than allowed to
 * manufacture edges.
 */
const MIN_NAME_LEN = 4;

// ── Modes ───────────────────────────────────────────────────────

function listMode(repoRoot: string, root: string): void {
  let n = 0;
  for (const b of walkBlocks(root)) {
    if (!b.lean) continue;
    console.log(b.lean.startsWith(repoRoot) ? b.lean.slice(repoRoot.length + 1) : b.lean);
    n++;
  }
  console.log(`\n${n} blocks with a resolvable .lean`);
}

function ingestMode(repoRoot: string, jsonlPath: string): void {
  const cache = loadCache(repoRoot);
  const lines = readFileSync(jsonlPath, "utf-8").trim().split("\n");
  let n = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line) as {
      decl: string;
      type_deps?: string[];
      value_deps?: string[];
      lean_path?: string;
    };
    if (!rec.decl) continue;
    cache.decls[rec.decl] = {
      type_deps: rec.type_deps ?? [],
      value_deps: rec.value_deps ?? [],
      lean_path: rec.lean_path,
      lean_sha: rec.lean_path ? leanSha(repoRoot, rec.lean_path) : undefined,
      source: "atlas",
      checked_at: new Date().toISOString(),
    };
    n++;
  }
  saveCache(repoRoot, cache);
  console.log(`Ingested ${n} declarations from ${jsonlPath} (source: atlas)`);
  console.log(`Wrote ${outputPath(repoRoot)} — ${Object.keys(cache.decls).length} decls tracked`);
}

/**
 * Fallback extractor. Builds a name → decl index from every block's
 * `lean.ref`, then scans each sibling `.lean` for the others.
 *
 * Deliberately conservative: comments are stripped first, matches are
 * whole-identifier only, and short names are skipped. It will still
 * both over- and under-report relative to Atlas — that is what
 * `source: "scan"` records.
 */
function scanMode(repoRoot: string, root: string): void {
  // Index: short name -> full decl path, for every block-owned decl.
  const nameToDecl = new Map<string, string>();
  const blocks: Array<{ decl: string; lean: string }> = [];
  for (const b of walkBlocks(root)) {
    if (!b.lean) continue;
    const ref = parseLeanRef(readFileSync(b.ts, "utf-8"));
    const decl = refToDecl(ref);
    if (!decl) continue;
    blocks.push({ decl, lean: b.lean });
    const short = decl.split(".").pop()!;
    if (short.length >= MIN_NAME_LEN && !nameToDecl.has(short)) {
      nameToDecl.set(short, decl);
    }
  }

  const cache = loadCache(repoRoot);
  const now = new Date().toISOString();
  let edges = 0;

  for (const { decl, lean } of blocks) {
    let src: string;
    try {
      src = readFileSync(lean, "utf-8");
    } catch {
      continue;
    }
    const stripped = stripLeanComments(src);
    const spans = splitDeclarations(stripped);
    // Fall back to whole-file classification when no decl is
    // recognised (a file of pure `notation`/`macro`, say): everything
    // lands as a value dep, the weaker claim.
    const sig = spans.length ? spans.map((s) => s.signature).join("\n") : "";
    const body = spans.length ? spans.map((s) => s.body).join("\n") : stripped;

    const typeDeps = new Set<string>();
    const valueDeps = new Set<string>();
    const mine = decl.split(".").pop()!;
    for (const [short, target] of nameToDecl) {
      if (target === decl || short === mine) continue;
      const re = new RegExp(`(?<![A-Za-z0-9_'.])${short}(?![A-Za-z0-9_'])`);
      if (re.test(sig)) typeDeps.add(target);
      else if (re.test(body)) valueDeps.add(target);
    }
    edges += typeDeps.size + valueDeps.size;

    const relLean = lean.startsWith(repoRoot) ? lean.slice(repoRoot.length + 1) : lean;
    cache.decls[decl] = {
      type_deps: [...typeDeps].sort(),
      value_deps: [...valueDeps].sort(),
      lean_path: relLean,
      lean_sha: leanSha(repoRoot, relLean),
      source: "scan",
      checked_at: now,
    };
  }

  saveCache(repoRoot, cache);
  console.log(`Scanned ${blocks.length} block-owned declarations`);
  console.log(`  indexed names:  ${nameToDecl.size}  (>= ${MIN_NAME_LEN} chars)`);
  console.log(`  formal edges:   ${edges}`);
  console.log(`Wrote ${outputPath(repoRoot)} (source: scan — APPROXIMATE, see module doc)`);
}

function staleMode(repoRoot: string): void {
  const cache = loadCache(repoRoot);
  const decls = Object.keys(cache.decls);
  if (decls.length === 0) {
    console.log(`No ${OUTPUT_REL} cache found (nothing to check).`);
    return;
  }
  const fresh: string[] = [];
  const stale: string[] = [];
  const noSha: string[] = [];
  const gone: string[] = [];
  for (const d of decls) {
    const e = cache.decls[d];
    if (!e.lean_path) {
      noSha.push(d);
      continue;
    }
    const cur = leanSha(repoRoot, e.lean_path);
    if (cur === undefined) gone.push(d);
    else if (!e.lean_sha) noSha.push(d);
    else if (e.lean_sha !== cur) stale.push(d);
    else fresh.push(d);
  }
  const unusable = stale.length + noSha.length + gone.length;
  console.log(`lean-atlas-deps: ${cache.$schema}  (source: ${cache.source})`);
  console.log(`  generated_at: ${cache.generated_at || "(unknown)"}`);
  console.log(`  tracked:      ${decls.length}`);
  console.log(`  fresh:        ${fresh.length}`);
  console.log(`  STALE:        ${stale.length}  (lean_sha != live file)`);
  console.log(`  missing-sha:  ${noSha.length}`);
  console.log(`  file-gone:    ${gone.length}`);
  const show = (label: string, list: string[]) => {
    if (!list.length) return;
    console.log(`\n${label} (${list.length}):`);
    for (const d of list.slice(0, 30)) console.log(`  ${d}`);
    if (list.length > 30) console.log(`  … and ${list.length - 30} more`);
  };
  show("STALE", stale);
  show("file-gone", gone);
  if (unusable > 0) {
    console.log(
      `\n${unusable}/${decls.length} entries unusable. uses-formal-coverage ` +
        `reports n/a for the affected blocks until refreshed.`,
    );
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${decls.length} entries fresh ✓`);
  }
}

// ── CLI ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const repoRoot = findContentRepoRoot();
  const positional = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--ingest"));
  const root = positional ? join(repoRoot, positional) : join(repoRoot, "content");

  if (args[0] === "--ingest" && args[1]) ingestMode(repoRoot, args[1]);
  else if (args[0] === "--scan") scanMode(repoRoot, root);
  else if (args[0] === "--stale") staleMode(repoRoot);
  else if (args[0] === "--list") listMode(repoRoot, root);
  else {
    console.log(`Formal dependency-graph ingest -> ${OUTPUT_REL}

  --list [root]        List blocks with a resolvable .lean
  --ingest <jsonl>     Ingest Lean Atlas output (authoritative).
                       One decl per line:
                         {"decl":"...","type_deps":[],"value_deps":[],"lean_path":"..."}
  --scan [root]        Fallback extractor — no Lean toolchain needed.
                       APPROXIMATE (syntactic, not elaborated): misses
                       simp/instance/unfolding deps, can over-report a
                       coincidental name. Marked source:"scan".
  --stale              Report entries whose .lean changed since extraction.

Atlas is authoritative; prefer --ingest when a Lean toolchain and a
version-compatible Lake build are available.`);
  }
}

export type { DepsCache, DeclEntry };
