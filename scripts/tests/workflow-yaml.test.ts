/**
 * Every GitHub Actions workflow must parse.
 *
 * `qa-sweep.yml` and `witness-refresh.yml` had been unparseable, and the way
 * that failure presents is the reason this test exists rather than a CI job.
 * GitHub cannot read the `on:` triggers of a file it cannot parse, so instead
 * of not running, the workflow registered a **startup failure against every
 * push** — a run with zero jobs, `conclusion: failure`, and `name` falling
 * back to the file path instead of the workflow's declared `name:`. Thirty
 * such runs sat on one branch. Fetching their logs returns "No failed jobs
 * found", so the failure carries no diagnostic at all.
 *
 * Both had the same cause: content dedented to column 0 inside a `run: |`
 * block scalar. A block scalar ends at the first line indented less than its
 * base, so YAML read the shell body's continuation lines as new mapping keys.
 * In one file that was an embedded `python3 -c "…"` program (since extracted
 * to `scripts/ci/qa-axis-summary.py`); in the other, a `git commit -m` message
 * body. Neither is visible as an error in an editor, and neither shows up in
 * `bun test`, `tsc`, or `eslint` — which is exactly why it survived.
 *
 * A parse check is cheap and total. It runs here, before push, rather than
 * being discovered as an uninformative red X afterwards.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const WORKFLOW_DIR = join(import.meta.dir, "..", "..", ".github", "workflows");

const files = readdirSync(WORKFLOW_DIR)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .sort();

describe("GitHub Actions workflows", () => {
  test("there are workflows to check", () => {
    // Guard against the check silently covering nothing if the directory
    // moves — a green run over zero files reads as coverage that is not there.
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    test(`${file} parses`, () => {
      const src = readFileSync(join(WORKFLOW_DIR, file), "utf-8");
      expect(() => Bun.YAML.parse(src)).not.toThrow();
    });

    test(`${file} declares a name and triggers`, () => {
      // A workflow whose `name:` is missing is reported by file path in the
      // Actions UI — indistinguishable at a glance from the startup-failure
      // presentation above. `on:` missing means it can never run.
      const doc = Bun.YAML.parse(readFileSync(join(WORKFLOW_DIR, file), "utf-8")) as Record<
        string,
        unknown
      >;
      expect(typeof doc?.name, `${file} has no name:`).toBe("string");
      // YAML 1.1 reads a bare `on` as the boolean true; either key is fine.
      const triggers = doc?.on ?? (doc as Record<string, unknown>)?.["true"];
      expect(triggers, `${file} has no on: triggers`).toBeDefined();
    });
  }

  /**
   * `code-quality-gates.yml` runs `bun test`, `bun run lint` and
   * `tsc --noEmit`. Nothing else in this repo does — of 33 workflows, only
   * `atomic-mass-gen-check` and `docs-site` auto-trigger, and neither touches
   * TypeScript.
   *
   * It was written `workflow_dispatch`-only, in a commit whose own message
   * said "no folio-assistant workflow triggers on `pull_request`" and "a
   * ratchet only works if something runs it". So every gate landed since —
   * the suite at 0 failures, eslint with every rule at `error`, `tsc` over all
   * five trees — was enforced by nothing at all, behind a workflow whose
   * header claimed it was the enforcement.
   *
   * A dispatch-only gate is indistinguishable from a working one until you
   * look at the Actions tab and find no runs. This is the check that looks.
   */
  test("code-quality-gates.yml actually triggers on pull_request", () => {
    const doc = Bun.YAML.parse(
      readFileSync(join(WORKFLOW_DIR, "code-quality-gates.yml"), "utf-8"),
    ) as Record<string, unknown>;
    const triggers = (doc.on ?? doc["true"]) as Record<string, unknown>;
    expect(Object.keys(triggers).sort()).toContain("pull_request");
  });

  test("code-quality-gates.yml has no paths: filter on pull_request", () => {
    // A `paths:` filter is how a whole-repo gate quietly stops covering the
    // file that broke it — and, because GitHub reports a filtered-out required
    // check as never having run, how a branch protection rule blocks forever.
    const doc = Bun.YAML.parse(
      readFileSync(join(WORKFLOW_DIR, "code-quality-gates.yml"), "utf-8"),
    ) as Record<string, unknown>;
    const triggers = (doc.on ?? doc["true"]) as Record<string, unknown>;
    const pr = triggers.pull_request as Record<string, unknown> | null;
    expect(pr == null || !("paths" in pr)).toBe(true);
  });

  test("the TypeScript gate runs all three checks", () => {
    // Each is a separate ratchet; a gate that runs two of the three reads as
    // full coverage in the Actions UI.
    const doc = Bun.YAML.parse(
      readFileSync(join(WORKFLOW_DIR, "code-quality-gates.yml"), "utf-8"),
    ) as { jobs: Record<string, { steps: Array<{ run?: string }> }> };
    const runs = (doc.jobs.typescript?.steps ?? []).map((s) => s.run ?? "").join("\n");
    expect(runs).toContain("bun test");
    expect(runs).toContain("bun run lint");
    expect(runs).toContain("tsc --noEmit");
  });
});
