#!/usr/bin/env bun
/**
 * A path to an instance's declaration is built from `RETIRED_DECLARATION`,
 * not from a string literal.
 *
 * Bean `jijc`, under the owner's REPLACE ruling on `b5f0` (2026-09-21):
 * `<name>.config.json` becomes the single declaration at an instantiation
 * root and `harness.json` goes, with `bootstrap/` and the
 * `folio-assistant-*` instances in scope.
 *
 * ## The defect this exists for
 *
 * `RETIRED_DECLARATION` has been exported from `schemas/cat-harness.ts` the
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
 * **Non-TypeScript readers used to be a blind spot and are not one now.** A
 * `.yml` cannot import a constant, so the TypeScript rule does not transfer —
 * but "cannot import a constant" was doing double duty as "cannot be wrong",
 * and those are different claims. The YAML side had ONE bucket, *does the file
 * contain the string*, against the TypeScript side's careful four, and the
 * asymmetry hid two things at once:
 *
 *   - `run: cat cat-harness/harness.json` — a step that reads a file which no
 *     longer exists — was reported under `✓ no call site names the retired
 *     name`, exit 0. **Measured by planting exactly that line**, before any of
 *     this was written.
 *   - the count was per FILE, so a second occurrence in an already-counted
 *     file did not move the number either.
 *
 * {@link classifyWorkflowLine} gives it the same three-way split the
 * TypeScript side has, and a `use` now FAILS. `prose` is reworded by a rename,
 * exactly as on the TypeScript side; `jekyll-data` must never be renamed at
 * all, which is the one thing a bare count most needed to say and could not.
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
 *
 * @covers cat-harness
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { instanceRootsIn, siteDirFor } from "../schemas/cat-harness.js";
import { historicalPrefixes } from "../src/docs/declaration-claims.js";

/**
 * The RETIRED declaration filename.
 *
 * Kept as a constant so this gate can FIND it, never so a reader can fall back
 * to it — the same shape as `LEGACY_HARNESS_CONFIG` in
 * `schemas/harness-config.ts`, and for the reason recorded there: the previous
 * rename was a silent hard break, and `9ici` is what that cost.
 */
const RETIRED_DECLARATION = "harness.json";

const REPO_ROOT = resolve(import.meta.dir, "../..");

/** Where the constant itself is defined — the one legitimate literal. */
const DEFINITION_SITE = "cat-harness/schemas/cat-harness.ts";

/** This gate itself — the one file that must still name the retired string. */
const THIS_GATE = "cat-harness/scripts/check-declaration-filename.ts";

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

/** One workflow line naming the retired declaration, with what it is. */
export interface WorkflowRef {
  file: string;
  line: number;
  text: string;
  klass: "prose" | "jekyll-data" | "use";
}

export interface DeclarationFilenameReport {
  filesRead: number;
  /** Non-test call sites building the path from a literal. These FAIL. */
  bypasses: Bypass[];
  /** Counted, never failed — see the module header for each reason. */
  counted: { tests: number; prose: number };
  /**
   * Workflow lines naming the retired declaration, CLASSIFIED — not a count.
   *
   * `null` means the directory could not be read, which the report renders as
   * unknown and never as zero. A `use` in here fails the check.
   */
  workflows: WorkflowRef[] | null;
  /**
   * Bypasses outside {@link OWNING_INSTANCE}. Counted with their locations
   * rather than as a bare number: a boundary question needs the sites named
   * so somebody can decide it, and a count alone cannot be acted on.
   */
  crossInstance: Bypass[];
  /**
   * Markdown lines naming the retired declaration, CLASSIFIED — bean `vzur`.
   *
   * `null` means the corpus could not be read, rendered as unknown and never
   * as zero. A `use` in here fails the check.
   */
  markdown: MarkdownRef[] | null;
}

/** One markdown line naming the retired declaration, with what it IS. */
export interface MarkdownRef {
  file: string;
  line: number;
  text: string;
  klass: MarkdownClass;
}

