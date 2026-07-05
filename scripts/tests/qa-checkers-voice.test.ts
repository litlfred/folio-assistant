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
});
