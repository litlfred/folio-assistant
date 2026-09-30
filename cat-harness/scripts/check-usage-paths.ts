#!/usr/bin/env bun
/**
 * A script's usage string must name the script.
 *
 * Sibling of `check-workflow-paths.ts` (bean `52dz`), one layer out. That
 * module asks whether a path a WORKFLOW invokes resolves from the directory
 * the step runs in. This asks the narrower question that needs no cwd model
 * and no judgement at all:
 *
 * > When a file's own header says `bun run <path>` and `<path>` is this file
 * > under a shorter root, is `<path>` where this file actually is?
 *
 * ## "Under a shorter root" is a SUFFIX test, and the first draft got it wrong
 *
 * The obvious rule — same basename — is wrong, and reading one line it flagged
 * is what caught it. `cat-harness/tools/index.ts` documents `--check-deps`
 * against `cat-harness/src/index.ts`, spelled there without the instance
 * prefix: a DIFFERENT file that merely shares the basename `index.ts`. Under
 * the basename rule `--fix` would have rewritten that reference to point at
 * `cat-harness/tools/index.ts` — a wrong fix that LOOKS right, which is the
 * exact failure `check-workflow-paths.ts`'s exemption table warns about for the
 * `build.ts` under `content/pipeline/`.
 *
 * (Both of those wrong spellings are named here WITHOUT their bare prefix on
 * purpose. This module is a printed-command source, so `check:command-paths`
 * holds it to the entry-corpus rule — every repository-relative path in it must
 * resolve, with no folio-relative escape. Quoting the defect verbatim made this
 * file's own documentation break a sibling gate, which is a neat demonstration
 * of why that gate declines to guess and this one only judges self-references.)
 *
 * So the spelling must be a **path-segment suffix** of the referring file's own
 * repo-relative path: `pipeline/build.ts` is a suffix of
 * `cat-harness/content/pipeline/build.ts` and so names it under its pre-split
 * root, while `src/index.ts` is not a suffix of `cat-harness/tools/index.ts`
 * and names something else. That is decidable from the two strings, and it
 * excludes the collision STRUCTURALLY rather than by exemption — an exemption
 * would have had to be written once per collision, and the next one would
 * arrive unexempted.
 *
 * ## Why the self-reference and not every path — the gap, located exactly
 *
 * Three checks already read paths, and this is a FOURTH question rather than a
 * fourth answer. `check-command-paths.ts`'s own header tables the first three:
 *
 * | check | judges |
 * |---|---|
 * | `check:agent-entry-links` | markdown LINKS out of the entry files |
 * | `check:agents-claims` | LOCATION claims — `symbol` in `module.ts` |
 * | `check:declared-paths` | quoted path LITERALS in code |
 * | `check:command-paths` | paths inside fenced COMMANDS and skill prose |
 *
 * `check:command-paths` is the near neighbour and it **passes** over every
 * occurrence this module reports. That is not an oversight — it is
 * `aboutThisTree()`, which judges a path only when its first segment is a
 * directory that EXISTS at the repository root, or it is a root-level `.md`.
 * `FOLIO_OWNED` (`folio`, `content`, `uploads`, `library`, `lean`, `.lake`, plus
 * `docs` for skills) is excluded outright. Everything else is COUNTED as
 * folio-relative rather than judged, and its header defends that as the design:
 * *"a check over prose has to be RIGHT rather than thorough, because its
 * findings are read by a person deciding whether to keep it."*
 *
 * Measured on a clean worktree, 2026-09-25: **364 checked, 306 folio-relative**,
 * exit 0. And that 306 holds two different things — genuinely folio-relative
 * paths (`content/…`, `folio/…`) AND stale spellings whose head exists nowhere.
 * `pipeline/apply-glossary-curation.ts` is in it because no root `pipeline/`
 * exists, not because anybody judged it folio-side.
 *
 * ## A self-reference needs no audience guess, which is the whole point
 *
 * A path in prose has an AUDIENCE and prose cannot declare one, which is why
 * the conservatism above is right. `bun run pipeline/build.ts` after
 * `cd content` is a folio reader's command, written against a root the
 * convention has since retired in favour of `folio/` (owner, 2026-09-20) — so
 * prefixing `cat-harness/` would cement a retired convention AND resolve to a
 * different file that shares the basename. `check-workflow-paths.ts`'s own
 * exemption table records paying for exactly that:
 *
 * > *"I prefixed this line under `52dz` because THIS check demanded it, which
 * > made the file internally inconsistent in the one workflow folios consume.
 * > The check was right that the path does not resolve here and wrong about
 * > the remedy."*
 *
 * A **self-reference** has no such problem. The reader is looking at the file,
 * so the only path true for them is the file's own — whatever its head. That
 * makes this check total and decidable precisely where the general one must
 * decline, and it is the subset a sweep can touch without deciding anything.
 *
 * ## What it found the day it was written
 *
 * **294 self-references, of which 287 in 105 files misname themselves** — only
 * **7** were already correct. Every one is a casualty of the #223 split moving
 * the platform under `cat-harness/` while the usage strings kept the pre-split
 * spelling. `AGENTS.md` records two of them being fixed by hand the same day
 * (*"the two commands in the file a newcomer reads first both exited 1"*);
 * these are the rest.
 *
 * The basename draft reported 107 files over 289 occurrences. The suffix rule
 * above removed 2 files and 2 occurrences, and those two were the dangerous
 * ones — a collision `--fix` would have mis-rewritten, not a near miss.
 *
 * Of the 105, **19 already have a `package.json` script**. For those the
 * better spelling is the script NAME, which is the fix
 * `check-workflow-paths.ts` recommends — *"it puts the path in `package.json`
 * once instead of in every caller"*. This check reports that as advice and
 * does not apply it: a named script may bake in flags the usage line varies,
 * so substituting one is a judgement about equivalence, not a rename.
 * `--fix` only ever writes the file's own repo-relative path, which is
 * provable from the filesystem.
 *
 * ## Tests are excluded, deliberately
 *
 * A test may name a path that does not exist ON PURPOSE:
 * `scripts/tests/workflow-paths-resolve.test.ts` invokes
 * `scripts/does-not-exist.ts` as a fixture, and reporting it would train a
 * reader to skim this check's output — which is worse than not having it.
 *
 * ## "Could not determine" is never green
 *
 * A file this module cannot read is {@link Verdict.Undetermined} and the run
 * FAILS. House rule (`ci-health`, `health`, `kg:audit`, `gates`): an unknown
 * rendered as a pass is indistinguishable from a real pass, while an unknown
 * rendered as a failure costs somebody a minute's reading.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-usage-paths.ts          # report, exit 1 on a finding
 *   bun run cat-harness/scripts/check-usage-paths.ts --list    # every self-reference and its verdict
 *   bun run cat-harness/scripts/check-usage-paths.ts --fix     # rewrite each to the file's own path
 *
 * @covers none — it audits usage strings in SOURCE comments, which are not the
 *   content of any declared graph. A `.ts` file under `skills/` is scanned
 *   because it is source, not because the `kg` graph is being judged; the graph
 *   audits are `kg:audit`. Same decision and same reason as
 *   `check-workflow-paths.ts`.
 *
 * @module scripts/check-usage-paths
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";
import { trackedPaths } from "./check-portable-paths.js";

const ROOT = repoRootFor(resolve(import.meta.dir, ".."));

/**
 * The subject set comes from **git**, not from a filesystem walk.
 *
 * Bean `xd1g` — *"11 root-rooted scans have no gitignore awareness"* — and its
 * parent `ramz`, where `check-context-emission` *"walked the filesystem behind a
 * hand-written denylist and swept 145 gitignored documents as repository
 * content."* That is the defect this module would have shipped: its first draft
 * carried a `SKIP_DIRS` denylist (`node_modules`, `build`, `dist`, `.venv`, …),
 * which is the same construction under a different name.
 *
 * A denylist is wrong in a way that hides itself. It passes on CI, where a
 * checkout holds nothing ignored, and misbehaves only in a working container
 * that has accumulated generated directories — so the failure arrives for
 * whoever is mid-work and never for the gate's author. Measured here: a
 * container carrying untracked `_kg/`, `schemas/` and `scripts/` made two
 * SIBLING gates disagree with CI, which is how this was noticed at all.
 *
 * `trackedPaths` is reused rather than re-implemented, and it carries the
 * reason for `-z` on itself: a filename may contain a newline, and a line split
 * would mangle the very paths a path check reads.
 *
 */
