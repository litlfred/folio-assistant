/**
 * The registration chain is declared, reachable, and not silently shortened.
 *
 * Bean `v625`. These do NOT re-measure which artefacts a skill stales — that
 * needs a throwaway skill and per-check isolated runs, which is a session's
 * work rather than a unit test. They guard the three ways the declaration
 * could rot between such measurements.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { parseFlags, STEPS, writeReport } from "../skill-register.js";

const ROOT = join(import.meta.dir, "..", "..", "..");
const scripts = (): Record<string, string> =>
  JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts;

/** Every token that must resolve to either an npm script or a file on disk. */
function head(args: readonly string[]): string {
  return args[0]!;
}

test("the chain is not empty", () => {
  // A runner over an empty list exits 0 and reads as a clean sweep — the
  // vacuity failure `gates.ts` names. `skill-register.ts` guards this at
  // runtime too; this catches it in CI rather than on somebody's next skill.
  expect(STEPS.length).toBeGreaterThan(0);
});

describe("every step resolves to something runnable", () => {
  for (const s of STEPS) {
    test(`\`${s.write.join(" ")}\` exists`, () => {
      const t = head(s.write);
      const ok = t in scripts() || existsSync(join(ROOT, t));
      expect(
        ok,
        `\`${t}\` is neither an npm script nor a file. A step that cannot run is ` +
          `worse than a missing step: the command reports it, exits non-zero, and ` +
          `the author cannot tell a broken chain from their own mistake.`,
      ).toBe(true);
    });

    test(`\`${s.verify.join(" ")}\` exists`, () => {
      const t = head(s.verify);
      const ok = t in scripts() || existsSync(join(ROOT, t));
      expect(ok, `verify target \`${t}\` is neither an npm script nor a file.`).toBe(true);
    });
  }
});

test("each step carries a reason, so the list can be re-derived rather than trusted", () => {
  // The list is hand-maintained and was WRONG three times before it was
  // measured. A bare entry invites the next person to trust it; an entry that
  // says what it clears invites them to check.
  for (const s of STEPS) {
    expect(s.because.length, `\`${s.write.join(" ")}\` has no reason recorded`).toBeGreaterThan(10);
  }
});

test("the two steps `gates` MASKS are still in the chain", () => {
  // The regression that would be invisible. `kg:audit:check` and
  // `kg:detangle:check` are green inside `bun run gates` on a tree where they
  // are red on their own, because `bun test` runs those writers first (bean
  // `ymsu`). So anyone re-deriving this chain THROUGH gates will conclude they
  // do not belong and delete them — and the deletion will look correct.
  const writers = STEPS.map((s) => s.write.join(" "));
  for (const masked of ["kg:audit", "kg:detangle"]) {
    expect(
      writers,
      `\`${masked}\` is missing. It IS staled by adding a skill — measured red on ` +
        `its own against a tree where \`bun run gates\` reported it green, because ` +
        `\`bun test\` runs the writer first. Do not re-derive this chain through ` +
        `gates; run the one check in isolation.`,
    ).toContain(masked);
  }
});

test("the four that adding a skill does NOT stale are absent", () => {
  // The other direction, and the one that actually happened: these were
  // asserted to be in the chain three times, in a bean and two commit
  // messages, on the strength of having gone red in the same sessions. They
  // were measured red for unrelated reasons. Re-adding them is not harmless —
  // it is four extra generators an author must run, three of which touch the
  // docs site, so the command would dirty trees it has no business touching.
  const writers = STEPS.map((s) => s.write.join(" "));
  for (const notInChain of ["gen-docs-pages", "docs:harness", "translation:index", "state:visualizer"]) {
    expect(
      writers.some((w) => w.includes(notInChain)),
      `\`${notInChain}\` is in the chain, and measurement says it should not be: ` +
        `adding a skill does not stale it. If you measured otherwise, put the ` +
        `isolated red-then-green run in the docblock — do not add it from memory ` +
        `of a session where other things were also stale.`,
    ).toBe(false);
  }
});

/**
 * The reporting surface — flags, the sidecar, and the one invariant the sidecar
 * exists for.
 *
 * These are unit tests over pure functions, deliberately: the command's own
 * behaviour needs five real `--check` runs over a live corpus, which is a
 * session's work. What CAN be pinned cheaply is that the report says which
 * steps RAN, because that is the single property distinguishing it from a
 * printed verdict.
 */
describe("flags", () => {
  test("every flag is off by default, so a bare run regenerates and reports", () => {
    const f = parseFlags([]);
    expect(f).toEqual({ check: false, dryRun: false, json: false, noReport: false });
  });

  test("each flag is recognised on its own", () => {
    expect(parseFlags(["--check"]).check).toBe(true);
    expect(parseFlags(["--dry-run"]).dryRun).toBe(true);
    expect(parseFlags(["--json"]).json).toBe(true);
    expect(parseFlags(["--no-report"]).noReport).toBe(true);
  });

  test("an unrelated argument sets nothing", () => {
    // `bun run` passes its own arguments through, and a flag parser that
    // matched loosely would turn `--help` into a silent `--check`.
    expect(parseFlags(["--help", "somefile.md"])).toEqual({
      check: false,
      dryRun: false,
      json: false,
      noReport: false,
    });
  });
});

describe("the report", () => {
  test("lands under the INSTANCE root, not the caller's cwd", () => {
    // The defect this pins, measured 2026-09-26: `writeReport` was called with
    // `process.cwd()`, so running the command from the repository root wrote
    // `test/results/skill-register.qa-results.json` — a fresh top-level
    // directory no instance declares and no sweep reads. `writeQaResult`
    // composes `<root>/test/results/`, so the root must be the instance's.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-report-"));
    try {
      const at = writeReport(dir, [{ verify: "kg:detangle:check", because: "x", ran: true, current: true }]);
      expect(at).toBe(join(dir, "test", "results", "skill-register.qa-results.json"));
      expect(existsSync(at)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("`ran` is present on EVERY entry, so absence never carries the fact", () => {
    // The invariant. A sidecar whose entries omit `ran` when nothing ran makes
    // "listed but not run" and "run and clean" the same bytes — which is the
    // confusion the sidecar exists to prevent, reproduced inside it. A
    // `--dry-run` report is the case that would tempt the omission.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-ran-"));
    try {
      const at = writeReport(dir, STEPS.map((s) => ({ verify: s.verify.join(" "), because: s.because, ran: false })));
      const entries = JSON.parse(readFileSync(at, "utf8")).families["registration-chain"].entries;
      expect(entries.length).toBe(STEPS.length);
      for (const e of entries) {
        expect(Object.hasOwn(e, "ran"), `an entry omits \`ran\`: ${JSON.stringify(e)}`).toBe(true);
        expect(e.ran).toBe(false);
        // `current` is absent precisely when nothing ran — a step that did not
        // run has no verdict, and emitting `current: false` would report it as
        // measured and red.
        expect(Object.hasOwn(e, "current")).toBe(false);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a red verdict is recorded rather than only printed", () => {
    // A sidecar written only on success cannot tell "clean" from "never ran",
    // so the report is written BEFORE the exit branches. This pins that a
    // failing step reaches the file at all.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-red-"));
    try {
      const at = writeReport(dir, [
        { verify: "kg:detangle:check", because: "the skills subgraph gains a node", ran: true, current: false },
      ]);
      const fam = JSON.parse(readFileSync(at, "utf8")).families["registration-chain"];
      expect(fam.entries[0].ran).toBe(true);
      expect(fam.entries[0].current).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