export type MarkdownClass = "record" | "generated" | "historical" | "jekyll-data" | "use";

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

/**
 * What a workflow line naming the retired declaration actually is.
 *
 * - `jekyll-data` — `docs/_data/harness.json` is JEKYLL's data file. It merely
 *   shares a basename and **must not be renamed**. Checked FIRST, because a
 *   comment naming it is both a comment and an exemption, and the exemption is
 *   the part a rename needs to hear.
 * - `prose` — the name inside a `#` comment. A rename REWORDS these. Same
 *   reasoning, and the same words, as the TypeScript side's prose class.
 * - `use` — anything else: a step, an argument, a path. **Fails.** A `.yml`
 *   cannot import the constant, so this cannot be fixed the way a call site
 *   is; it is a broken reference to a file that does not exist, which is
 *   worse than a bypass rather than better.
 *
 * Returns `null` when the line does not name the retired declaration at all.
 */
export function classifyWorkflowLine(line: string): "prose" | "jekyll-data" | "use" | null {
  const at = boundedIndexOf(line, RETIRED_DECLARATION);
  if (at === -1) return null;
  if (line.includes("_data")) return "jekyll-data";
  const hash = line.indexOf("#");
  return hash !== -1 && hash < at ? "prose" : "use";
}

/**
 * What a MARKDOWN line naming the retired declaration actually is.
 *
 * Bean `vzur`, turned on once its backlog was cleared and not before — a gate
 * red on arrival teaches nobody anything, and the order was settled in that
 * bean: clear the backlog, then turn the gate on.
 *
 * Markdown needed the same treatment as `.yml` and for a sharper reason.
 * Prose was exempt on the TypeScript side because *"a rename REWORDS these"*,
 * which is sound for a doc comment beside the code it describes. **It is not
 * sound for a skill**, whose whole job is telling a reader where to look: a
 * reversal does not reword anything, it silently inverts what the existing
 * words mean, and 113 live path claims went stale in one commit with nothing
 * reading them for ten days.
 *
 * - `jekyll-data` — `docs/_data/harness.json` is JEKYLL's data file, shares a
 *   basename, and **must not be renamed**. Checked FIRST, as on the YAML side.
 * - `record` — the file sits under a directory DECLARED as a place for
 *   retired or foreign material (`fsh-guts/`, `beans/`, any `library/`).
 *   Correct history, written where history belongs. Derived from the
 *   declarations via {@link historicalPrefixes}, never listed here: a
 *   hand-written second list is the duplicated-fact defect.
 * - `generated` — under a generated reference directory. It FOLLOWS its
 *   source, so failing on it would demand a hand-edit of a file the repo
 *   forbids hand-editing.
 * - `historical` — the passage states a former name **beside** its
 *   replacement. The test is a current declaration filename in the enclosing
 *   PARAGRAPH, not a past-tense word: vocabulary is a guess, a neighbouring
 *   correct filename is evidence.
 *
 *   **The paragraph rather than the line, and that was measured.** The first
 *   version tested the line alone and reported `kg-export.md`'s retirement
 *   note as a stale path — a passage that opens *"That argument ran:"* and
 *   whose previous sentence names `<name>.json`. History is a property of the
 *   passage; a line-local test makes correctly-written history the one thing
 *   the gate cannot recognise, which would push authors to delete the record
 *   rather than mark it.
 * - `use` — anything else. **Fails.** A markdown file cannot import the
 *   constant, so this is a reader sent to a file that does not exist.
 *
 * Returns `null` when the line does not name the retired declaration at all.
 */
export function classifyMarkdownLine(
  rel: string,
  line: string,
  records: string[],
  paragraph = line,
  generated: string[] = [],
): MarkdownClass | null {
  if (boundedIndexOf(line, RETIRED_DECLARATION) === -1) return null;
  if (line.includes("_data")) return "jekyll-data";
  if (records.some((r) => rel.startsWith(r))) return "record";
  if (generated.some((g) => rel.startsWith(g))) return "generated";
  return namesACurrentDeclaration(paragraph) ? "historical" : "use";
}

