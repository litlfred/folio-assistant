#!/usr/bin/env bun
/**
 * A path to an instance's declaration is built from `DECLARATION_FILENAME`,
 * not from a string literal.
 *
 * Bean `jijc`, under the owner's REPLACE ruling on `b5f0` (2026-09-21):
 * `<name>.config.json` becomes the single declaration at an instantiation
 * root and `harness.json` goes, with `cat-bootstrap/` and the
 * `folio-assistant-*` instances in scope.
 *
 * ## The defect this exists for
 *
 * `DECLARATION_FILENAME` has been exported from `schemas/cat-harness.ts` the
 * whole time, and call sites built the path from a literal instead. That is
 * not a style complaint. A constant nothing uses is a constant that does not
 * do its job: the rename it exists to make cheap costs a hand-edit at every
 * one of them, and the next site somebody adds costs another.
 *
 * *Measured 2026-09-21, and left as a dated observation rather than a
 * present-tense claim* (bean `8nzu`, whose whole subject is a provenance
 * number read later as guidance): **20 non-test bypasses across 10 files** —
 * 18 inside this instance, 2 outside it. **Run the check for today's figure;
 * do not quote this one.**
 *
 * The substitution is a morning's work. **Without this check it regresses the
 * first time anyone types the filename**, which is why the check came first
 * and the substitution second.
 *
 * ## What FAILS, and why the rule is definitional rather than a guess
 *
 * > A quoted string literal whose whole value is the declaration filename, in
 * > a non-test `.ts` file, outside the constant's own definition.
 *
 * Matching the *whole* literal is what keeps this free of judgement. A path is
 * built by `join(root, "harness.json")` — the filename is the entire string.
 * Prose that happens to mention the file is never a whole-string literal; it
 * is a sentence.
 *
 * ## Three classes are COUNTED and do not fail, each for a stated reason
 *
 * | class | today | why not a failure |
 * |---|---|---|
 * | prose — the name inside a human-readable message or a doc comment | see report | a rename REWORDS these; it does not substitute a constant into them. Flagging them would make the check demand that error text be assembled from constants, which nothing here asks for |
 * | test fixtures | counted, see report | **a judgement, not a measurement.** A fixture writing `join(root, "harness.json")` is constructing the file the code under test looks for. Route it through the constant and the test passes vacuously after a rename — the fixture moves with the code and nobody learns the contract changed. Pinning is defensible; so is the hand-edit count being unacceptable. `jijc` carries the call as an open item rather than this check deciding it silently |
 * | template literals building a path | 0 on 2026-09-21 | measured, not assumed: every backtick occurrence in this corpus is message text. Implemented anyway and proven against a planted case, because "zero today" is not "impossible" |
 *
 * ## What it does NOT catch, stated because a checker that hides its blind
 * spots is worse than none
 *
 * **Non-TypeScript readers.** The `.yml` workflow files that name the filename
 * cannot import a constant; they are reported by count so a rename knows they
 * exist, and this check has no opinion on how they should be fixed.
 *
 * **Call sites outside the instance that owns the constant.** Measured: two,
 * both in `folio-assistant-core/schemas/library-ref.ts`, and
 * `folio-assistant-core` imports **nothing** from `cat-harness` today. Making
 * these use the constant would create this repository's first cross-instance
 * code dependency, and giving core its own copy would make two constants —
 * which is the defect this check exists to stop, one layer up.
 *
 * That is a boundary decision belonging to the split (`vke6`), not to a
 * refactor, so they are **counted and not failed**. Silently excluding them
 * would be the `dh4f` shape: a consumer reporting a clean run over something
 * it never examined.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { DECLARATION_FILENAME } from "../schemas/cat-harness.js";

const REPO_ROOT = resolve(import.meta.dir, "../..");

/** Where the constant itself is defined — the one legitimate literal. */
const DEFINITION_SITE = "cat-harness/schemas/cat-harness.ts";

