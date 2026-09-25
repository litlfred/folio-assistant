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

interface Declaration {
  _comment: string;
  /** check name -> what verifies the artefact for a consumer, or an explicit none. */
  verified: Record<string, string>;
  /** check name -> why nothing does. A REASON, never an empty string. */
  none: Record<string, string>;
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
}

export function report(checks: ArtefactCheck[], d: Declaration): Report {
  const names = new Set(checks.map((c) => c.check));
  const declared = new Set([...Object.keys(d.verified), ...Object.keys(d.none)]);
  return {
    checks,
    undeclared: checks.map((c) => c.check).filter((n) => !declared.has(n)),
    reasonless: Object.entries(d.none)
      .filter(([, why]) => String(why ?? "").trim() === "")
      .map(([n]) => n),
    stale: [...declared].filter((n) => !names.has(n)),
  };
}

if (import.meta.main) {
  const checks = deriveArtefactChecks();
  const d = readDeclaration();

  if (process.argv.includes("--write-baseline")) {
    const existing = readDeclaration();
    const undeclared = report(checks, existing).undeclared;
    const none: Record<string, string> = { ...existing.none };
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
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`  ✓ declaration written — ${Object.keys(none).length} awaiting assessment`);
    process.exit(0);
  }

  const r = report(checks, d);
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

  if (!bad) {
    const assessed = Object.keys(d.verified).length;
    console.log(
      `  ✓ every artefact check is declared — ${assessed} with a consumer-level verification, ` +
        `${Object.keys(d.none).length} without one and saying why`,
    );
    process.exit(0);
  }
  process.exit(1);
}