/**
 * Prefixes holding GENERATED reference markdown, composed rather than typed.
 *
 * Each instance's site root comes from `siteDirFor()` — the declaration — and
 * the two reference trees hang off it, exactly as `gen-skill-docs.ts` and
 * `gen-schema-docs.ts` compose their own output. Writing the paths out here
 * would be a third copy of a fact the declaration already carries, and
 * `check:declared-paths` says so.
 */
function generatedPrefixes(repoRoot: string): string[] {
  const out = new Set<string>();
  for (const instance of instanceRootsIn(repoRoot)) {
    let site: string;
    try {
      site = siteDirFor(instance);
    } catch {
      continue; // an instance whose site root cannot be resolved is not pruned
    }
    const base = relative(repoRoot, join(instance, site)).split("\\").join("/");
    for (const leaf of ["skill-instructions", "skills"]) {
      out.add(`${base}/reference/${leaf}/`);
    }
  }
  return [...out].sort();
}

/**
 * Does this text name a declaration that EXISTS, by either spelling?
 *
 * `<name>.json` — the placeholder a generic skill has to write — or a
 * concrete `<instance>/<instance>.json`. The retired word itself never
 * counts, which is what keeps a paragraph from excusing itself.
 */
function namesACurrentDeclaration(text: string): boolean {
  if (/`<[A-Za-z0-9._-]+>\.(config\.)?json`/.test(text)) return true;
  for (const m of text.matchAll(/`([A-Za-z0-9-]+\/)?([A-Za-z0-9-]+)\.json`/g)) {
    if (m[2] !== "harness") return true;
  }
  return false;
}

/** The blank-line-delimited block containing `i`. */
function paragraphAt(lines: string[], i: number): string {
  let a = i;
  let b = i;
  while (a > 0 && lines[a - 1]!.trim() !== "") a--;
  while (b < lines.length - 1 && lines[b + 1]!.trim() !== "") b++;
  return lines.slice(a, b + 1).join("\n");
}

/**
 * Every markdown line naming the retired declaration, classified.
 *
 * Throws rather than returning `[]` when the corpus cannot be read — the
 * `dh4f` shape, and the caller turns it into `? COULD NOT DETERMINE`.
 */
function scanMarkdown(root: string): MarkdownRef[] {
  const records = historicalPrefixes(root);
  const generated = generatedPrefixes(root);
  const out: MarkdownRef[] = [];
  const skip = new Set([".git", "node_modules"]);
  const walkMd = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        walkMd(abs);
        continue;
      }
      if (!e.name.endsWith(".md")) continue;
      const rel = relative(root, abs).split("\\").join("/");
      const lines = readFileSync(abs, "utf8").split("\n");
      for (const [i, line] of lines.entries()) {
        const klass = classifyMarkdownLine(rel, line, records, paragraphAt(lines, i), generated);
        if (klass) out.push({ file: rel, line: i + 1, text: line.trim(), klass });
      }
    }
  };
  walkMd(root);
  return out;
}

/**
 * Where the retired name starts, as a FILENAME rather than as a substring.
 *
 * The YAML side's answer to the TypeScript side's whole-value rule, and it is
 * load-bearing rather than defensive: **`cat-harness.json` contains
 * `harness.json`.** A bare `indexOf` reports the CURRENT declaration of the
 * instance that owns this gate as a reference to the retired one.
 *
 * That is not hypothetical. It was found by writing the fix for
 * `docs-site.yml` — the corrected comment names
 * `cat-harness/cat-harness.json`, and the naive classifier counted the
 * correction as the defect. The same collision class as `docs/_data`, which
 * this file already had a rule for, one character further left.
 *
 * A match must be bounded on BOTH sides by a non-filename character.
 * `/harness.json` and `` `harness.json` `` match; `cat-harness.json`,
 * `x.harness.json` and **`harness.jsonld`** do not.
 *
 * **The right boundary was missing until 2026-09-21 and the omission was
 * already written down.** The bean that added the left check named
 * `harness.jsonld` in the same sentence as `cat-harness.json`, then guarded
 * only the side it had a failing example for. The markdown scanner (`vzur`)
 * found it on its first run: `serving-renderings.md` names this instance's
 * published rendering, and a left-bounded match read `/harness.jsonld` as a
 * reference to the retired declaration.
 *
 * A prefix test is not a filename test in either direction, and one half of
 * the rule is the half that fails silently — it produces a FINDING rather
 * than a miss, so it looks like the check working.
 */
