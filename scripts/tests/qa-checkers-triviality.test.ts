import { describe, expect, test, beforeEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  checkProofNotMachineTrivial,
  resetTrivialityCache,
  TRIVIAL_STEP_THRESHOLD,
} from "../../content/pipeline/qa-checkers-triviality";

// The checker resolves the content repo from process.cwd(), so each test
// builds a throwaway repo-shaped tree and runs inside it.
function makeRepo(entries?: Record<string, unknown>) {
  const root = mkdtempSync(join(tmpdir(), "triv-"));
  mkdirSync(join(root, "content", "p", "ch"), { recursive: true });
  mkdirSync(join(root, "computations"), { recursive: true });
  mkdirSync(join(root, "docs", "audits"), { recursive: true });

  const leanRel = "content/p/ch/b.lean";
  writeFileSync(join(root, leanRel), "theorem foo : True := by trivial\n");
  const tsPath = join(root, "content", "p", "ch", "b.ts");
  writeFileSync(
    tsPath,
    'export default theorem({ label: "thm:b", lean: { ref: "p:P.foo" } });\n',
  );

  if (entries) {
    writeFileSync(
      join(root, "docs/audits/lean-triviality.json"),
      JSON.stringify({
        $schema: "lean-triviality/v1",
        generated_at: "2026-01-01T00:00:00Z",
        oracle: "nazrin@test",
        decls: entries,
      }),
    );
  }
  return { root, tsPath, leanRel };
}

let cwd: string;
beforeEach(() => {
  cwd = process.cwd();
  resetTrivialityCache();
});

function inRepo<T>(root: string, fn: () => T): T {
  process.chdir(root);
  try {
    return fn();
  } finally {
    process.chdir(cwd);
  }
}

describe("proof-not-machine-trivial", () => {
  test("n/a when there is no cache — absence of data, not absence of triviality", () => {
    const { root, tsPath } = makeRepo();
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("n/a");
    expect(r.notes).toContain("not measured");
    rmSync(root, { recursive: true, force: true });
  });

  test("n/a when the cache has no run for this declaration", () => {
    const { root, tsPath } = makeRepo({ "P.other": { closed: true, steps: 1 } });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("n/a");
    rmSync(root, { recursive: true, force: true });
  });

  test("warns when the oracle closed the goal in few steps", () => {
    const { root, tsPath } = makeRepo({ "P.foo": { closed: true, steps: 2 } });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("warn");
    expect(r.metrics?.atomic_steps_to_close).toBe(2);
    expect(r.metrics?.oracle_closed).toBe(1);
    // The message must read as a prompt, not a verdict.
    expect(r.hits[0].text).toContain("not a verdict");
    rmSync(root, { recursive: true, force: true });
  });

  test("passes when the oracle could not close the goal", () => {
    const { root, tsPath } = makeRepo({ "P.foo": { closed: false } });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("pass");
    expect(r.metrics?.oracle_closed).toBe(0);
    rmSync(root, { recursive: true, force: true });
  });

  test("passes when the goal took more than the threshold", () => {
    const { root, tsPath } = makeRepo({
      "P.foo": { closed: true, steps: TRIVIAL_STEP_THRESHOLD + 1 },
    });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("pass");
    rmSync(root, { recursive: true, force: true });
  });

  test("n/a when the measurement is stale relative to the .lean", () => {
    // A measurement taken against different source says nothing about
    // the current statement — reporting it would be a confident wrong
    // answer rather than a weak one.
    const { root, tsPath } = makeRepo({
      "P.foo": {
        closed: true,
        steps: 1,
        lean_path: "content/p/ch/b.lean",
        lean_sha: "deadbeef1234", // deliberately not the real hash
      },
    });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("n/a");
    expect(r.notes).toContain("stale");
    rmSync(root, { recursive: true, force: true });
  });

  test("a `not closed` from a SHORT ladder is n/a, not pass", () => {
    // The probe runs six rungs. `aesop` is not core Lean, so in a folio
    // without Mathlib it errors with `unknown tactic` — which, to an
    // exit-code check, looks exactly like "ran and did not close the
    // goal". Every declaration aesop would have closed then reads as
    // "not machine-trivial". A rung that never answered is not evidence.
    const { root, tsPath } = makeRepo({
      "P.foo": { closed: false, ladder_unavailable: ["aesop"] },
    });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("n/a");
    expect(r.notes).toContain("aesop");
    expect(r.notes).toContain("short ladder");
    rmSync(root, { recursive: true, force: true });
  });

  test("a `not closed` from the FULL ladder is still a pass", () => {
    // The complement: the n/a path must not swallow real measurements.
    const { root, tsPath } = makeRepo({ "P.foo": { closed: false } });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("pass");
    rmSync(root, { recursive: true, force: true });
  });

  test("an incomplete ladder does not suppress a goal that WAS closed", () => {
    // If `simp` closed it at rung 3, aesop never running is irrelevant —
    // the hit stands. Only "not closed" is weakened by a short ladder.
    const { root, tsPath } = makeRepo({
      "P.foo": { closed: true, steps: 3, ladder_unavailable: ["aesop"] },
    });
    const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
    expect(r.result).toBe("warn");
    rmSync(root, { recursive: true, force: true });
  });

  test("never returns fail — it is warn-only by construction", () => {
    for (const entry of [
      { closed: true, steps: 0 },
      { closed: true, steps: 1 },
      { closed: false },
    ]) {
      const { root, tsPath } = makeRepo({ "P.foo": entry });
      const r = inRepo(root, () => checkProofNotMachineTrivial(tsPath));
      expect(r.result).not.toBe("fail");
      rmSync(root, { recursive: true, force: true });
    }
  });
});
