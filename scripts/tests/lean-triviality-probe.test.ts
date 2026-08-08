/**
 * The triviality probe measures whether a goal falls to cheap automation.
 * Its output is only evidence about the *corpus* if the probe can close
 * anything at all — a probe that never closes a goal reports `closed: 0`
 * on a trivial corpus and on a deep one alike.
 *
 * The first qou run reported `probed 12, closed 0` and that was read as
 * "no qou theorem falls to cheap automation". A broken probe produces the
 * identical line. These tests are the control that separates the two:
 * declarations whose difficulty is known in advance, run through the real
 * code path.
 *
 * The Lean-backed tests need a toolchain. When none is found they SKIP —
 * and say so loudly, because a suite that silently passes when its
 * subject is absent is the same defect one level up.
 */
import { describe, test, expect } from "bun:test";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import {
  probeDeclaration,
  incompleteRungs,
  TACTIC_LADDER,
  SKIP_EXPLANATION,
  leanPathFor,
} from "../../content/pipeline/lean-triviality-probe.ts";

/** `lean` on PATH, else any elan toolchain. `undefined` when there is none. */
function findLean(): string | undefined {
  try {
    const p = execFileSync("which", ["lean"], { encoding: "utf-8" }).trim();
    if (p && existsSync(p)) return p;
  } catch {
    /* not on PATH */
  }
  const root = join(process.env.HOME ?? "", ".elan", "toolchains");
  if (!existsSync(root)) return undefined;
  for (const d of readdirSync(root)) {
    const bin = join(root, d, "bin", "lean");
    if (existsSync(bin)) return bin;
  }
  return undefined;
}

const LEAN = findLean();
const NO_LEAN = LEAN === undefined;

/**
 * Per-test budget for the Lean-backed cases. bun's default is 5s; one
 * probe is up to six `lean` invocations, and on a loaded runner the
 * ladder alone took 8.6s here. Without this the controls flake, and a
 * flaking control is one someone eventually deletes.
 */
const LEAN_TEST_TIMEOUT_MS = 180_000;

if (NO_LEAN) {
  console.warn(
    "\n  [lean-triviality-probe] NO LEAN TOOLCHAIN — the ladder control tests did not run.\n" +
      "  `closed: 0` from this probe is uninterpretable until they do.\n",
  );
}

// Core Lean only: no Mathlib, no imports beyond the prelude, so the
// control runs anywhere a toolchain exists.
const CONTROLS = `theorem trivTrue : True := by
  exact True.intro

theorem simpAppend (xs : List Nat) : xs ++ [] = xs := by
  induction xs with
  | nil => rfl
  | cons a as ih => simp

theorem omegaLinear (a b : Nat) (h : a + 2 ≤ b) : a < b := by
  exact Nat.lt_of_lt_of_le (Nat.lt_succ_of_le (Nat.le_succ_of_le (Nat.le_refl a))) h

theorem substantive (n : Nat) : 2 ^ n ≥ n + 1 := by
  induction n with
  | zero => decide
  | succ k ih =>
    have h2 : 2 ^ (k + 1) = 2 ^ k + 2 ^ k := by
      rw [Nat.pow_succ]; omega
    have hk : 2 ^ k ≥ 1 := Nat.one_le_two_pow
    omega
`;

const probe = (src: string, decl: string) =>
  probeDeclaration(src, decl, "/nonexistent-lake-root", LEAN!, 120_000);