function boundedIndexOf(line: string, name: string): number {
  let from = 0;
  for (;;) {
    const at = line.indexOf(name, from);
    if (at === -1) return -1;
    const before = at === 0 ? "" : line[at - 1]!;
    const after = line[at + name.length] ?? "";
    if (!/[A-Za-z0-9._-]/.test(before) && !/[A-Za-z0-9-]/.test(after)) return at;
    from = at + 1;
  }
}

/**
 * Every workflow line naming the retired declaration, classified.
 *
 * Throws rather than returning `[]` when the directory cannot be read: an
 * empty list from an unreadable directory is the `dh4f` shape, and the caller
 * turns the throw into the report's `? COULD NOT DETERMINE` rather than into
 * a zero.
 */
function scanWorkflows(root: string): WorkflowRef[] {
  const out: WorkflowRef[] = [];
  const yml = join(root, ".github", "workflows");
  for (const e of readdirSync(yml, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith(".yml") && !e.name.endsWith(".yaml")) continue;
    const lines = readFileSync(join(yml, e.name), "utf8").split("\n");
    for (const [i, line] of lines.entries()) {
      const klass = classifyWorkflowLine(line);
      if (klass) out.push({ file: `.github/workflows/${e.name}`, line: i + 1, text: line.trim(), klass });
    }
  }
  return out;
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
      if (!line.includes(RETIRED_DECLARATION)) continue;

      if (isComment(line)) {
        prose++;
        continue;
      }

      const literal = wholeStringLiteral(line, RETIRED_DECLARATION);
      const template = pathTemplate(line, RETIRED_DECLARATION);
      if (!literal && !template) {
        prose++;
        continue;
      }

      // This gate's own definition of the retired name is the one literal
      // that must stay — it is how the gate finds the others.
      if (rel === THIS_GATE) continue;

      // `docs/_data/harness.json` is JEKYLL's data file and has nothing to do
      // with an instance declaration. It merely shares a basename, which is
      // exactly the kind of collision a bare string match gets wrong.
      if (line.includes("_data")) continue;

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
    counted: { tests, prose },
    workflows: (() => {
      try {
        return scanWorkflows(root);
      } catch {
        return null; // could not determine — never rendered as zero
      }
    })(),
    markdown: (() => {
      try {
        return scanMarkdown(root);
      } catch {
        return null; // could not determine — never rendered as zero
      }
    })(),
  };
}

/**
 * The workflow lines that FAIL.
 *
 * A helper rather than a filter at each call site, because the exit code and
 * the report must agree about what a failure is — and they are written in two
 * places that a later edit could move apart.
 */
export function workflowUses(r: DeclarationFilenameReport): WorkflowRef[] {
  return (r.workflows ?? []).filter((w) => w.klass === "use");
}

/**
 * The markdown lines that FAIL — same contract, same reason, as above.
 */
export function markdownUses(r: DeclarationFilenameReport): MarkdownRef[] {
  return (r.markdown ?? []).filter((m) => m.klass === "use");
}

