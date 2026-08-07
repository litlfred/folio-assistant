/**
 * Author dispensations are the documented escape hatch for a criterion that
 * is right in general but wrong about one block: a `kind: "human"` entry with
 * `result: "pass"` and a `notes:` rationale, pinned to the sources it was
 * granted against by `field_hash`.
 *
 * The mechanism did not work. `hasHumanDispensation` took the most recent
 * matching entry outright, and every audit run appends its own `kind:
 * "script"` entry stamped at run time — so the run that HONOURED a
 * dispensation immediately wrote the entry that superseded it. Measured on
 * the qou corpus against byte-identical sources:
 *
 *     run 1   dispensations-honored=5   fails=1
 *     run 2   dispensations-honored=0   fails=6
 *     run 3   dispensations-honored=0   fails=6
 *
 * Under a flat timestamp rule no human entry can ever outlive the next sweep,
 * because the script always re-runs and always stamps later. The feature was
 * unusable by construction and silently so — the sidecar still showed the
 * human entry, the audit had simply stopped reading it.
 *
 * These pin the precedence that makes it work: among entries matching the
 * CURRENT sources, human outranks script; `reviewed_at` only breaks ties
 * within a kind. The hash pin is what keeps this from becoming a permanent
 * mute — edit the sources and the dispensation lapses.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { hasHumanDispensation } from "../../content/pipeline/q-usage-audit.ts";

const DIR = mkdtempSync(join(tmpdir(), "qa-dispensation-"));
afterAll(() => {
  try {
    rmSync(DIR, { recursive: true, force: true });
  } catch {}
});

const CRITERION = "q-usage-archimedean-in-categorical-chapter";
const HASHES = { ts: "aaaaaaaaaaaa", md: "bbbbbbbbbbbb", lean: "cccccccccccc" };

let seq = 0;
/** Write a block `.ts` + its sidecar; returns the block triple. */
function block(entries: unknown[]): { ts: string; label: string } {
  const ts = join(DIR, `b${seq++}.ts`);
  writeFileSync(ts, "export default conjecture({});\n");
  writeFileSync(
    ts.replace(/\.ts$/, ".qa.json"),
    JSON.stringify({ criteria: { [CRITERION]: entries } }, null, 2),
  );
  return { ts, label: "conj:x" };
}

const human = (at: string, result = "pass") => ({
  field_hash: HASHES,
  result,
  reviewer: { kind: "human", id: "litlfred" },
  reviewed_at: at,
  notes: "declared archimedean specialisation",
});

const script = (at: string, result = "fail") => ({
  field_hash: HASHES,
  result,
  reviewer: { kind: "script", id: "q-usage-audit" },
  reviewed_at: at,
});

describe("human dispensation precedence", () => {
  test("survives a LATER script entry — the whole point", () => {
    const b = block([human("2026-08-07T00:00:00Z"), script("2026-08-07T23:59:00Z")]);
    expect(hasHumanDispensation(b, CRITERION, HASHES)).toBe(true);
  });

  test("survives many later script entries", () => {
    // Every sweep appends one. A dispensation must not decay with sweep count.
    const b = block([
      human("2026-08-01T00:00:00Z"),
      ...["02", "03", "04", "05", "06", "07"].map((d) => script(`2026-08-${d}T12:00:00Z`)),
    ]);
    expect(hasHumanDispensation(b, CRITERION, HASHES)).toBe(true);
  });

  test("a script entry alone is not a dispensation", () => {
    const b = block([script("2026-08-07T12:00:00Z", "pass")]);
    expect(hasHumanDispensation(b, CRITERION, HASHES)).toBe(false);
  });

  test("a human FAIL is not a dispensation", () => {
    // A reviewer confirming the finding must not read as clearing it.
    const b = block([human("2026-08-07T12:00:00Z", "fail")]);
    expect(hasHumanDispensation(b, CRITERION, HASHES)).toBe(false);
  });

  test("the most recent HUMAN entry decides between humans", () => {
    // Timestamps still order within a kind, so a reviewer can revoke.
    const b = block([
      human("2026-08-01T00:00:00Z", "pass"),
      human("2026-08-07T00:00:00Z", "fail"),
    ]);
    expect(hasHumanDispensation(b, CRITERION, HASHES)).toBe(false);
  });

  test("lapses when the sources it was granted against change", () => {
    // The hash pin is what stops a dispensation becoming a permanent mute.
    const b = block([human("2026-08-07T00:00:00Z")]);
    expect(hasHumanDispensation(b, CRITERION, { ...HASHES, lean: "dddddddddddd" })).toBe(false);
  });

  test("does not leak across criteria", () => {
    const b = block([human("2026-08-07T00:00:00Z")]);
    expect(hasHumanDispensation(b, "q-usage-fixed-q0-leak", HASHES)).toBe(false);
  });

  test("a block with no sidecar has no dispensation", () => {
    const ts = join(DIR, `nosidecar.ts`);
    writeFileSync(ts, "export default conjecture({});\n");
    expect(hasHumanDispensation({ ts, label: "conj:y" }, CRITERION, HASHES)).toBe(false);
  });
});