/** Extensions whose header comments carry usage strings. */
const SUBJECT = /\.(ts|tsx|sh|py)$/;

/** What became of one self-reference. */
export enum Verdict {
  /** The usage string names the file's own repo-relative path. */
  Names = "names-itself",
  /** It names something else. A defect. */
  Misnames = "misnames-itself",
  /** Declared in {@link SELF_REF_EXEMPTIONS}: wrong-looking on purpose. */
  Exempt = "exempt",
  /** The file could not be read. NOT a pass. */
  Undetermined = "undetermined",
}

/**
 * A self-reference that is deliberately not the file's own path.
 *
 * `file` is the referring file's repo-relative path and `match` a substring of
 * the spelling it uses. Every entry must match at least one occurrence, or the
 * run fails — an exemption for a line that no longer exists is a claim about
 * the present that stopped being true. Same shape and same reason as
 * `FOLIO_PATHS` in `check-workflow-paths.ts`.
 *
 * Empty at birth, and that is the finding rather than an oversight: all 107
 * files measured on 2026-09-20 were simply stale, none was deliberate.
 */
export interface SelfRefExemption {
  file: string;
  match: string;
  reason: string;
}

export const SELF_REF_EXEMPTIONS: SelfRefExemption[] = [];

/** One `bun run <path>` occurrence that names the file it sits in. */
export interface SelfReference {
  /** The referring file, relative to the repository root. */
  file: string;
  /** 1-indexed line. */
  line: number;
  /** The path exactly as the file spells it. */
  spelled: string;
  /** What it should say: the referring file's own repo-relative path. */
  expected: string;
  verdict: Verdict;
  /** A `package.json` script that runs this file, when one exists. */
  script?: string;
  /** Set on {@link Verdict.Exempt} and {@link Verdict.Undetermined}. */
  note?: string;
}