function formatReport(r: DeclarationFilenameReport): string {
  if (r.filesRead === 0) {
    return "Declaration filename\n  ? EXAMINED NOTHING — no TypeScript found. Not a pass.";
  }
  const out = [`Declaration filename (${r.filesRead} file(s), retired name \`${RETIRED_DECLARATION}\`)`];

  if (r.bypasses.length === 0) {
    out.push("  ✓ no call site names the retired `harness.json`");
  } else {
    for (const b of r.bypasses) {
      out.push(`  ✗ ${b.file}:${b.line} [${b.kind}]`);
      out.push(`      ${b.text}`);
    }
    out.push("");
    out.push("  `harness.json` was EXCISED on 2026-09-21: a declaration is `<name>.config.json`,");
    out.push("  discovered with `findDeclarationFile(dir)` or `declarationPathIn(dir)`. It cannot be");
    out.push("  composed any more — the filename carries the instance's name, so the only way to");
    out.push("  know it is to look.");
  }

  if (r.crossInstance.length > 0) {
    out.push("");
    out.push(`  ~ ${r.crossInstance.length} call site(s) OUTSIDE ${OWNING_INSTANCE} — counted, not failed:`);
    for (const b of r.crossInstance) out.push(`      ${b.file}:${b.line}`);
    out.push("      Using the constant here would be this repo's first cross-instance import;");
    out.push("      a second copy of it would be two constants. That is a boundary decision for");
    out.push("      the split (`vke6`), not for this check — see the module header.");
  }

  const uses = workflowUses(r);
  if (uses.length > 0) {
    out.push("");
    out.push(`  ✗ ${uses.length} workflow line(s) USE the retired declaration — a path to a file that is gone:`);
    for (const w of uses) {
      out.push(`      ${w.file}:${w.line}`);
      out.push(`        ${w.text}`);
    }
    out.push("      A `.yml` cannot import the constant, so this is not fixed the way a call");
    out.push("      site is: name the instance's own `<name>.config.json`, or drop the step.");
  }

  const c = r.counted;
  out.push("");
  out.push("  Counted, not failed — each for a reason in the module header:");
  out.push(`    test fixtures      ${c.tests}  (an open judgement on bean \`jijc\`, not a finding)`);
  out.push(`    prose occurrences  ${c.prose}  (a rename REWORDS these)`);

  if (r.workflows === null) {
    out.push("    workflow lines     ? COULD NOT DETERMINE — not zero");
  } else {
    const by = (k: WorkflowRef["klass"]) => r.workflows!.filter((w) => w.klass === k);
    out.push(`    workflow prose     ${by("prose").length}  (a rename REWORDS these — listed below)`);
    out.push(`    workflow jekyll    ${by("jekyll-data").length}  (\`docs/_data/harness.json\` — must NOT be renamed)`);
    for (const w of by("prose")) out.push(`      · ${w.file}:${w.line}`);
  }

  if (r.markdown === null) {
    out.push("    markdown lines     ? COULD NOT DETERMINE — not zero");
  } else {
    const md = (k: MarkdownClass) => r.markdown!.filter((m) => m.klass === k);
    const bad = md("use");
    out.push(
      `    markdown           ${md("record").length} record, ${md("generated").length} generated, ` +
        `${md("historical").length} historical, ${md("jekyll-data").length} jekyll` +
        (bad.length ? `, ${bad.length} STALE PATH` : ""),
    );
    for (const m of bad) {
      out.push(`      ✗ ${m.file}:${m.line}`);
      out.push(`          ${m.text.slice(0, 96)}`);
    }
    if (bad.length) {
      out.push("      A markdown file cannot import the constant, so this is not a bypass —");
      out.push("      it is a reader sent to a file that does not exist. Name the current");
      out.push("      declaration: `<name>.json`, or the concrete `<instance>/<instance>.json`.");
    }
  }
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
  // `workflows === null` is UNKNOWN, not clean: exit 2, the same code the
  // catch above uses, so a directory that cannot be read never reads as a pass.
  if (report.workflows === null || report.markdown === null) process.exit(2);
  process.exit(
    report.bypasses.length ||
      workflowUses(report).length ||
      markdownUses(report).length ||
      report.filesRead === 0
      ? 1
      : 0,
  );
}
