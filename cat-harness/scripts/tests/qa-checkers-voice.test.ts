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
import { writeFileSync, mkdtempSync, readdirSync } from "fs";
import { join } from "path";
import { libraryEntry } from "./library-dirs.ts";
import { tmpdir } from "os";
import {
  checkEditorializing,
  checkScholarlyDefault,
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

describe("checkEditorializing — `merely` in a contrast is a degree marker", () => {
  // Bean `nwus`. All four `voice-editorializing` findings in this repo's own
  // content/docs/ were the bare word `merely` inside an explicit contrast, and
  // all four were false. The criterion is after the author commenting on
  // quality; a comparative marks the WEAKER alternative, which is the opposite
  // move. Same shape as bean `fl5m` mechanism #2.
  test("'rather than merely cited' passes — the contrast IS the claim", () => {
    expect(
      ed("what makes a source authoritative rather than merely cited."),
    ).toBe("pass");
  });
  test("'rather than merely compile' passes", () => {
    expect(ed("Rules that make this work rather than merely compile:")).toBe(
      "pass",
    );
  });
  test("'not merely a relabelling' passes", () => {
    expect(ed("This is not merely a relabelling.")).toBe("pass");
  });
  test("bare 'merely a formality' still FAILS — the exemption is the contrast, not the word", () => {
    expect(ed("The proof is merely a formality.")).toBe("fail");
  });
  test("bare 'merely the shadow' still FAILS", () => {
    expect(ed("This is merely the shadow of the real result.")).toBe("fail");
  });
  test("a comparative line carrying a SECOND hit still FAILS (strip, not mask)", () => {
    // Same invariant the domain-phrase exemption has: removing the exempt
    // construction must not hide editorializing elsewhere on the line.
    expect(
      ed("authoritative rather than merely cited, and surprisingly so."),
    ).toBe("fail");
  });

  // Bean `fl5m` mechanism #5, in the editorializing rule: the negator lands on
  // the previous line when prose is hard-wrapped, and a line-based scan cannot
  // see it. One of the four findings was exactly this.
  test("hard-wrapped 'does not' / 'merely go unread' passes", () => {
    const p = tmp(
      "wrap.md",
      "so a paper still sitting in `uploads/` does not\nmerely go unread, it makes a clean grep lie\n",
    );
    expect(checkEditorializing(p).result).toBe("pass");
  });
  test("a line OPENING with 'merely' after a non-negated line still FAILS", () => {
    // The lookback must require the comparative or the negator, or it would
    // exempt every wrapped `merely` in the corpus.
    const p = tmp(
      "wrap-no-negator.md",
      "The argument is short.\nmerely a formality, in the end\n",
    );
    expect(checkEditorializing(p).result).toBe("fail");
  });
});

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

describe("checkWallSide — ack branch keyed on hasRealType, not tactic-inclusive isArchimedean", () => {
  const plainMd = () => tmp("p.md", "The statement holds.");

  test("tactic-only block (norm_num, NO ℝ / Real / generic-R) → pass (false-positive drop)", () => {
    // The prior ack branch keyed on the tactic-inclusive `isArchimedean`, so a
    // purely-algebraic block whose only "archimedean" marker was a `norm_num`
    // closing an integer identity (e.g. a partition-function count) was
    // wrongly flagged as needing a §7c note. `norm_num` / `linarith` /
    // `positivity` / `nlinarith` discharge goals over ℕ / ℤ / ℚ or any ordered
    // ring and are NOT evidence of an ℝ specialisation. Keyed on `hasRealType`
    // this now correctly passes with no acknowledgement.
    const lean = tmp(
      "tacticonly.lean",
      "theorem a8 : (2 : ℕ) + 2 = 4 := by norm_num\nexample : 0 ≤ (3 : ℤ) := by positivity\n",
    );
    const ts = tmp("tacticonly.ts", `export const b = { title: "a8" };`);
    expect(checkWallSide(plainMd(), lean, ts).result).toBe("pass");
  });

  test("colonless bare-ℝ return type `→ ℝ` (no `: ℝ` token), no ack → fail (broadening)", () => {
    // The narrow `: ℝ\\b` token required a colon, so a colonless `→ ℝ` /
    // `ℝ³` form slipped through the ack requirement. The bare-`ℝ`
    // `hasRealType` matcher catches it: an unacknowledged real-valued block
    // is now flagged regardless of the ℝ's surface form.
    const lean = tmp(
      "colonless.lean",
      "noncomputable def energy : ℕ → ℝ := fun n => (n : ℝ)\n",
    );
    const ts = tmp("colonless.ts", `export const b = { title: "energy" };`);
    expect(checkWallSide(plainMd(), lean, ts).result).toBe("fail");
  });

  test("colonless bare-ℝ `→ ℝ` WITH a §7c ack → pass (ack escape)", () => {
    const lean = tmp(
      "colonlessack.lean",
      "noncomputable def energy : ℕ → ℝ := fun n => (n : ℝ)\n",
    );
    const mdAck = tmp(
      "colonlessack.md",
      "**Archimedean specialisation (§7c).** real-valued at q₀.",
    );
    const ts = tmp("colonlessack.ts", `export const b = { title: "energy" };`);
    expect(checkWallSide(mdAck, lean, ts).result).toBe("pass");
  });

  test("Real.exp (real-analysis fn, subsumed by \\bReal\\b) with no ack → fail", () => {
    // hasRealType's `\\bReal\\b` already subsumes every `Real.*` real-analysis
    // function, so dropping the explicit `Real.exp` alternative from the ack
    // key loses no genuine coverage.
    const lean = tmp(
      "realexp.lean",
      "noncomputable def k (t : ℝ) : ℝ := Real.exp (-t)\n",
    );
    const ts = tmp("realexp.ts", `export const b = { title: "k" };`);
    expect(checkWallSide(plainMd(), lean, ts).result).toBe("fail");
  });
});

describe("checkScholarlyDefault — 'Right' is a technical adjective, not an interjection", () => {
  const md = (line: string) =>
    checkScholarlyDefault(tmp("t.md", line), undefined).result;
  const leanDoc = (line: string) =>
    checkScholarlyDefault(undefined, tmp("t.lean", `/-- ${line} -/\ndef f := 0\n`))
      .result;

  // The bare `Right\b` this pattern used to carry hit 22 Lean docstring
  // lines in the qou corpus (2026-08-24) and was wrong on 21 of them.
  test("'Right multiplication by a generator' passes", () => {
    expect(md("Right multiplication by a generator preserves the parabolic.")).toBe("pass");
  });
  test("'Right action of the Hecke generator' passes", () => {
    expect(md("Right action of the Hecke generator on the module.")).toBe("pass");
  });
  test("'Right gauge action' passes inside a Lean docstring", () => {
    expect(leanDoc("Right gauge action `SU(2)_R`.")).toBe("pass");
  });
  test("'Right, so ...' still fails (genuine interjection)", () => {
    expect(md("Right, so the bracket closes.")).toBe("fail");
  });
  test("'Right now we encode ...' still fails (lecturer cadence)", () => {
    expect(md("Right now we encode the real-part magnitude.")).toBe("fail");
  });
  test("neighbouring bare-comma openers are untouched", () => {
    expect(md("Alright the construction proceeds.")).toBe("fail");
    expect(md("Okay so the map is defined.")).toBe("fail");
  });
});

describe("checkScholarlyDefault — 'So the' is conclusion-drawing, not lecture cadence", () => {
  const md = (line: string) =>
    checkScholarlyDefault(tmp("t.md", line), undefined).result;

  // 246 of the 261 corpus-wide hits came from the bare `So (?:...|the)`
  // alternative, and none of them was the draft narration it was written for.
  test("'So the sum is well-defined' passes", () => {
    expect(md("So the sum is well-defined and independent of the choice.")).toBe("pass");
  });
  test("'So the two sides line up' passes", () => {
    expect(md("So the two sides line up under the pairing.")).toBe("pass");
  });
  test("'So the plan is ...' still fails (the narration it was for)", () => {
    expect(md("So the plan is to reduce to the abelian case.")).toBe("fail");
  });
  test("'So the idea is ...' still fails", () => {
    expect(md("So the idea is to push the estimate through.")).toBe("fail");
  });
  test("'So now we turn to' still fails", () => {
    expect(md("So now we turn to the second factor.")).toBe("fail");
  });
});

describe("checkScholarlyDefault — bare-word alternatives do not glue to the next word", () => {
  const md = (line: string) =>
    checkScholarlyDefault(tmp("t.md", line), undefined).result;

  // Without `\b`, `the` matched through the prefix of there/they/these.
  test("'So there is no inverse' passes", () => {
    expect(md("So there is no inverse to apply here.")).toBe("pass");
  });
  test("'So they are stated over the same ring' passes", () => {
    expect(md("So they are stated over the same generic ring.")).toBe("pass");
  });
  test("'So these two agree' passes", () => {
    expect(md("So these two agree on the overlap.")).toBe("pass");
  });
  // Under the /i flag, `(?:we|I)` matched the lowercase i of "is".
  test("'So what is proved here is the reduction' passes", () => {
    expect(md("So what is proved here is the reduction.")).toBe("pass");
  });
  test("'So what we do next' still fails", () => {
    expect(md("So what we do next is bound the tail.")).toBe("fail");
  });
});

describe("checkScholarlyDefault — a wrap continuation is not a sentence start", () => {
  test("'right, since ...' as a continuation line passes", () => {
    // The sentence began on the previous line and wrapped mid-clause.
    const p = tmp(
      "wrap.md",
      "The action is on the\nright, since the ring need not be commutative.\n",
    );
    expect(checkScholarlyDefault(p, undefined).result).toBe("pass");
  });
  test("the same opener after a full stop still fails", () => {
    const p = tmp(
      "start.md",
      "The action is on one side.\nRight, so the ring need not be commutative.\n",
    );
    expect(checkScholarlyDefault(p, undefined).result).toBe("fail");
  });
  test("an opener at the very first line still fails", () => {
    expect(
      checkScholarlyDefault(tmp("first.md", "Okay so the map is defined.\n"), undefined).result,
    ).toBe("fail");
  });
  test("an opener after a blank line still fails", () => {
    const p = tmp("para.md", "A closing sentence\n\nBasically, the map is defined.\n");
    expect(checkScholarlyDefault(p, undefined).result).toBe("fail");
  });
});


// ── b7yo: the two false positives that survived the profile axis ────
//
// Both were found by running the real sweep over `content/docs/`
// (a document-profile corpus) after PR #256 made the profile gate fire.
// Neither is a scoping problem, so no gate change clears them — the
// criteria themselves over-match.

import {
  checkStatusLeak,
  checkAuthorNotesPollution,
} from "../../content/pipeline/qa-checkers-voice.ts";

const leak = (line: string) => checkStatusLeak(tmp("leak.md", line)).result;
const notes = (line: string) => checkAuthorNotesPollution(tmp("notes.md", line)).result;

describe("checkAuthorNotesPollution — a measurement's date is provenance, not pollution", () => {
  test("the AGENTS.md-mandated form passes", () => {
    // AGENTS.md: "a number without its date and command is a claim, not
    // evidence". P4 was firing on the house style it must coexist with.
    expect(notes("**precision 71%** — measured 2026-09-18 on main.")).toBe("pass");
    expect(notes("Re-measured 2026-09-18: the arc is 274 to 195.")).toBe("pass");
  });

  test("a bare status date still FAILS", () => {
    // The exemption is bound to `measured`, not to dates generally.
    expect(notes("As of 2026-05-28 this remains open.")).toBe("fail");
    expect(notes("Blocked since 2026-05-28.")).toBe("fail");
  });

  test("the exemption cannot reach across a sentence boundary", () => {
    // Bounded by [^.\n] so a nearby `measured` cannot launder an
    // unrelated date in the next sentence.
    expect(notes("We measured throughput. As of 2026-05-28 it is unfixed.")).toBe("fail");
  });

  test("other author-notes patterns on a measured line are unaffected", () => {
    // The strip must not hide a second, genuine hit on the same line.
    expect(notes("Measured 2026-09-18 by Claude on main.")).toBe("fail");
  });
});

describe("checkStatusLeak — a definition table's label cell names a term", () => {
  test("a checkpoint name in a label cell passes", () => {
    // `roles.md:46` — a row in a table OF CHECKPOINT NAMES.
    expect(
      leak("| **Needs review** (Phase 1) | Confirm the BA's needs statement |"),
    ).toBe("pass");
  });

  test("a status marker in the DEFINITION half still FAILS", () => {
    // Only the first cell is masked.
    expect(leak("| **Phase 1** | (TODO) write the needs statement |")).toBe("fail");
  });

  test("a label cell that is not purely a label still FAILS", () => {
    // The cell must be a bolded term plus an optional parenthetical.
    // Prose in a table is still prose.
    expect(leak("| **Pending.** the proof is stalled | see below |")).toBe("fail");
  });

  test("the same text outside a table still FAILS", () => {
    // The exemption is about table structure, not about the phrase.
    expect(leak("**Needs review** before we ship.")).toBe("fail");
  });
});

describe("checkEditorializing — proof economy is not an opinion (bean 2t41)", () => {
  // `voice-editorializing` failed the paper the `expo-milnor-clarity` strict gate
  // is NAMED after: 26 hits across 11 of the 20 pages of Milnor's "Link Groups"
  // (Annals of Mathematics 59(2), 1954), ingested as `library/milnorlink/`.
  //
  // The bean recorded 14, having counted only `clearly`. Measured in full the 26
  // split three ways, and only the third is a defect:
  //   ~20  proof economy — routing the reader away from a routine verification
  //     4  terms of art — `naturally isomorphic`, where the adverb is the name
  //     1  genuine — "Unfortunately these invariants are not strong enough" (p194)
  //
  // Editorializing spends the reader's attention on the author's opinion. Proof
  // economy spends none and saves some. They are opposite moves that share a
  // vocabulary.

  test("sentence-initial: the exemplar's own opening case passes", () => {
    expect(
      ed("Clearly the relation of homotopy is reflexive, symmetric and transitive."),
    ).toBe("pass");
  });

  test("predicative `is clearly` and bare `is clear` pass", () => {
    expect(ed("The inclusion map is clearly a homotopy equivalence.")).toBe("pass");
    expect(ed("This is clear for the case n = 0.")).toBe("pass");
  });

  test("the `it is easy to see` frame passes", () => {
    expect(ed("it is easy to see that ai is unique and well-defined")).toBe("pass");
  });

  test("adverb and verb pass in EITHER order, with auxiliaries between", () => {
    // Both directions occur in the exemplar; neither is the author's opinion.
    expect(ed("The parallel can clearly be represented by a loop.")).toBe("pass");
    expect(ed("it follows easily that L is trivial.")).toBe("pass");
    expect(ed("It clearly maps JG onto S.")).toBe("pass");
    expect(ed("It is easily verified that the kernel is [A].")).toBe("pass");
  });

  test("`naturally isomorphic` passes — the adverb IS the name", () => {
    // A *natural* isomorphism is a specific thing in category theory, not an
    // isomorphism the author happens to admire. `MATH_IDIOM_EXEMPT` covers
    // adverb + article + noun; this is adverb + adjective, which it does not.
    expect(ed("The group is naturally isomorphic to G(Lt).")).toBe("pass");
    expect(ed("The action is properly discontinuous.")).toBe("pass");
  });

  test("THE EXEMPTION IS THE CONSTRUCTION, NOT THE WORD", () => {
    // The bean's own stated test case, and the reason this is a strip rather
    // than a whole-line skip: the `Clearly` is removed and the value judgement
    // in the same clause still fails. `clearly` before a claim the reader cannot
    // check in their head is the real defect, and no phrase list separates the
    // two — this invariant is what stands in for that.
    expect(ed("Clearly this is the most important result in the field.")).toBe(
      "fail",
    );
  });

  test("the genuine set still fails", () => {
    expect(ed("Unfortunately these invariants are not strong enough.")).toBe("fail");
    expect(ed("Surprisingly, the two constructions agree.")).toBe("fail");
    expect(ed("This is a beautiful result.")).toBe("fail");
    expect(ed("It is worth noting that the map is injective.")).toBe("fail");
  });

  test("a bare superlative now fails — it did not before", () => {
    // Found while fixing this: the criterion's description says "Results speak
    // for themselves", but the regex only matched `perhaps the most …`, so a
    // plain superlative passed. Adding it is what lets the proof-economy strip
    // be safe, because the surviving hit is what fails the bean's test case.
    expect(ed("This is the most important result in the field.")).toBe("fail");
    expect(ed("The single most striking consequence follows.")).toBe("fail");
  });

  test("a hard wrap cuts the idiom BOTH ways", () => {
    // Measured: p178 "…is just the" / "commutator subgroup [A]…" and p193
    // "…Wi,ri clearly" / "represents the ith parallel…". In both, the line holds
    // only the head and the rest is on the next — the mirror of the comparative
    // lookback, which handles the head being on the line before.
    expect(
      checkEditorializing(
        tmp("wrap-head.md", "the subgroup E of G is just the\ncommutator subgroup [A] of the kernel\n"),
      ).result,
    ).toBe("pass");
    expect(
      checkEditorializing(
        tmp("wrap-adv.md", "as = a' and Wi = WiJ ... Wi,ri clearly\nrepresents the ith parallel\n"),
      ).result,
    ).toBe("pass");
  });

  test("the exemplar scores exactly ONE finding — not zero", () => {
    // The gate this change was verified against, and the direction that would
    // have meant over-correcting. A criterion that never fires on its own
    // exemplar has stopped measuring anything; the survivor is p194's
    // "Unfortunately", which is a real finding.
    // READ from the declaration. `milnorlink` went to `folio-assistant-sci/` in
    // bean `frs5` — it is not an IRIS item — and `readdirSync` on the old path
    // throws, which is at least loud; a checker counting zero hits over a
    // directory that is not there would have been worse, because the
    // assertion is a count.
    const entry = libraryEntry("milnorlink");
    expect(entry, "milnorlink is not in any declared library").toBeDefined();
    const dir = join(entry!, "sections");
    let hits = 0;
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".md")) continue;
      hits += checkEditorializing(join(dir, f)).hits.length;
    }
    expect(hits).toBe(1);
  });
});