/** `bun run <path>` / `bunx run <path>`, path-shaped only. */
const INVOCATION = /bun(?:x)?\s+run\s+([A-Za-z0-9_@./-]+\.(?:ts|tsx|sh|py))/g;

/**
 * Does `spelled` name `rel` under a shorter root?
 *
 * A path-segment suffix test, NOT a basename test — see the module header on
 * `cat-harness/tools/index.ts` documenting `src/index.ts`, where the basename
 * rule would have produced a wrong fix that looks right. Segment-wise so
 * `x-build.ts` can never be read as a suffix of `prefix/x-build.ts`’s sibling.
 */
export function namesSelf(rel: string, spelled: string): boolean {
  const a = rel.split("/");
  const b = spelled.split("/");
  if (b.length === 0 || b.length > a.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (a[a.length - b.length + i] !== b[i]) return false;
  }
  return true;
}

/**
 * Every subject file under `root`, repo-relative.
 *
 * Tests are dropped here rather than filtered later so a caller cannot
 * reintroduce them by forgetting — see the module header on why a deliberate
 * fixture must not be reported.
 */
export function subjectFiles(root: string, list: (r: string) => string[] = trackedPaths): string[] {
  return list(root)
    .filter((rel) => SUBJECT.test(rel))
    .filter((rel) => !/\.test\.(ts|tsx)$/.test(rel))
    .filter((rel) => !rel.split("/").includes("tests"))
    .sort();
}

/**
 * Which `package.json` script, if any, runs `rel`.
 *
 * Reported as advice, never applied — see the module header. Returns the first
 * matching name so the advice is stable across runs.
 */
export function scriptFor(rel: string, scripts: Record<string, string>): string | undefined {
  for (const [name, cmd] of Object.entries(scripts)) {
    if (String(cmd).includes(rel)) return name;
  }
  return undefined;
}

/** The `scripts` block of the repository root's `package.json`, or `{}`. */
export function rootScripts(root: string): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

/** Every self-reference in one file, with its verdict. */
export function selfReferences(
  root: string,
  rel: string,
  scripts: Record<string, string>,
): SelfReference[] {
  let src: string;
  try {
    src = readFileSync(join(root, rel), "utf8");
  } catch (e) {
    return [
      {
        file: rel,
        line: 0,
        spelled: "",
        expected: rel,
        verdict: Verdict.Undetermined,
        note: `unreadable: ${e instanceof Error ? e.message : String(e)}`,
      },
    ];
  }
  const out: SelfReference[] = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(INVOCATION)) {
      const spelled = m[1];
      if (!namesSelf(rel, spelled)) continue; // names a different file
      const exempt = SELF_REF_EXEMPTIONS.find(
        (x) => x.file === rel && spelled.includes(x.match),
      );
      out.push({
        file: rel,
        line: i + 1,
        spelled,
        expected: rel,
        verdict: exempt
          ? Verdict.Exempt
          : spelled === rel
            ? Verdict.Names
            : Verdict.Misnames,
        script: scriptFor(rel, scripts),
        note: exempt?.reason,
      });
    }
  }
  return out;
}

/** Every self-reference in the repository. */
export function auditAll(root: string, list?: (r: string) => string[]): SelfReference[] {
  const scripts = rootScripts(root);
  return subjectFiles(root, list).flatMap((rel) => selfReferences(root, rel, scripts));
}

/**
 * Rewrite each misnamed self-reference to the referring file's own path.
 *
 * Only the exact spelling is replaced, and only on the line it was found on,
 * so a line mentioning two paths cannot have the other one rewritten. Returns
 * the files touched.
 */
