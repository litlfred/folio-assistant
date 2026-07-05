/**
 * Unit tests for the voice/wall QA checkers' false-positive fixes
 * (litlfred/folio-assistant #41):
 *
 *   1. `checkEditorializing` — the "naturally occurring" domain-phrase
 *      exemption must be a STRIP (not a whole-line skip), so a genuine
 *      editorializing term elsewhere on the same line is still caught.
 *   2. `checkWallSide` — the §7c archimedean acknowledgement may live in
 *      the `.ts` `authorNotes` (per CLAUDE.md §4d), not only the `.md`;
 *      a `]` inside a note body must not truncate extraction; and the
 *      `\mathbb{R}` acknowledgement must match regardless of case.
 *
 * Run via `bun test`.
 */
import { describe, test, expect } from "bun:test";
import { writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  checkEditorializing,
  checkWallSide,
} from "../../content/pipeline/qa-checkers-voice.ts";

const DIR = mkdtempSync(join(tmpdir(), "qa-voice-"));
let seq = 0;
function tmp(name: string, contents: string): string {
  const p = join(DIR, `${seq++}-${name}`);
  writeFileSync(p, contents);
  return p;
}
const ed = (line: string) =>
  checkEditorializing(tmp("t.md", line)).result;

describe("checkEditorializing — domain-phrase exemption is a strip, not a mask", () => {
  test("'naturally occurring' alone passes (domain term, not opinion)", () => {
    expect(ed("These are naturally occurring elements.")).toBe("pass");
  });
  test("editorializing elsewhere on a 'naturally occurring' line still FAILS", () => {
    // The strip must not hide the second hit — regression for #41 comment.
    expect(
      ed("naturally occurring elements are, surprisingly, abundant"),
    ).toBe("fail");
  });
  test("'simply is' still fails (genuine intensifier)", () => {
    expect(ed("the universe simply is the structure")).toBe("fail");
  });
  test("'naturally beautiful' still fails (exemption is narrow)", () => {
    expect(ed("a naturally beautiful result")).toBe("fail");
  });
});

describe("checkWallSide — §7c acknowledgement via .ts authorNotes", () => {
  const archLean = () =>
    tmp("a.lean", "noncomputable def f : Real := Real.pi\n");
  const plainMd = () => tmp("a.md", "The map f is defined.");

  test("§7c note in authorNotes → pass (no .md acknowledgement)", () => {
    const ts = tmp(
      "ack.ts",
      `export const b = { authorNotes: [{ kind: "note", body: "archimedean specialisation over R (§7c)." }] };`,
    );
    expect(checkWallSide(plainMd(), archLean(), ts).result).toBe("pass");
  });

  test("no acknowledgement anywhere → fail (checker not neutered)", () => {
    const ts = tmp("noack.ts", `export const b = { title: "f", uses: [] };`);
    expect(checkWallSide(plainMd(), archLean(), ts).result).toBe("fail");
  });

  test("']' inside a note body does not truncate extraction of a later §7c note", () => {
    const ts = tmp(
      "brackets.ts",
      `export const b = { authorNotes: [{ kind: "note", body: "see [ref](x) and footnote [1]; archimedean specialisation over R." }] };`,
    );
    expect(checkWallSide(plainMd(), archLean(), ts).result).toBe("pass");
  });

  test("'over \\\\mathbb{R}' acknowledgement in .md matches case-insensitively", () => {
    const md = tmp("mr.md", "Defined over $\\mathbb{R}$ here.");
    const ts = tmp("bare.ts", `export const b = { title: "f" };`);
    expect(checkWallSide(md, archLean(), ts).result).toBe("pass");
  });

  test("algebraic .lean (generic R) is unaffected → pass", () => {
    const lean = tmp("g.lean", "def f {R : Type*} [CommRing R] (x : R) := x\n");
    const ts = tmp("bare2.ts", `export const b = { title: "f" };`);
    expect(checkWallSide(plainMd(), lean, ts).result).toBe("pass");
  });

  test("generic [Field R] closing a literal with norm_num is NOT a mixed-signal fail (bring-residue pattern)", () => {
    // No ℝ / Real TYPE anywhere — only `[Field R]` + `norm_num`. The
    // arithmetic tactics (`norm_num` / `linarith` / `positivity` /
    // `nlinarith`) discharge goals over any ordered field / ℕ / ℤ and are
    // NOT evidence of an ℝ specialisation, so they must not drive the
    // mixed-signal split. Under the old heuristic `norm_num` alongside
    // `[Field R]` tripped "split into two files"; the block is purely
    // algebraic and, with its acknowledgement, must pass.
    const lean = tmp(
      "field.lean",
      "def r {R : Type*} [Field R] (n : ℕ) (q : R) : R := 1 / (1 - q ^ n)\nexample : ((-3 : ℚ)) * (1 / 4) = -3 / 4 := by norm_num\n",
    );
    const mdAck = tmp(
      "fieldack.md",
      "The resolvent specialises to the substrate q-character.",
    );
    const ts = tmp("field.ts", `export const b = { title: "r" };`);
    expect(checkWallSide(mdAck, lean, ts).result).toBe("pass");
  });

  test("genuine ℝ-TYPE marker (Real.*) alongside generic-R is still flagged as mixed", () => {
    // A real-field type (here `Real.pi`) coexisting with generic-R markers
    // IS a real mixed placement — the split flag must survive.
    const lean = tmp(
      "mix.lean",
      "variable {R : Type*} [CommRing R]\nnoncomputable def t : Real := Real.pi\n",
    );
    const ts = tmp("mix.ts", `export const b = { title: "t" };`);
    expect(checkWallSide(plainMd(), lean, ts).result).toBe("fail");
  });

  test("broadened ℝ detection: `(x : ℝ)` spaced form alongside generic-R is flagged", () => {
    // The narrow `: ℝ\\b` token missed `(x : ℝ)`; the broadened bare-ℝ
    // matcher catches it, so an unacknowledged R→ℝ mix is now flagged.
    const lean = tmp(
      "spaced.lean",
      "variable {R : Type*} [CommRing R]\nnoncomputable def m (x : ℝ) : ℝ := x\n",
    );
    const ts = tmp("spaced.ts", `export const b = { title: "m" };`);
    expect(checkWallSide(plainMd(), lean, ts).result).toBe("fail");
  });

  test("mixed-signal ACK-ESCAPE: `(x : ℝ)` + generic-R WITH a §7c ack → pass", () => {
    // A legitimate R→ℝ realisation that acknowledges the specialisation is
    // not forced to split (an acknowledged mix passes, mirroring the ack
    // branch's philosophy).
    const lean = tmp(
      "escape.lean",
      "variable {R : Type*} [CommRing R]\nnoncomputable def m (x : ℝ) : ℝ := x\n",
    );
    const mdAck = tmp(
      "escape.md",
      "**Archimedean specialisation (§7c).** the R→ℝ realisation at q₀.",
    );
    const ts = tmp("escape.ts", `export const b = { title: "m" };`);
    expect(checkWallSide(mdAck, lean, ts).result).toBe("pass");
  });
});
