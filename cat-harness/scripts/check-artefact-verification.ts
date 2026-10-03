/**
 * Currency is not validity — and 42 checks answer only the first question.
 *
 * Bean `jfr6`. Every generated artefact in this repository has a `--check`
 * mode, and every one of them asks: *would the generator write something
 * different from what is committed?* That is **currency**. It is not the
 * question a consumer asks, which is: *does this artefact work?*
 *
 * ## The two are measurably different, and it has already cost six pages
 *
 * `library:viz:check` was **green** while the page it generated could not
 * run. The committed bytes were exactly what the generator would write; the
 * generator was writing JavaScript that did not parse. Every link resolved,
 * the file existed, the size was plausible, the site build was green — and
 * five of twelve navbar tiles sat on *"loading…"* forever (PR #805).
 *
 * `generated-viewer-scripts.test.ts` closed that for inline scripts. **It is
 * one instance of the gap, not the gap.** A JSON that parses is not a JSON
 * that validates; a `.jsonld` that validates is not one whose `@context`
 * resolves; a `.bpmn` that is well-formed is not one the engine loads.
 *
 * ## What this derives, and what it refuses to claim
 *
 * The inventory is **derived from `package.json`**, never listed here —
 * `tyyc`'s lesson: a hand-maintained list is edited by whoever remembers, and
 * the symptom of forgetting is invisible. A check counts as generated-artefact
 * currency when its script is invoked with `--check`.
 *
 * Each is then classified by reading its source, and the classification is
 * deliberately weak in the middle:
 *
 * | class | what it means |
 * |---|---|
 * | **no-parsing** | the script contains no parse or validate call at all, so it CANNOT be checking its artefact's validity |
 * | **undetermined** | it parses something — which does NOT establish that it validates its OUTPUT. It may be parsing its input |
 *
 * That middle class is not "validated", and the distinction is the whole
 * point. A heuristic that cannot tell input-parsing from output-validation
 * must not report the difference as if it could — that is the over-claim this
 * bean exists to find, and writing it here would be committing it.
 *
 * Measured 2026-09-22: **42** generated-artefact checks, **18** with no
 * parsing at all.
 *
 * ## The declaration
 *
 * `artefact-verification.json` says, per check, what verifies the artefact for
 * its CONSUMER — or that nothing does, with a reason. Three states, and
 * **undeclared is the finding**: "nobody has said" is not "nothing to check".
 *
 * @module scripts/check-artefact-verification
 * @covers qa
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const DECL = join(import.meta.dir, "artefact-verification.json");

/**
 * Calls that mean the script parses or validates SOMETHING.
 *
 * Their absence is informative; their presence is not. A script with none of
 * these cannot be validating its output. A script with some of them may be
 * parsing its own input, and this cannot tell the difference.
 */
