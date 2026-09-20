import { describe, expect, test } from "bun:test";
import { leanSignatures } from "../../content/pipeline/lean-signature";
import { entryIsFresh, hashBlockFiles } from "../../content/pipeline/qa-utils";
import type { QaCriterionEntry } from "../../schemas/block-qa";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const THM = `
theorem foo (n : Nat) : n + 0 = n := by
  simp

theorem bar (n : Nat) : 0 + n = n := by
  omega
`;

// Same signatures, different proof bodies.
const THM_NEW_PROOF = `
theorem foo (n : Nat) : n + 0 = n := by
  induction n with
  | zero => rfl
  | succ k ih => simp

theorem bar (n : Nat) : 0 + n = n := by
  simp [Nat.zero_add]
`;

// Changed signature (Nat -> Int on foo).
const THM_NEW_STATEMENT = `
theorem foo (n : Int) : n + 0 = n := by
  simp

theorem bar (n : Nat) : 0 + n = n := by
  omega
`;

describe("leanSignatures", () => {
  test("is invariant under a proof-body rewrite", () => {
    // The whole point: rewriting how something is proved must not read
    // as a change to what it claims.
    expect(leanSignatures(THM)).toBe(leanSignatures(THM_NEW_PROOF));
  });

  test("changes when a signature changes", () => {
    expect(leanSignatures(THM)).not.toBe(leanSignatures(THM_NEW_STATEMENT));
  });

  test("changes when a statement contains `:=` and its TAIL changes", () => {
    // Regression. The signature/body cut fired on the first `:=`
    // anywhere, so a `let` in the statement truncated the signature to
    // `theorem t : (let x` — identical for both of these. The statement
    // hash built on it therefore could not see the 5 -> 6 change, and a
    // QA sidecar recorded against the old statement stayed "fresh".
    const five = `theorem t : (let x := 5; x) = 5 := by rfl\n`;
    const six = `theorem t : (let x := 5; x) = 6 := by rfl\n`;
    expect(leanSignatures(five)).not.toBe(leanSignatures(six));
  });

  test("a structure instance in the statement does not truncate it", () => {
    const a = `theorem t : ({ a := 1 } : Foo).a = 1 := by rfl\n`;
    const b = `theorem t : ({ a := 1 } : Foo).a = 2 := by rfl\n`;
    expect(leanSignatures(a)).not.toBe(leanSignatures(b));
  });

  test("still invariant under a proof rewrite when the statement holds `:=`", () => {
    // The other direction: the fix must not make the hash sensitive to
    // the body, or every proof edit would invalidate every sidecar.
    const p1 = `theorem t : (let x := 5; x) = 5 := by rfl\n`;
    const p2 = `theorem t : (let x := 5; x) = 5 := by simp\n`;
    expect(leanSignatures(p1)).toBe(leanSignatures(p2));
  });

  test("changes when a declaration is RENAMED", () => {
    // A rename is a statement change even with an identical type — the
    // narrative names the declaration.
    const renamed = THM.replace("theorem foo", "theorem foo'");
    expect(leanSignatures(THM)).not.toBe(leanSignatures(renamed));
  });

  test("ignores comments, including doc comments", () => {
    const commented = `
/-- A doc comment that mentions bar and Int and other decls. -/
theorem foo (n : Nat) : n + 0 = n := by
  simp  -- trailing note

theorem bar (n : Nat) : 0 + n = n := by
  omega
`;
    expect(leanSignatures(commented)).toBe(leanSignatures(THM));
  });

  test("returns undefined when there are no lexable declarations", () => {
    // The fail-safe path — callers fall back to the whole-file hash.
    expect(leanSignatures("import Mathlib.Tactic\nopen Nat\n")).toBeUndefined();
    expect(leanSignatures("")).toBeUndefined();
  });
});

describe("entryIsFresh — lean granularity", () => {
  const dir = mkdtempSync(join(tmpdir(), "leansig-"));
  const leanPath = join(dir, "b.lean");

  const entryFor = (hashes: ReturnType<typeof hashBlockFiles>): QaCriterionEntry => ({
    field_hash: hashes,
    result: "pass",
    reviewer: { kind: "agent", id: "test" },
    reviewed_at: "2026-01-01T00:00:00Z",
  });

  test("statement granularity survives a proof-body rewrite", () => {
    writeFileSync(leanPath, THM);
    const before = hashBlockFiles({ lean: leanPath });
    const entry = entryFor(before);

    writeFileSync(leanPath, THM_NEW_PROOF);
    const after = hashBlockFiles({ lean: leanPath });

    expect(after.lean).not.toBe(before.lean); // file did change
    expect(entryIsFresh(entry, after, ["lean"], undefined, "statement")).toBe(true);
    // …and the default granularity still invalidates.
    expect(entryIsFresh(entry, after, ["lean"], undefined, "file")).toBe(false);
    expect(entryIsFresh(entry, after, ["lean"])).toBe(false);
  });

  test("statement granularity DOES invalidate on a signature change", () => {
    writeFileSync(leanPath, THM);
    const entry = entryFor(hashBlockFiles({ lean: leanPath }));
    writeFileSync(leanPath, THM_NEW_STATEMENT);
    const after = hashBlockFiles({ lean: leanPath });
    expect(entryIsFresh(entry, after, ["lean"], undefined, "statement")).toBe(false);
  });

  test("falls back to the whole-file hash when the entry predates lean_statement", () => {
    // A legacy entry has no `lean_statement`. It must NOT be treated as
    // fresh on the strength of a field it never recorded — that would
    // present a stale verdict as current.
    writeFileSync(leanPath, THM);
    const before = hashBlockFiles({ lean: leanPath });
    const legacy = entryFor({ lean: before.lean }); // no lean_statement
    writeFileSync(leanPath, THM_NEW_PROOF);
    const after = hashBlockFiles({ lean: leanPath });
    expect(entryIsFresh(legacy, after, ["lean"], undefined, "statement")).toBe(false);
  });

  test("falls back when the file has no lexable declarations", () => {
    writeFileSync(leanPath, "import Mathlib.Tactic\n");
    const before = hashBlockFiles({ lean: leanPath });
    expect(before.lean_statement).toBeUndefined();
    const entry = entryFor(before);
    writeFileSync(leanPath, "import Mathlib.Tactic\nopen Nat\n");
    const after = hashBlockFiles({ lean: leanPath });
    expect(entryIsFresh(entry, after, ["lean"], undefined, "statement")).toBe(false);
  });
});
