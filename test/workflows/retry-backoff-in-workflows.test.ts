/**
 * Every retry loop in every workflow uses the ONE backoff. Bean `06kg`.
 *
 * ## Why this file exists rather than a note in the skill
 *
 * `cat-harness/skills/conduct/conduct-core/retry-backoff.md` records an owner rule —
 * *"as rule, use logarithmic fall-off on all errors. core best practice."* —
 * and `src/core/retry.ts` is that rule as code, covered by `retry.test.ts`.
 *
 * That was true on 2026-09-20 while **all four** retry loops in
 * `feature-staging.yml` slept `$((attempt * 5))`: 5 s then 10 s, linear and
 * unjittered. The skill's own §"Jitter is not decoration here" names that
 * schedule as the thundering herd, on `gh-pages` — the ref it cites as the
 * contended one — written by the same concurrent sessions it says contend on
 * it (four pushing inside ninety minutes, bean `bm6d`).
 *
 * **Nothing noticed, and could not have.** The rule had an implementation and
 * a test in TypeScript and four call sites in bash that no check read;
 * `retry.ts` passing its suite said nothing whatsoever about a workflow. That
 * is the `dh4f` shape — a consumer scans nothing and the absence reads as
 * compliance — and it was found only because somebody read a sibling's open
 * PR. A rule enforced by a person happening to look is not enforced.
 *
 * ## What is pinned
 *
 * The PROPERTY — *a loop that retries does not compute its own wait* — not
 * the spelling of any one line. A loop reaching the shared implementation some
 * other way passes; one that hand-rolls a schedule does not, however it is
 * written.
 *
 * The vacuity guard matters as much as the assertions. If the discovery ever
 * returns no workflows, or no loops, this file would pass by finding nothing
 * to object to — `check-declared-assets` shipped exactly that (bean `6tkl`,
 * "0 across 0 instances, exit 0"). So the counts are asserted first.
 *
 * Moved here from cat-harness's `scripts/tests/retry-backoff-in-workflows.test.ts`
 * (owner's ruling 2026-10-09, litlfred/folio-assistant#2521, ruling 1(c)): the
 * discovery reads this repository's `.github/workflows/`. The half that pins
 * the shared implementation, `backoff-sleep.ts`, stays beside it in cat-harness.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

/** This index repository's own workflows. */
const WORKFLOWS = join(resolve(import.meta.dir, "..", ".."), ".github", "workflows");

const FILES = readdirSync(WORKFLOWS)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .map((f) => ({ name: f, text: readFileSync(join(WORKFLOWS, f), "utf-8") }));

/**
 * Comment lines are stripped before ANY matching.
 *
 * A comment necessarily names the thing it replaced — the four sites here each
 * explain that they used to be `sleep $((attempt * 5))` — so a test that reads
 * comments measures the explanation rather than the code. This exact trap cost
 * a red run on `staging-replaces-preview.test.ts`, whose warning line spelled
 * the path the assertion forbade.
 */
function code(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
}

/**
 * One entry per retry loop — `for attempt …`, or `while … attempt …` (the
 * stage job's since #1956, whose lost races spend no attempt) — with the body
 * up to its `done`. Both shapes are discovered so a loop cannot leave this
 * check by changing keyword.
 */
function retryLoops(text: string): string[] {
  const out: string[] = [];
  const lines = code(text).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(/^(\s*)(?:for\s+attempt\s+in\b|while\b[^\n]*\$\{?attempt\b)/);
    if (!m) continue;
    const indent = m[1]!.length;
    const body: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j]!;
      body.push(l);
      if (new RegExp(`^\\s{${indent}}done\\b`).test(l)) break;
    }
    out.push(body.join("\n"));
  }
  return out;
}

const ALL_LOOPS = FILES.flatMap((f) => retryLoops(f.text).map((body) => ({ file: f.name, body })));

describe("the discovery found something to check — bean `6tkl`'s lesson", () => {
  test("there are workflows to read", () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  test("and retry loops in them", () => {
    // If this ever hits zero the assertions below become vacuous and this file
    // would report clean over nothing. Four were known on 2026-09-20; the
    // assertion is `> 0` rather than `= 4`, because a count is a proxy and
    // adding a correct loop must not be a failure.
    expect(ALL_LOOPS.length).toBeGreaterThan(0);
  });
});

describe("no retry loop computes its own wait — bean `06kg`", () => {
  test("every loop that sleeps reaches the shared implementation", () => {
    const offenders = ALL_LOOPS.filter((l) => !l.body.includes("backoff-sleep.ts"))
      .filter((l) => /\bsleep\b/.test(l.body))
      .map((l) => `${l.file}: ${l.body.match(/^.*\bsleep\b.*$/m)?.[0].trim()}`);
    expect(offenders).toEqual([]);
  });

  test("no workflow hand-rolls a LINEAR schedule", () => {
    // The specific wrong answer all four sites reached independently, which is
    // what makes it worth naming rather than leaving to the general rule: a
    // multiple of the attempt number is linear, and linear plus no jitter is
    // the herd.
    const offenders = FILES.filter((f) => /\bsleep\s+\$\(\(\s*attempt\s*[*+]/.test(code(f.text))).map(
      (f) => f.name,
    );
    expect(offenders).toEqual([]);
  });

  test("no workflow hand-rolls jitter either — one implementation, not two", () => {
    // `$RANDOM` in a wait is somebody re-deriving the policy rather than
    // calling it. The point of `06kg` is not "add jitter", it is "the rule
    // lives in one place" — `retry-backoff.md`: *a retry policy invented per
    // call site is a policy nobody can change in one place*.
    const offenders = FILES.filter((f) => /\bsleep\b[^\n]*\$RANDOM/.test(code(f.text))).map((f) => f.name);
    expect(offenders).toEqual([]);
  });
});
