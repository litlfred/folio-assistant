/**
 * One staging deploy is ONE commit on `gh-pages`. Bean `bm6d`.
 *
 * `feature-staging.yml` used to push twice per run about ten seconds apart —
 * the payload, then the render-log entry. **GitHub Pages starts a build on the
 * first and the second cancels it.** Measured 2026-09-20: 64 commits to
 * `gh-pages` in 90 minutes from four concurrent sessions, and **6 of the last
 * 10 `pages build and deployment` runs `cancelled`**, in an exact pattern
 * rather than a random one. Every first build was wasted.
 *
 * ## Why a test rather than a comment
 *
 * A `cancelled` deployment is red nowhere. `check:ci-health` reads workflow
 * state on the DEFAULT branch; these runs are on `gh-pages`, bot-triggered by
 * `github-pages[bot]` with event `dynamic`, so no report in this repository
 * covers them. That is the `xom7` shape — a thing failing repeatedly with
 * nothing saying so — and it is exactly the case where the regression has to
 * be caught in the file rather than observed in the outcome.
 *
 * Re-adding a second push would be free and invisible. It is neither now.
 *
 * ## What is pinned, and what is deliberately not
 *
 * The property, not the wording: *how many steps of the `stage` job write to
 * `gh-pages`*, and *what a single such commit must contain*. An implementation
 * that reaches one commit some other way passes; one that splits the write in
 * two does not, however it is spelled.
 *
 * The cleanup and retained paths are pinned from the other side. Bean `bm6d`
 * warned that the split might be load-bearing — *"a removal writes a log entry
 * with no payload"* — so those two are asserted to still commit their entry,
 * and the removal to still carry its payload and its record together.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { repoRootFor } from "../../schemas/cat-harness.js";

// Same resolution `workflow-yaml.test.ts` uses: the workflows live at the
// REPOSITORY root, one level above this instance.
const FILE = join(
  repoRootFor(resolve(import.meta.dir, "..", "..")),
  ".github", "workflows", "feature-staging.yml",
);
const YML = readFileSync(FILE, "utf-8");

/** The `run:` bodies and `uses:` of one job, by the job's key in the file. */
function jobBlock(name: string): string {
  // Jobs are two-space indented under `jobs:`; a block runs to the next one.
  const re = new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  [a-z][\\w-]*:\\n|$)`);
  const m = YML.match(re);
  if (!m) throw new Error(`no job '${name}' in feature-staging.yml`);
  return m[1];
}

/** Steps of a job that WRITE to gh-pages, by either mechanism. */
function ghPagesWriters(block: string): string[] {
  const steps = block.split(/\n      - (?=name:|uses:)/).slice(1);
  return steps.filter(
    (s) => /git\s+(-C\s+\S+\s+)?push\s+origin\s+gh-pages/.test(s) || /peaceiris\/actions-gh-pages/.test(s),
  );
}

describe("a staging deploy is one commit — bean `bm6d`", () => {
  const stage = jobBlock("stage");

  test("exactly ONE step of the stage job writes to gh-pages", () => {
    // The whole bean in one assertion. Two writers is two Pages builds and the
    // first is always cancelled.
    const writers = ghPagesWriters(stage);
    expect(writers.length).toBe(1);
  });

  test("and it commits the payload and the record TOGETHER", () => {
    const [writer] = ghPagesWriters(stage);
    // Both paths in one `git add`, which is what makes it one commit. The
    // record must sit at the ROOT `_render-log/`, never inside the slug
    // directory a cleanup removes.
    expect(writer).toMatch(/git -C pages add -A "STAGING\/\$STAGING_SLUG" _render-log/);
    expect(writer).not.toMatch(/STAGING\/\$STAGING_SLUG\/_render-log/);
  });

  test("the peaceiris action is gone from the stage job — it cannot reach the root", () => {
    // Not style. `destination_dir` confines the action to `STAGING/<slug>/`,
    // so as long as it deploys the payload the entry needs a second push.
    expect(stage).not.toMatch(/peaceiris\/actions-gh-pages/);
  });

  test("the contended-ref retry survives — three attempts, rebasing between", () => {
    // `gh-pages` is the most contended ref here and a queue does not help: a
    // PENDING job is cancelled by the next arrival rather than waiting.
    const [writer] = ghPagesWriters(stage);
    expect(writer).toMatch(/for attempt in 1 2 3; do/);
    expect(writer).toMatch(/git -C pages pull --rebase origin gh-pages/);
  });

  test("a failed deploy still fails the job — a lost preview stays visible", () => {
    const [writer] = ghPagesWriters(stage);
    expect(writer).toMatch(/::error::could not deploy the staging preview after 3 attempts/);
    expect(writer).toMatch(/exit 1/);
  });
});

describe("the paths bm6d warned might be load-bearing still work", () => {
  test("the cleanup removal carries its payload and its record in ONE commit", () => {
    // `bm6d`: "The cleanup path still records a removal with its reason (it
    // has no payload to coalesce with, so it must keep working)."
    const cleanup = jobBlock("cleanup-dispatch");
    expect(cleanup).toMatch(/git add -A "STAGING\/\$CLEANUP_SLUG" _render-log/);
    expect(cleanup).toMatch(/--event removed/);
    expect(cleanup).toMatch(/--reason /);
  });

  test("the retained path logs with NO payload, which is the case that must not be coalesced", () => {
    // A PR closed whose preview was kept: there is nothing to ride with, so
    // this one legitimately commits the entry alone.
    const cleanup = jobBlock("cleanup");
    expect(cleanup).toMatch(/--event retained/);
    expect(cleanup).toMatch(/git -C pages add -A _render-log/);
  });
});
