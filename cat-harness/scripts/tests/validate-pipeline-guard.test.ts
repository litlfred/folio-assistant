/**
 * `content_validate` must never report a clean run when the pipeline did not
 * run at all.
 *
 * The defect this guards against, found by authoring real content in a
 * scaffolded folio: the tool resolved `validate.ts` from the FOLIO's
 * `content/pipeline/`, which `folio_init` does not create. The spawn failed
 * with "Module not found", stdout came back empty, the `✗`/`⚠` counts over
 * that empty string were both zero, and the headline read
 *
 *     Validation: 0 error(s), 0 warning(s)
 *
 * with the stderr appended far below it. Every scaffolded folio took exactly
 * that path — the primary validation tool reporting a clean bill of health
 * having executed no checks.
 */
import { describe, test, expect } from "bun:test";
import type { SpawnSyncReturns } from "child_process";
import { existsSync } from "fs";

import {
  resolveValidateScript,
  pipelineFailedToRun,
} from "../../adapters/document/tools/validate";

/** A `spawnSync` result with only the fields the guard reads. */
function spawnResult(over: Partial<SpawnSyncReturns<Buffer>>): SpawnSyncReturns<Buffer> {
  return {
    pid: 1,
    output: [],
    stdout: Buffer.from(""),
    stderr: Buffer.from(""),
    status: 0,
    signal: null,
    ...over,
  } as SpawnSyncReturns<Buffer>;
}

describe("pipelineFailedToRun", () => {
  test("non-zero exit with NO stdout is a failure to run", () => {
    // The reproduction: `bun run <missing>.ts` exits 1 having printed nothing.
    expect(pipelineFailedToRun(spawnResult({ status: 1 }), "")).toBe(true);
  });

  test("non-zero exit WITH findings on stdout is a normal outcome", () => {
    // `validate.ts` exits non-zero when it finds problems. Treating that as a
    // failure to run would suppress every real finding the tool exists for —
    // the opposite error, and just as bad.
    expect(pipelineFailedToRun(spawnResult({ status: 1 }), "✗ def:x missing .lean\n")).toBe(false);
  });

  test("a clean run is not a failure", () => {
    expect(pipelineFailedToRun(spawnResult({ status: 0 }), "all checks passed\n")).toBe(false);
  });

  test("spawn error (no `bun` on PATH) is a failure to run", () => {
    expect(pipelineFailedToRun(spawnResult({ error: new Error("ENOENT") }), "")).toBe(true);
  });

  test("killed by signal / timeout is a failure to run, even with partial stdout", () => {
    // A timed-out pipeline may have printed some checks before dying; those
    // are not a verdict on the whole corpus.
    expect(pipelineFailedToRun(spawnResult({ status: null, signal: "SIGTERM" }), "some output")).toBe(true);
  });

  test("a clean run that printed nothing is NOT a failure", () => {
    // Exit 0 is the pipeline's own word that it finished.
    expect(pipelineFailedToRun(spawnResult({ status: 0 }), "")).toBe(false);
  });
});

describe("resolveValidateScript", () => {
  test("finds a pipeline — here, the platform's own copy", () => {
    // This test runs with the platform as the repo root, which carries
    // content/pipeline/validate.ts. The scaffolded-folio case (no
    // content/pipeline/ at all) resolves to the platform's copy by the same
    // fallback, which is the fix.
    const script = resolveValidateScript();
    expect(script).toBeDefined();
    expect(existsSync(script!)).toBe(true);
    expect(script!.endsWith("content/pipeline/validate.ts")).toBe(true);
  });
});
