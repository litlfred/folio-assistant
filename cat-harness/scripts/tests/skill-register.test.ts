/**
 * The registration chain is declared, reachable, and not silently shortened.
 *
 * Bean `v625`. These do NOT re-measure which artefacts a skill stales — that
 * needs a throwaway skill and per-check isolated runs, which is a session's
 * work rather than a unit test. They guard the three ways the declaration
 * could rot between such measurements.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { STEPS } from "../skill-register.js";

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
