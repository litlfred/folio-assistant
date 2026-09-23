/**
 * "You typed it wrong" and "there is nothing here to check" are two states.
 *
 * `ingest:ig:check` exited **2 on every run** for as long as it had existed.
 * Its registered invocation ended in a dangling `--source` with no value, so
 * the script took the missing-argument branch, printed a usage string and quit
 * before doing anything.
 *
 * ## Why nothing caught it
 *
 * Three guards each missed it for a different reason, which is the part worth
 * keeping:
 *
 * - the **"no check script is unrun"** test covers `check:*`-prefixed scripts,
 *   and this one is `ingest:ig:check`;
 * - **no workflow invokes it**, so CI never ran it either — a registered script
 *   nobody runs, which would have failed if anybody had;
 * - and its output was a **usage string**, which reads as operator error rather
 *   than as a defect, so a human who did run it would likely have believed the
 *   command was theirs to fix.
 *
 * ## What is asserted
 *
 * Not that the check passes — it cannot. `smart-trust`'s index records its
 * source as a REMOTE gh-pages build, so there is no local directory to diff and
 * `--check` has no input. A checker with no input that exited 0 would be the
 * `dh4f` shape, a clean run over a corpus it never saw.
 *
 * What is asserted is that the two failures are TOLD APART: the real one names
 * the index and its remote source and exits 1; a genuine misinvocation still
 * gets the usage string and exits 2.
 *
 * @module cat-harness/scripts/tests/ingest-ig-invocation.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const SCRIPT = "cat-harness/scripts/ingest-ig-artifacts.ts";

const run = (args: string[]) => {
  const p = Bun.spawnSync(["bun", "run", SCRIPT, ...args], { cwd: REPO });
  return { code: p.exitCode, err: new TextDecoder().decode(p.stderr) };
};

describe("the registered invocation is well-formed", () => {
  const scripts = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as {
    scripts: Record<string, string>;
  }).scripts;

  /**
   * A GENERIC "NO DANGLING VALUE-TAKING FLAG" CHECK IS NOT HERE, and it was
   * attempted twice. Recorded so it is not built a third time blind.
   *
   * **Attempt 1** flagged any script ending in a bare `--flag`. **56 do**, and
   * nearly all are correct: `--check`, `--list`, `--strict`, `--http`,
   * `--dry-run` take no value, so ending in one is the normal shape. "Ends in
   * a flag" was never the defect.
   *
   * **Attempt 2** tried to DERIVE which flags take a value — a flag seen
   * followed by a non-flag token somewhere in the corpus. That classified
   * `--check` as value-taking, because a chained command reads
   * `… --check && bun run …` and `&&` is not a flag. **43 false positives**,
   * including this file's own subject.
   *
   * Both failed the same way: the property is about each TARGET SCRIPT's flag
   * semantics, and `package.json` does not carry them. Getting it right needs
   * each script's own argument parser, which is a different piece of work from
   * fixing one malformed invocation — and a guard that fires on 43 correct
   * scripts is worse than none, because it trains its reader to skip it.
   *
   * What is asserted instead is narrow and true: THIS invocation does not end
   * in `--source`, the flag that actually takes a value here. The behavioural
   * tests below are the real guard, and they hold whatever the command line
   * looks like.
   */
  it("ingest:ig:check does not end in a flag that needs a value", () => {
    expect(scripts["ingest:ig:check"]).toBeDefined();
    expect(scripts["ingest:ig:check"]!.trim()).not.toMatch(/--source$/);
  });
});

describe("the two failures are told apart", () => {
  it("a genuine misinvocation gets the usage string and exits 2", () => {
    const r = run(["--check"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("usage: ingest-ig-artifacts.ts");
  });

  it("but a missing LOCAL SOURCE names the index and its remote origin", () => {
    // The true state in this repository, and it is not operator error: the
    // platform carries no IG build, only the committed index describing one.
    const r = run(["--out", "smart-trust", "--check"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("smart-trust/fhir-artifact-index/index.json");
    expect(r.err).toContain("https://worldhealthorganization.github.io/smart-trust");
    expect(r.err).not.toContain("usage: ingest-ig-artifacts.ts");
  });

  it("and it never exits 0 with nothing to check", () => {
    // A checker with no input reporting a clean corpus is the `dh4f` shape.
    // Both branches above are non-zero; this pins that neither drifts to 0.
    expect(run(["--check"]).code).not.toBe(0);
    expect(run(["--out", "smart-trust", "--check"]).code).not.toBe(0);
  });
});