/**
 * The instance that owns the constant, DERIVED from where it is defined.
 *
 * A call site outside it cannot import the constant without creating a
 * cross-instance dependency — a boundary decision, not a refactor. See the
 * module header.
 *
 * Derived rather than written out a second time: the owning instance and the
 * definition site are one fact, and this repository has paid for stating one
 * fact twice often enough to have a rule about it. Moving the constant moves
 * this with it.
 */
const OWNING_INSTANCE = DEFINITION_SITE.slice(0, DEFINITION_SITE.indexOf("/") + 1);

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next"]);

export interface Bypass {
  /** Repo-relative path. */
  file: string;
  line: number;
  /** The source line, trimmed. */
  text: string;
  kind: "literal" | "template";
}

export interface DeclarationFilenameReport {
  filesRead: number;
  /** Non-test call sites building the path from a literal. These FAIL. */
  bypasses: Bypass[];
  /** Counted, never failed — see the module header for each reason. */
  counted: { tests: number; prose: number; nonTypescript: number };
  /**
   * Bypasses outside {@link OWNING_INSTANCE}. Counted with their locations
   * rather than as a bare number: a boundary question needs the sites named
   * so somebody can decide it, and a count alone cannot be acted on.
   */
  crossInstance: Bypass[];
}

/**
 * Is this the whole value of a quoted string literal?
 *
 * The whole-value test is the rule. `"harness.json"` is a path segment;
 * `"no harness.json at ${root}"` is a sentence, and no amount of constant
 * substitution improves it.
 */
function wholeStringLiteral(line: string, filename: string): boolean {
  return line.includes(`"${filename}"`) || line.includes(`'${filename}'`);
}

/**
 * A template literal that builds a PATH rather than a message.
 *
 * Measured at zero on this corpus, and implemented regardless: the class is
 * reachable the moment somebody writes `` `${dir}/harness.json` ``, and a
 * check that only catches the shapes already present cannot catch the next
 * one.
 *
 * ## The first draft of this guard was wrong, and the corpus said so
 *
 * It accepted **a separator OR an interpolation** before the filename, which
 * made a `/` sufficient — and immediately reported two sentences:
 *
 * - `` `docs/_data/harness.json is stale.\n` `` — prose, and see below
 * - a tool description containing `` `cat-harness/harness.json` `` mid-sentence
 *
 * A static path inside backticks is prose: it is a sentence naming a file, and
 * a rename rewords it. **Only an INTERPOLATION is construction** — that is the
 * thing a constant can be substituted into. The rule narrowed to that, and the
 * class went back to the zero it was measured at.
 *
 * ## `docs/_data/harness.json` is a DIFFERENT FILE
 *
 * Found by that false positive and worth more than the rule it corrected: the
 * Jekyll data file under `docs/_data/` shares the basename and is **not** an
 * instance declaration. Under the REPLACE ruling it must not be renamed. The
 * whole-value test already excludes it — nothing joins to it as a bare
 * filename — but a sweep run by hand over the basename would take it, which is
 * exactly how a rename breaks a site build.
 */
function pathTemplate(line: string, filename: string): boolean {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\$\\{[^}]*\\}/?" + escaped + "(?![\\w.-])").test(line);
}

/** A comment line — prose by construction. */
function isComment(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith("*") || t.startsWith("//") || t.startsWith("/*");
}

function walk(dir: string, out: string[]): void {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) out.push(p);
  }
}