const PARSES = /new Function|JSON\.parse|\.safeParse|\bparse\w*\(|validate|Schema\./;

export type Classification = "no-parsing" | "undetermined";

export interface ArtefactCheck {
  /** The npm script name, e.g. `library:viz:check`. */
  check: string;
  /** The `.ts` it invokes, repo-relative. */
  script: string;
  classification: Classification;
}

/** Every check that runs a generator in `--check` mode. Derived, never listed. */
export function deriveArtefactChecks(root: string = ROOT): ArtefactCheck[] {
  const scripts = (JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};
  const out: ArtefactCheck[] = [];
  for (const [check, cmd] of Object.entries(scripts)) {
    if (!cmd.includes("--check")) continue;
    if (!check.endsWith(":check") && !check.startsWith("check:")) continue;
    const m = /([a-zA-Z0-9/._-]+\.ts)/.exec(cmd);
    if (!m) continue;
    const script = m[1];
    const abs = join(root, script);
    if (!existsSync(abs)) continue;
    out.push({
      check,
      script,
      classification: PARSES.test(readFileSync(abs, "utf-8")) ? "undetermined" : "no-parsing",
    });
  }
  return out.sort((a, b) => a.check.localeCompare(b.check));
}

/**
 * A CALL of the `qa-results/v1` writer — not its definition in `qa-results.ts`.
 * Assembled from two strings so this file's own source does not match it.
 */
const WRITES_QA_RESULT = new RegExp("(?<!function )\\bwrite" + "QaResult\\(");

/**
 * QA-sidecar GENERATORS that no `--check` invocation covers (bean `v556`).
 *
 * The inventory above is the `--check` scripts, so an artefact whose generator
 * has no `--check` at all could never be in it: `kg:export` wrote two committed
 * `qa-results/v1` sidecars carrying three hashes between them and this gate
 * could not see it — "cannot be asked" rather than "nobody has said". This is
 * the second, independent inventory that closes that shape for the family the
 * bean found it in.
 *
 * Derived the same way, from `package.json`: every script a command runs whose
 * source CALLS `writeQaResult` — the one writer of `qa-results/v1` sidecars —
 * and which no command runs with `--check`. Each must be declared in
 * `unchecked` with a reason, or it is a finding.
 *
 * Deliberately limited to `writeQaResult` callers. "Writes a file" would sweep
 * in every generator whose output is gitignored or printed, and a list that
 * noisy is one nobody reads.
 */
export function deriveUncheckedGenerators(root: string = ROOT): string[] {
  const scripts = (JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};
  const referenced = new Map<string, boolean>();
  for (const cmd of Object.values(scripts)) {
    for (const m of cmd.matchAll(/([a-zA-Z0-9/._-]+\.ts)\b/g)) {
      const script = m[1]!;
      referenced.set(script, (referenced.get(script) ?? false) || cmd.includes("--check"));
    }
  }
  const out: string[] = [];
  for (const [script, checked] of referenced) {
    if (checked) continue;
    const abs = join(root, script);
    if (!existsSync(abs)) continue;
    // A CALL, not the definition in `qa-results.ts`.
    if (WRITES_QA_RESULT.test(readFileSync(abs, "utf-8"))) out.push(script);
  }
  return out.sort();
}

interface Declaration {
  _comment: string;
  /** check name -> what verifies the artefact for a consumer, or an explicit none. */
  verified: Record<string, string>;
  /** check name -> why nothing does. A REASON, never an empty string. */
  none: Record<string, string>;
  /**
   * QA-sidecar generator (repo-relative script) with no `--check` -> why it
   * needs none, or what checks its sidecar instead. Bean `v556`.
   */
  unchecked?: Record<string, string>;
}

function readDeclaration(): Declaration {
  if (!existsSync(DECL)) return { _comment: "", verified: {}, none: {} };
  return JSON.parse(readFileSync(DECL, "utf-8")) as Declaration;
}

export interface Report {
  checks: ArtefactCheck[];
  undeclared: string[];
  /** A `none` entry with no reason is worse than no entry: it looks decided. */
  reasonless: string[];
  /** A declaration for a check that no longer exists — the list may only shrink. */
  stale: string[];
  /** QA-sidecar generators with no `--check` and no `unchecked` declaration (bean `v556`). */
  uncheckedUndeclared: string[];
  /** An `unchecked` entry naming a script that now HAS a `--check`, or is gone. */
  uncheckedStale: string[];
}

export function report(checks: ArtefactCheck[], d: Declaration, unchecked: string[] = []): Report {
  const names = new Set(checks.map((c) => c.check));
  const declared = new Set([...Object.keys(d.verified), ...Object.keys(d.none)]);
  return {
    checks,
    undeclared: checks.map((c) => c.check).filter((n) => !declared.has(n)),
    reasonless: [...Object.entries(d.none), ...Object.entries(d.unchecked ?? {})]
      .filter(([, why]) => String(why ?? "").trim() === "")
      .map(([n]) => n),
    stale: [...declared].filter((n) => !names.has(n)),
    uncheckedUndeclared: unchecked.filter((g) => !Object.hasOwn(d.unchecked ?? {}, g)),
    uncheckedStale: Object.keys(d.unchecked ?? {}).filter((g) => !unchecked.includes(g)),
  };
}

if (import.meta.main) {
  const checks = deriveArtefactChecks();
  const generators = deriveUncheckedGenerators();
  const d = readDeclaration();

  if (process.argv.includes("--write-baseline")) {
    const existing = readDeclaration();
    const base = report(checks, existing, generators);
    const undeclared = base.undeclared;
    const none: Record<string, string> = { ...existing.none };
    const unchecked: Record<string, string> = { ...(existing.unchecked ?? {}) };
    for (const g of base.uncheckedUndeclared) {
      unchecked[g] =
        "NOT YET ASSESSED — seeded by --write-baseline so the gate fails on a NEW unchecked generator " +
        "rather than on the backlog. Give it a --check, or say what checks its sidecar instead.";
    }
    for (const n of undeclared) {
      none[n] =
        "NOT YET ASSESSED — seeded by --write-baseline so the gate fails on a NEW artefact kind " +
        "rather than on the backlog. Replace with what verifies this artefact for its consumer, " +
        "or with the reason nothing does.";
    }
    writeFileSync(
      DECL,
      JSON.stringify(
        {
          _comment:
            "Per generated-artefact check: what verifies the artefact for its CONSUMER, as opposed to " +
            "verifying that the committed copy is current. The two are different questions and the " +
            "difference has cost six pages — library:viz:check was green while the page it generated " +
            "could not run (PR #805). The check list is DERIVED from package.json and never listed here. " +
            "Undeclared is a finding: 'nobody has said' is not 'nothing to check'. A `none` entry needs a " +
            "REASON; an empty one looks decided and is not. This file may only SHRINK as entries move from " +
            "`none` to `verified`; a declaration for a check that no longer exists is reported stale.",
          verified: existing.verified,
          none,
          unchecked,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`  ✓ declaration written — ${Object.keys(none).length} awaiting assessment`);
    process.exit(0);
  }

  const r = report(checks, d, generators);
  const noParse = checks.filter((c) => c.classification === "no-parsing").length;
  console.log(
    `Artefact verification (${checks.length} generated-artefact check(s); ` +
      `${noParse} contain no parsing at all, so cannot be validating their output)`,
  );

  let bad = false;
  for (const n of r.undeclared) {
    console.log(`  ✗ NEW artefact check with no verification declaration: ${n}`);
    console.log("      Say what verifies it for a CONSUMER, or that nothing does and why.");
    bad = true;
  }
  for (const n of r.reasonless) {
    console.log(`  ✗ ${n}: declared \`none\` with no reason — that looks decided and is not`);
    bad = true;
  }
  for (const n of r.stale) {
    console.log(`  ✗ stale declaration, remove it: ${n}`);
    bad = true;
  }
  // Bean `v556`: the generators the `--check` inventory above cannot contain.
  for (const g of r.uncheckedUndeclared) {
    console.log(`  ✗ ${g} writes a committed qa-results/v1 sidecar and NO command runs it with --check`);
    console.log("      Give it a --check (so it enters the inventory above), or declare it under `unchecked` with why.");
    bad = true;
  }
  for (const g of r.uncheckedStale) {
    console.log(`  ✗ stale \`unchecked\` declaration, remove it: ${g} (it now has a --check, or is gone)`);
    bad = true;
  }

  if (!bad) {
    const assessed = Object.keys(d.verified).length;
    console.log(
      `  ✓ every artefact check is declared — ${assessed} with a consumer-level verification, ` +
        `${Object.keys(d.none).length} without one and saying why; ` +
        `${generators.length} QA-sidecar generator(s) with no --check, each declared`,
    );
    process.exit(0);
  }
  process.exit(1);
}
