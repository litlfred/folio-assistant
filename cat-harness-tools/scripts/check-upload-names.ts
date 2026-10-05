#!/usr/bin/env bun
/**
 * Every file in an `uploads` or `library` graph carries a normalised stub name.
 *
 * @module scripts/check-upload-names
 * @covers uploads, library
 *
 * ## Why — a name broke `main`
 *
 * `uploads/PIIS2589750021000388 (2).pdf` is a browser's duplicate-download
 * suffix, ingested verbatim. The generated README row for it reads
 *
 *     | [`PIIS2589750021000388 (2).pdf`](PIIS2589750021000388 (2).pdf) | a file | |
 *
 * and a Markdown link target ENDS AT THE FIRST `)`, so the link resolves to
 * `PIIS2589750021000388 (2` — a path that does not exist. `readme:links` fails,
 * which is a `Repository gates` step, and so does *"over the real tree, every
 * link in every generated README resolves"*. **Main was red on this**, from an
 * upload rather than from any code.
 *
 * ## Why the name AS WELL AS the link — both layers exist, on purpose
 *
 * The escaping half landed on `main` the same day from a sibling session
 * (#1639): `linkTarget` in `bootstrap-tools/scripts/subgraph-readmes.ts`
 * percent-encodes every segment of a destination, and `decodeLinkTarget` in
 * `check-subgraphs.ts` decodes before asking the filesystem. **That is what
 * keeps `main` green, and this check does not replace it.**
 *
 * The two reach different things. The encoder is total over what that ONE
 * generator writes. This is total over the NAME, so it also holds for a shell,
 * an `href`, a CI log line, and the next generator nobody has written yet — the
 * places the encoder is not. Measured after both landed: `uploads/README.md`
 * contains zero percent-escapes, because the encoder is a no-op once the names
 * are safe.
 *
 * So the reason is reach, not effort. The owner ruled it 2026-09-30: *"rename
 * files to normalize to stubs and downstream us is OK"*.
 *
 * ## The extension chain is preserved, and that is the whole risk
 *
 * `slugify` from `init-folio.ts` maps every non-alphanumeric run to `-`, so
 * applied to a whole filename it destroys the extension:
 * `…(2).pdf` → `…-2-pdf`. This slugs the STEM only.
 *
 * And `.extraction.json` is a SIDECAR suffix, not an extension: `X.pdf` pairs
 * with `X.pdf.extraction.json`. Renaming the source without its sidecar
 * orphans an extraction; renaming the sidecar by a different rule than its
 * source does the same. So the sidecar suffix is stripped first, the remaining
 * name normalised by the one rule, and the suffix put back — which makes the
 * pair move together by construction rather than by care. Measured before this
 * shipped: 10 pairs, 0 orphans.
 *
 * `--fix` moves with `git mv`, so history follows the file. It **refuses**
 * rather than renaming when two files would normalise to one name: picking a
 * winner there silently destroys an upload.
 *
 * Exit codes: 0 report only, or `--check` with every name normalised · 1
 * `--check` with a finding, or `--fix` refusing a collision · 2 could not
 * determine.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

import {
  instanceDirectoriesForGraph,
  instanceRootsIn,
  readDeclaration,
} from "../../cat-harness/schemas/cat-harness.js";

/** The graph kinds whose files are named after what somebody uploaded. */
const KINDS = ["uploads", "library"] as const;

/**
 * A sidecar suffix is not an extension.
 *
 * `X.pdf.extraction.json` is the extraction OF `X.pdf`, and the two must
 * normalise to names that still pair. Stripping the suffix before normalising
 * and restoring it after makes that structural.
 */
const SIDECAR_SUFFIXES = [".extraction.json"] as const;

/**
 * The characters that make a filename unsafe to LINK to or to pass around.
 *
 * Deliberately NOT "everything `slugify` would change". A first draft used
 * `slugify` on the stem and reported 110 findings, 77 of which were
 * `README.md` → `readme.md`: `slugify` lowercases, and **case is not the
 * defect**. Renaming `README.md` would break every link to it and every
 * generator that writes one — a check that damages correct names to enforce a
 * convention nobody asked for.
 *
 * So this is the set that actually breaks something:
 *
 * - a space, `(` or `)` truncate or mangle a Markdown link target — the
 *   `PIIS… (2).pdf` defect that reddened `main`
 * - `[` `]` break the label half; `<` `>` `|` break tables and the
 *   angle-bracket link form
 * - `#` and `?` are a fragment and a query to every URL parser
 * - `&`, `%`, quotes and backticks need escaping in a shell, an href or both
 * - a comma is safe in a link but not stub-like, and the owner asked for
 *   stubs; it is the one character here included for the convention rather
 *   than for a breakage
 *
 * Everything else — case, digits, dots, dashes, underscores — is left exactly
 * as uploaded, because renaming a file nobody has trouble with costs history
 * and gains nothing.
 */
