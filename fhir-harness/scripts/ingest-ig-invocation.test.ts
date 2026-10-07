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
 * Not that the check passes — it cannot. An index that records its source as
 * a REMOTE gh-pages build has no local directory to diff, so
 * `--check` has no input. A checker with no input that exited 0 would be the
 * `dh4f` shape, a clean run over a corpus it never saw.
 *
 * What is asserted is that the two failures are TOLD APART: the real one names
 * the index and its remote source and exits 1; a genuine misinvocation still
 * gets the usage string and exits 2.
 *
 * @module fhir-harness/scripts/ingest-ig-invocation.test
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The script by its own absolute path, so nothing here depends on the layout
 * around this layer: it used to run `fhir-harness/scripts/…` from the
 * checkout root, which holds only where fhir-harness is a subdirectory.
 */
const SCRIPT = join(import.meta.dir, "ingest-ig-artifacts.ts");

/**
 * An instance whose committed index records a REMOTE source — smart-trust's
 * shape, built here so this layer reads no instance above it. smart-trust's
 * own half (its registered `ingest:ig:check` and its real index) is in
 * `test/ingest-ig-invocation-checkout.test.ts` (bean `7zz1`): standing alone,
 * fhir-harness has neither.
 */
const REMOTE_ORIGIN = "https://example.org/some-ig/";
let fixture: string;
beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), "ingest-ig-invocation-"));
  mkdirSync(join(fixture, "remote-ig", "fhir-artifact-index"), { recursive: true });
  writeFileSync(join(fixture, "remote-ig", "fhir-artifact-index", "index.json"), JSON.stringify({ source: { of: REMOTE_ORIGIN } }));
  mkdirSync(join(fixture, "no-index"), { recursive: true });
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

const run = (args: string[]) => {
  const p = Bun.spawnSync(["bun", "run", SCRIPT, ...args], { cwd: fixture });
  return { code: p.exitCode, err: new TextDecoder().decode(p.stderr) };
};

// "the registered invocation is well-formed" asserted smart-trust's own
// `ingest:ig:check` script — smart-trust's manifest, not this layer's — and
// moved, with its record of the two failed generic attempts, to
// `test/ingest-ig-invocation-checkout.test.ts`.

describe("the two failures are told apart", () => {
  it("a genuine misinvocation gets the usage string and exits 2", () => {
    const r = run(["--check"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("usage: ingest-ig-artifacts.ts");
  });

  it("but a missing LOCAL SOURCE names the index and its remote origin", () => {
    // Not operator error: the index exists and says where its build lives;
    // there is simply nothing on disk to diff.
    const r = run(["--out", "remote-ig", "--check"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain(join("remote-ig", "fhir-artifact-index", "index.json"));
    expect(r.err).toContain(REMOTE_ORIGIN);
    expect(r.err).not.toContain("usage: ingest-ig-artifacts.ts");
  });

  it("an --out whose index names no source is not a pass either", () => {
    const r = run(["--out", "no-index", "--check"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("records no source");
  });

  it("and it never exits 0 with nothing to check", () => {
    // A checker with no input reporting a clean corpus is the `dh4f` shape.
    // Every branch above is non-zero; this pins that none drifts to 0.
    expect(run(["--check"]).code).not.toBe(0);
    expect(run(["--out", "remote-ig", "--check"]).code).not.toBe(0);
    expect(run(["--out", "no-index", "--check"]).code).not.toBe(0);
  });
});
