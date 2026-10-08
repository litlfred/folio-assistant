/**
 * `ingest:ig:check` tests about the WHOLE CHECKOUT, moved here from
 * `fhir-harness/scripts/ingest-ig-invocation.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads smart-trust — its
 * registered `ingest:ig:check` script, and the index it committed — and
 * smart-trust sits ABOVE fhir-harness, so standing alone fhir-harness has
 * neither and both failed its `seed:ready --rehearse`. That file keeps the
 * behaviour (two failures told apart) over a synthetic index; the history of
 * why the check exists is in its header. Every path here is composed from
 * ORIGIN_DIR, the directory these were written in, so nothing they read
 * changed.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { scriptsOf } from "../cat-harness/schemas/script-table.ts";

/** The directory these tests were written in (`fhir-harness/scripts/`). */
const ORIGIN_DIR = join(import.meta.dir, "../fhir-harness/scripts");
const REPO = resolve(ORIGIN_DIR, "..", "..");
const SCRIPT = "fhir-harness/scripts/ingest-ig-artifacts.ts";

const run = (args: string[]) => {
  const p = Bun.spawnSync(["bun", "run", SCRIPT, ...args], { cwd: REPO });
  return { code: p.exitCode, err: new TextDecoder().decode(p.stderr) };
};

describe("the registered invocation is well-formed", () => {
  const scripts = scriptsOf(REPO);

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
   * tests are the real guard, and they hold whatever the command line
   * looks like.
   */
  it("ingest:ig:check does not end in a flag that needs a value", () => {
    expect(scripts["ingest:ig:check"]).toBeDefined();
    expect(scripts["ingest:ig:check"]!.trim()).not.toMatch(/--source$/);
  });
});

describe("over smart-trust's committed index", () => {
  it("a missing LOCAL SOURCE names the index and its remote origin", () => {
    // The true state in this repository, and it is not operator error: the
    // platform carries no IG build, only the committed index describing one.
    const r = run(["--out", "smart-trust", "--check"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("smart-trust/fhir-artifact-index/index.json");
    // The origin the index RECORDS, read from it rather than restated: it was
    // WHO's published site until 2026-10-01, when the owner made the fork the
    // source (bean `jut3`), and a literal here broke on that re-ingest.
    const recorded = (JSON.parse(readFileSync(join(REPO, "smart-trust/fhir-artifact-index/index.json"), "utf-8")) as { source: { of: string } }).source.of;
    expect(r.err).toContain(recorded);
    expect(r.err).not.toContain("usage: ingest-ig-artifacts.ts");
  });
});