const UNSAFE = /[ ,()[\]{}#?&%'"`<>|]+/g;
/** The same class, non-global: `.test` on a `/g` regex is STATEFUL and skips. */
const UNSAFE_ONCE = /[ ,()[\]{}#?&%'"`<>|]/;

/** `"PIIS… (2).pdf"` → `"PIIS…-2.pdf"` — case and extension untouched. */
export function normaliseName(name: string): string {
  for (const suffix of SIDECAR_SUFFIXES) {
    if (name.endsWith(suffix)) return normaliseName(name.slice(0, -suffix.length)) + suffix;
  }
  const dot = name.lastIndexOf(".");
  // A dotfile or a name with no extension has no stem to split off.
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  // A name with NO unsafe character is returned untouched. Without this guard
  // the collapse below rewrites names that were never a problem: it renamed
  // `sec-119-74-broadly--versus-…md` to `…broadly-versus-…md` purely for its
  // double dash, and that file is a library SECTION — the rename dropped
  // `prose-sec-119` out of the generated JSON-LD's `contains`, losing a block
  // from the published graph. Same class as wanting `README.md` lowercased:
  // a rule that edits correct names to satisfy itself.
  if (!UNSAFE_ONCE.test(stem)) return name;
  const safe = stem
    .replace(UNSAFE, "-")
    // Collapse and trim ONLY around what was just replaced — never a dash the
    // uploader wrote. `--` is not unsafe and is not this check's business.
    .replace(/^-+|-+$/g, "");
  return `${safe || stem}${ext}`;
}

/** True when the name is already what {@link normaliseName} would produce. */
export function isNormalised(name: string): boolean {
  return normaliseName(name) === name;
}

interface Finding {
  readonly dir: string;
  readonly from: string;
  readonly to: string;
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.startsWith(".")) continue; // the dot-prefix guard, as everywhere else
    const p = join(dir, e);
    let s: ReturnType<typeof statSync>;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) out.push(...filesUnder(p));
    else out.push(p);
  }
  return out;
}

function main(): number {
  const repoRoot = process.cwd();
  const check = process.argv.includes("--check");
  const fix = process.argv.includes("--fix");

  const roots = instanceRootsIn(repoRoot);
  if (roots.length === 0) {
    console.error("✗ no instance declaration read — refusing (see `instanceRootsIn`).");
    return 2;
  }

  const dirs = new Set<string>();
  for (const root of roots) {
    let name: string | undefined;
    try {
      name = readDeclaration(root)?.name;
    } catch (e) {
      console.error(`✗ cannot read the declaration in ${root}:`);
      console.error(`  ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
      console.error("  Refusing: an instance I cannot read is not an instance with clean names.");
      return 2;
    }
    if (name === undefined) continue;
    for (const kind of KINDS) {
      for (const d of instanceDirectoriesForGraph(root, kind)) dirs.add(d);
    }
  }

  let files = 0;
  const findings: Finding[] = [];
  // Collisions are computed per directory, since a name only has to be unique
  // beside its siblings.
  const collisions: string[] = [];

  for (const dir of [...dirs].sort()) {
    const under = filesUnder(dir);
    const byTarget = new Map<string, string[]>();
    for (const p of under) {
      files++;
      const name = p.slice(p.lastIndexOf("/") + 1);
      const parent = p.slice(0, p.lastIndexOf("/"));
      const to = normaliseName(name);
      const key = join(parent, to);
      byTarget.set(key, [...(byTarget.get(key) ?? []), p]);
      if (to !== name) findings.push({ dir, from: p, to: key });
    }
    for (const [target, sources] of byTarget) {
      if (sources.length > 1) {
        collisions.push(
          `${relative(repoRoot, target)} ← ${sources.map((s) => relative(repoRoot, s)).join(", ")}`,
        );
      }
    }
  }

  console.log("Upload and library names — normalised stubs\n");
  console.log(`  declared directories        ${dirs.size}`);
  console.log(`  files examined              ${files}`);
  console.log(`  ...needing normalisation    ${findings.length} of ${files}\n`);

  if (dirs.size === 0) {
    // A determined empty, not a clean sweep.
    console.log("  NOTE: no instance declares an `uploads` or `library` graph, so this");
    console.log("        run examined nothing. That is not a clean result.");
    return 0;
  }

  for (const c of collisions) {
    console.log(`  ✗ COLLISION ${c}`);
  }
  if (collisions.length > 0) {
    console.log("\n  Two files normalise to one name. Refusing to rename either:");
    console.log("  picking a winner silently destroys an upload. Rename one by hand.");
    return 1;
  }

  for (const f of findings.slice(0, 40)) {
    console.log(`  · ${relative(repoRoot, f.from)}`);
    console.log(`      → ${relative(repoRoot, f.to)}`);
  }
  if (findings.length > 40) console.log(`  … and ${findings.length - 40} more`);
  if (findings.length > 0) console.log();

  if (findings.length === 0) {
    console.log(`✓ every one of ${files} file(s) carries a normalised stub name.`);
    return 0;
  }

  if (fix) {
    let moved = 0;
    for (const f of findings) {
      // `git mv` so history follows the file; a plain rename loses it.
      const r = spawnSync("git", ["mv", "--", f.from, f.to], { cwd: repoRoot, encoding: "utf-8" });
      if (r.status !== 0) {
        console.error(`✗ git mv failed for ${relative(repoRoot, f.from)}:`);
        console.error(`  ${(r.stderr ?? "").trim().split("\n")[0]}`);
        return 1;
      }
      moved++;
    }
    console.log(`✓ renamed ${moved} file(s) with \`git mv\`. Commit them.`);
    return 0;
  }

  console.log(`✗ ${findings.length} file(s) are not normalised. \`--fix\` renames them with \`git mv\`.`);
  return check ? 1 : 0;
}

// GUARDED so the module can be imported. Without this, a test importing an
// exported helper runs the CLI and exits the test runner — which is exactly
// what happened to `upload-names.test.ts`: the report printed and the run
// died with no tally. `if (import.meta.main)` is the idiom every other
// importable script here uses.
if (import.meta.main) process.exit(main());