function countNonTypescript(): number {
  const out: string[] = [];
  const yml = join(REPO_ROOT, ".github", "workflows");
  try {
    for (const e of readdirSync(yml, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      if (!e.name.endsWith(".yml") && !e.name.endsWith(".yaml")) continue;
      if (readFileSync(join(yml, e.name), "utf8").includes(DECLARATION_FILENAME)) out.push(e.name);
    }
  } catch {
    return -1; // could not determine — reported as unknown, never as zero
  }
  return out.length;
}

export function checkDeclarationFilename(root = REPO_ROOT): DeclarationFilenameReport {
  const files: string[] = [];
  walk(root, files);

  const bypasses: Bypass[] = [];
  const crossInstance: Bypass[] = [];
  let tests = 0;
  let prose = 0;

  for (const abs of files) {
    const rel = relative(root, abs).split("\\").join("/");
    const isTest = /\.test\.tsx?$|\.e2e\.tsx?$|(^|\/)tests?\//.test(rel);
    const lines = readFileSync(abs, "utf8").split("\n");

    for (const [i, line] of lines.entries()) {
      if (!line.includes(DECLARATION_FILENAME)) continue;

      if (isComment(line)) {
        prose++;
        continue;
      }

      const literal = wholeStringLiteral(line, DECLARATION_FILENAME);
      const template = pathTemplate(line, DECLARATION_FILENAME);
      if (!literal && !template) {
        prose++;
        continue;
      }

      // The constant's own definition is the one literal that must stay.
      if (rel === DEFINITION_SITE && line.includes("DECLARATION_FILENAME =")) continue;

      if (isTest) {
        tests++;
        continue;
      }

      const found: Bypass = {
        file: rel,
        line: i + 1,
        text: line.trim(),
        kind: literal ? "literal" : "template",
      };
      (rel.startsWith(OWNING_INSTANCE) ? bypasses : crossInstance).push(found);
    }
  }

  return {
    filesRead: files.length,
    bypasses,
    crossInstance,
    counted: { tests, prose, nonTypescript: countNonTypescript() },
  };
}

function formatReport(r: DeclarationFilenameReport): string {
  if (r.filesRead === 0) {
    return "Declaration filename\n  ? EXAMINED NOTHING — no TypeScript found. Not a pass.";
  }
  const out = [`Declaration filename (${r.filesRead} file(s), constant \`${DECLARATION_FILENAME}\`)`];

  if (r.bypasses.length === 0) {
    out.push("  ✓ every non-test call site builds the path from DECLARATION_FILENAME");
  } else {
    for (const b of r.bypasses) {
      out.push(`  ✗ ${b.file}:${b.line} [${b.kind}]`);
      out.push(`      ${b.text}`);
    }
    out.push("");
    out.push("  Import DECLARATION_FILENAME from schemas/cat-harness and join with it.");
    out.push("  The constant exists so the REPLACE ruling on `b5f0` costs one edit, not twenty.");
  }

  if (r.crossInstance.length > 0) {
    out.push("");
    out.push(`  ~ ${r.crossInstance.length} call site(s) OUTSIDE ${OWNING_INSTANCE} — counted, not failed:`);
    for (const b of r.crossInstance) out.push(`      ${b.file}:${b.line}`);
    out.push("      Using the constant here would be this repo's first cross-instance import;");
    out.push("      a second copy of it would be two constants. That is a boundary decision for");
    out.push("      the split (`vke6`), not for this check — see the module header.");
  }

  const c = r.counted;
  out.push("");
  out.push("  Counted, not failed — each for a reason in the module header:");
  out.push(`    test fixtures      ${c.tests}  (an open judgement on bean \`jijc\`, not a finding)`);
  out.push(`    prose occurrences  ${c.prose}  (a rename REWORDS these)`);
  out.push(
    c.nonTypescript < 0
      ? "    workflow files     ? COULD NOT DETERMINE — not zero"
      : `    workflow files     ${c.nonTypescript}  (cannot import a constant; listed so a rename knows)`,
  );
  return out.join("\n");
}

if (import.meta.main) {
  let report: DeclarationFilenameReport;
  try {
    report = checkDeclarationFilename();
  } catch (e) {
    console.error(`Could not check declaration filename use: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.bypasses.length || report.filesRead === 0 ? 1 : 0);
}
