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
});