describe("the ladder actually closes goals (the control for `closed: 0`)", () => {
  test.skipIf(NO_LEAN)("closes a goal that cheap automation should close", () => {
    const r = probe(CONTROLS, "trivTrue");
    expect(r.status).toBe("closed");
    if (r.status !== "closed") return;
    expect(r.tactic).toBe("trivial");
    expect(r.steps).toBe(1);
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("walks past rungs that fail and reports the one that worked", () => {
    // `xs ++ [] = xs` is not definitional, so `trivial` and `rfl` must
    // both lose before `simp` wins. If `steps` were the count of rungs
    // attempted, or always 1, this is where it shows.
    const r = probe(CONTROLS, "simpAppend");
    expect(r.status).toBe("closed");
    if (r.status !== "closed") return;
    expect(r.tactic).toBe("simp");
    expect(r.steps).toBe(TACTIC_LADDER.indexOf("simp") + 1);
    expect(r.ladder.ran.slice(0, 3)).toEqual(["trivial", "rfl", "simp"]);
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("reaches deep rungs — omega at position 5", () => {
    const r = probe(CONTROLS, "omegaLinear");
    expect(r.status).toBe("closed");
    if (r.status !== "closed") return;
    expect(r.tactic).toBe("omega");
    expect(r.steps).toBe(TACTIC_LADDER.indexOf("omega") + 1);
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("leaves a substantive goal open — it does not close everything", () => {
    // The negative control. Without it, "closes goals" could just mean
    // "reports closed unconditionally".
    const r = probe(CONTROLS, "substantive");
    expect(r.status).toBe("open");
  }, LEAN_TEST_TIMEOUT_MS);
});

describe("an unavailable rung is not a rung that lost", () => {
  test.skipIf(NO_LEAN)("records `aesop` as unavailable rather than as a failure", () => {
    // `aesop` is not core Lean. It errors with `unknown tactic` and a
    // non-zero exit — indistinguishable, to an exit-code check, from
    // "ran and did not close the goal". Then the ladder silently has
    // five rungs and every goal aesop would have closed reads as
    // "not machine-trivial".
    const r = probe(CONTROLS, "substantive");
    expect(r.status).toBe("open");
    if (r.status !== "open") return;
    expect(r.ladder.unavailable).toContain("aesop");
    expect(r.ladder.ran).not.toContain("aesop");
    // Everything core still ran: the detection is specific, not a
    // blanket "any error means unavailable".
    expect(r.ladder.ran).toEqual(["trivial", "rfl", "simp", "decide", "omega"]);
    // Nothing timed out at this budget, so the two buckets stay distinct.
    expect(r.ladder.timedOut).toEqual([]);
    expect(incompleteRungs(r.ladder)).toEqual(["aesop"]);
  }, LEAN_TEST_TIMEOUT_MS);

  test("incompleteRungs unions both kinds of non-answer", () => {
    // Pure: the checker keys `n/a` off this, so it must not silently
    // drop either bucket.
    expect(
      incompleteRungs({ ran: ["trivial"], unavailable: ["aesop"], timedOut: ["simp"] }),
    ).toEqual(["aesop", "simp"]);
    expect(incompleteRungs({ ran: ["trivial"], unavailable: [], timedOut: [] })).toEqual([]);
  });
});

describe("skip reasons are distinguished, because their fixes differ", () => {
  test.skipIf(NO_LEAN)("a declaration the lexer never saw", () => {
    const r = probe(CONTROLS, "noSuchDeclaration");
    expect(r.status).toBe("skipped");
    if (r.status !== "skipped") return;
    expect(r.reason).toBe("decl-not-found");
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("a declaration with no body to substitute", () => {
    const r = probe("theorem stated : True\n", "stated");
    expect(r.status).toBe("skipped");
    if (r.status !== "skipped") return;
    expect(r.reason).toBe("no-body");
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("a file that does not elaborate unmodified", () => {
    // The old code reported this reason for all four causes. It is the
    // one that means "restore the oleans"; the others do not.
    const r = probe("theorem b : Nat := by exact notAThing\n", "b");
    expect(r.status).toBe("skipped");
    if (r.status !== "skipped") return;
    expect(r.reason).toBe("baseline-fails");
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("a file too slow to probe is not a file that is broken", () => {
    // `execFileSync` signals a timeout by killing the child, which
    // arrives in the same catch as a failed elaboration. Reported as
    // `baseline-fails` it says "restore the oleans" about a file whose
    // oleans are fine. A 1ms budget guarantees the kill.
    const r = probeDeclaration(CONTROLS, "trivTrue", "/nonexistent-lake-root", LEAN!, 1);
    expect(r.status).toBe("skipped");
    if (r.status !== "skipped") return;
    expect(r.reason).toBe("baseline-timeout");
  }, LEAN_TEST_TIMEOUT_MS);

  test("every skip reason carries an explanation of what would fix it", () => {
    for (const r of [
      "decl-not-found",
      "no-body",
      "baseline-fails",
      "baseline-timeout",
    ] as const) {
      expect(SKIP_EXPLANATION[r]).toBeTruthy();
    }
  });
});

describe("splicing the body", () => {
  test.skipIf(NO_LEAN)("a `:=` inside the statement no longer mangles the probe", () => {
    // `(let x := 5; x) = 5` put the old cut inside the *statement*, so
    // the tactic was spliced over the theorem's own type. The file then
    // failed to elaborate, every rung lost, and it was recorded
    // `closed: false` — scored as "not machine-trivial". It is in fact
    // closed by `trivial` at rung 1.
    const src = `theorem withLet : (let x := 5; x) = 5 := by
  induction (5 : Nat) with
  | zero => rfl
  | succ k ih => rfl
`;
    const r = probe(src, "withLet");
    expect(r.status).toBe("closed");
    if (r.status !== "closed") return;
    expect(r.steps).toBe(1);
  }, LEAN_TEST_TIMEOUT_MS);

  test.skipIf(NO_LEAN)("comment stripping preserves offsets, so the splice lands correctly", () => {
    // `bodyAt` is an offset into the COMMENT-STRIPPED source, used to
    // slice the ORIGINAL. That is only sound because stripping blanks
    // comments in place rather than removing them. If it ever removes,
    // the splice silently corrupts a different span of the file.
    const src = `/-- A doc comment with a := inside it, and some length. -/
theorem commented (n : Nat) : n + 0 = n := by
  -- a line comment, also containing :=
  simp
`;
    const r = probe(src, "commented");
    expect(r.status).toBe("closed");
  }, LEAN_TEST_TIMEOUT_MS);
});

describe("leanPathFor", () => {
  test("returns empty for a root with no restored packages", () => {
    // Empty is correct and must stay distinguishable from a wrong path:
    // pointing at a directory that exists but holds no oleans reads as
    // "unknown module prefix", which looks like a missing dependency.
    expect(leanPathFor("/nonexistent-lake-root")).toBe("");
  });
});
