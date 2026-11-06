/**
 * LSI over Lean declarations — bean `folio-assistant-ec2a`, step 2.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DECL_INDEX_OPTIONS, declUnits, declUnitsOf, docCommentBefore, lsiNearUnits, nameWords } from "../lsi-lean-decls.ts";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const SRC = `import Mathlib

namespace QOU.Mass

/-- The convention-D Markov parameter. -/
noncomputable def markovZ_conventionD (q : ℝ) : ℝ := q ^ 3 / (q ^ 2 + 1)

-- a line comment, not a doc comment
theorem markovZ_pos (q : ℝ) (hq : 0 < q) : 0 < markovZ_conventionD q := by
  unfold markovZ_conventionD; positivity

end QOU.Mass

theorem _root_.topLevelFact : True := trivial
`;

describe("one Lean source", () => {
  test("declarations are qualified by their namespace and module", () => {
    const ids = declUnitsOf(SRC, "QOU.Mass.Markov").map((u) => u.id);
    expect(ids).toEqual([
      "QOU.Mass.markovZ_conventionD@QOU.Mass.Markov",
      "QOU.Mass.markovZ_pos@QOU.Mass.Markov",
      "topLevelFact@QOU.Mass.Markov",
    ]);
  });

  test("a unit carries the doc comment, the split name and the signature — not the proof", () => {
    const [def, thm] = declUnitsOf(SRC, "M");
    expect(def!.text).toContain("The convention-D Markov parameter.");
    expect(def!.text).toContain("markov z convention d");
    expect(thm!.text).not.toContain("positivity");
    expect(thm!.text).not.toContain("a line comment");
  });

  test("nameWords splits camel case and underscores", () => {
    expect(nameWords("QOU.Mass.markovZ_conventionD")).toBe("markov z convention d");
    expect(nameWords("HTMLParser_ok")).toBe("html parser ok");
  });

  test("a doc comment is found across attributes and modifiers, and a line comment is not one", () => {
    const raw = "/-- doc -/\n@[simp] noncomputable def x := 1";
    expect(docCommentBefore(raw, raw.indexOf("def"))).toBe("doc");
    expect(docCommentBefore("-- c\ndef y := 1", 5)).toBe("");
  });
});

describe("a Lean root", () => {
  test("modules come from the path, .lake is skipped, and a repeated id is counted not overwritten", () => {
    const root = mkdtempSync(join(tmpdir(), "lsi-lean-"));
    dirs.push(root);
    mkdirSync(join(root, "QOU", "Mass"), { recursive: true });
    mkdirSync(join(root, ".lake", "packages"), { recursive: true });
    writeFileSync(join(root, "QOU", "Mass", "Markov.lean"), SRC + "\ntheorem _root_.topLevelFact : True := trivial\n");
    writeFileSync(join(root, ".lake", "packages", "Skip.lean"), "theorem skipped : True := trivial\n");
    const d = declUnits([root]);
    expect(d.files).toBe(1);
    expect(d.units.map((u) => u.id)).toContain("topLevelFact@QOU.Mass.Markov");
    expect(d.units.some((u) => u.id.includes("skipped"))).toBe(false);
    expect(d.duplicates).toEqual(["topLevelFact@QOU.Mass.Markov"]);
  });
});

describe("lsiNearUnits (the `lean-decl` provider for cross-graph lsi:near)", () => {
  test("with no Lean root it is not searched, never an empty index", () => {
    const r = lsiNearUnits({ checkoutRoot: "/nowhere", roots: [] });
    expect(r.notSearched).toBe("no Lean root given (--root lean-decl=<dir>)");
    expect(r.units).toEqual([]);
  });

  test("a namespaced name and the full id are explicit references; a bare top-level name is not", () => {
    const root = mkdtempSync(join(tmpdir(), "lsi-decl-near-"));
    dirs.push(root);
    mkdirSync(join(root, "QOU", "Mass"), { recursive: true });
    writeFileSync(join(root, "QOU", "Mass", "X.lean"), SRC);
    const r = lsiNearUnits({ checkoutRoot: "/nowhere", roots: [root] });
    expect(r.buildOptions).toBe(DECL_INDEX_OPTIONS);
    const keys = new Map(r.refKeys!.map(([k, id]) => [k, id]));
    expect(keys.get("QOU.Mass.markovZ_pos")).toBe("QOU.Mass.markovZ_pos@QOU.Mass.X");
    expect(keys.get("QOU.Mass.markovZ_pos@QOU.Mass.X")).toBe("QOU.Mass.markovZ_pos@QOU.Mass.X");
    const top = r.units.map((u) => u.id).find((id) => !id.slice(0, id.lastIndexOf("@")).includes("."));
    if (top) expect(keys.get(top.slice(0, top.lastIndexOf("@")))).toBeUndefined();
  });
});