export function applyFix(root: string, refs: SelfReference[]): string[] {
  const byFile = new Map<string, SelfReference[]>();
  for (const r of refs) {
    if (r.verdict !== Verdict.Misnames) continue;
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file)!.push(r);
  }
  const touched: string[] = [];
  for (const [rel, rs] of byFile) {
    const abs = join(root, rel);
    const lines = readFileSync(abs, "utf8").split("\n");
    for (const r of rs) {
      const i = r.line - 1;
      if (i < 0 || i >= lines.length) continue;
      lines[i] = lines[i].split(r.spelled).join(r.expected);
    }
    writeFileSync(abs, lines.join("\n"));
    touched.push(rel);
  }
  return touched.sort();
}

/** Exemptions matching nothing — each is a stale claim about the present. */
export function unmatchedExemptions(refs: SelfReference[]): SelfRefExemption[] {
  return SELF_REF_EXEMPTIONS.filter(
    (x) => !refs.some((r) => r.file === x.file && r.spelled.includes(x.match)),
  );
}

/** The report, as lines. Separated from printing so a test can read it. */
export function report(refs: SelfReference[], list: boolean): string[] {
  const out: string[] = [];
  const of = (v: Verdict): SelfReference[] => refs.filter((r) => r.verdict === v);
  const bad = of(Verdict.Misnames);
  const unknown = of(Verdict.Undetermined);

  if (list) {
    for (const r of refs) {
      const mark =
        r.verdict === Verdict.Names
          ? "✓"
          : r.verdict === Verdict.Misnames
            ? "✗"
            : r.verdict === Verdict.Undetermined
              ? "?"
              : "–";
      out.push(`${mark} ${r.file}:${r.line}  ${r.spelled}`);
      if (r.verdict === Verdict.Misnames) out.push(`    should be: ${r.expected}`);
      if (r.note) out.push(`    ${r.note}`);
    }
    out.push("");
  }

  for (const r of unknown) out.push(`? ${r.file}  ${r.note ?? "could not read"}`);

  if (bad.length > 0) {
    const files = new Set(bad.map((r) => r.file));
    out.push(
      `✗ ${bad.length} usage string(s) in ${files.size} file(s) name a path that is not the file's own.`,
      "",
      "  A reader copying one of these gets a module-not-found error. Fix with:",
      "    bun run check:usage-paths --fix",
      "",
    );
    if (!list) {
      for (const r of bad.slice(0, 20)) {
        out.push(`  ${r.file}:${r.line}`, `      says: ${r.spelled}`);
      }
      if (bad.length > 20) out.push(`  … and ${bad.length - 20} more (--list for all)`);
      out.push("");
    }
    const withScript = [...new Set(bad.filter((r) => r.script).map((r) => r.file))];
    if (withScript.length > 0) {
      out.push(
        `  ${withScript.length} of the ${files.size} file(s) already have a package.json`,
        "  script. Naming it instead of a path is the better spelling — it puts the",
        "  path in one place. NOT applied by --fix: a named script may bake in flags",
        "  the usage line varies, so substituting one is a judgement about",
        "  equivalence rather than a rename.",
        "",
      );
    }
  }

  const stale = unmatchedExemptions(refs);
  for (const x of stale) {
    out.push(`✗ exemption matches nothing: ${x.file} / ${x.match}`, `    ${x.reason}`);
  }

  if (unknown.length > 0) {
    out.push(
      `? ${unknown.length} file(s) could not be read. This is NOT a pass and NOT a`,
      "  failure of the check — no verdict is possible over them, so nothing here",
      "  may be read as a clean tree. Exit 2.",
    );
  } else if (bad.length === 0 && stale.length === 0) {
    out.push(
      `✓ every one of ${refs.length} self-referencing usage string(s) names its own file`,
    );
  }
  return out;
}

if (import.meta.main) {
  const list = process.argv.includes("--list");
  const fix = process.argv.includes("--fix");
  const refs = auditAll(ROOT);

  if (fix) {
    const touched = applyFix(ROOT, refs);
    for (const f of touched) console.log(`fixed ${f}`);
    console.log(`\n${touched.length} file(s) rewritten. Re-run without --fix to verify.`);
    process.exit(0);
  }

  // An empty subject set is could-not-determine, never a pass. `trackedPaths`
  // returns nothing outside a checkout, and "no file misnames itself" over zero
  // files is the vacuity this repository has paid for repeatedly.
  if (refs.length === 0) {
    console.error("? no self-referencing usage string was found in any tracked file.");
    console.error("  Either `git ls-files` returned nothing — not a checkout — or the");
    console.error("  subject filter matched none of it. This is NOT a pass. Exit 2.");
    process.exit(2);
  }

  for (const line of report(refs, list)) console.log(line);
  const unknown = refs.some((r) => r.verdict === Verdict.Undetermined);
  if (unknown) process.exit(2);
  const bad =
    refs.some((r) => r.verdict === Verdict.Misnames) || unmatchedExemptions(refs).length > 0;
  process.exit(bad ? 1 : 0);
}
