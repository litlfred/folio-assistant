/**
 * Parser tests for the mirror-drift audit.
 *
 * The parser is the whole risk surface of this checker: a sloppier version of
 * it, written ad hoc, reported 167 same-FQN pairs and 50 drifted where the real
 * figures are 148 and 45 (bean `qou-u87j`). Every case below is one of the four
 * mistakes that scan made, kept as a test so the numbers stay trustworthy.
 */
import { test, expect, describe } from "bun:test";
import { parseLeanDecls } from "../check-mirror-drift.ts";

const F = "/tmp/x.lean";

describe("parseLeanDecls", () => {
  test("reads fields and the enclosing namespace", () => {
    const [d] = parseLeanDecls(
      F,
      `namespace QOU.Torsion

structure MassIdentity (R : Type*) where
  connectionGradient : M → R
  vortexCycle : Set M
  cycle_nonempty : vortexCycle.Nonempty

end QOU.Torsion
`,
    );
    expect(d.fqn).toBe("QOU.Torsion.MassIdentity");
    expect(d.kind).toBe("structure");
    expect(d.fields).toEqual([
      "connectionGradient",
      "vortexCycle",
      "cycle_nonempty",
    ]);
  });

  test("instance-implicit fields count, and their brackets are stripped", () => {
    const [d] = parseLeanDecls(
      F,
      `structure CRManifoldData where
  M : Type*
  [topM : TopologicalSpace M]
  n : ℕ
`,
    );
    expect(d.fields).toEqual(["M", "topM", "n"]);
  });

  // Mistake 1 — the expensive one. `section Foo … end Foo` is indistinguishable
  // from a namespace at the regex level, so a parser that pops only on
  // `end <name>` against a namespace-only stack mis-attributes every
  // declaration after the first named section: it invents collisions where
  // there are none and hides the real ones.
  test("a named section does not corrupt the namespace of later declarations", () => {
    const decls = parseLeanDecls(
      F,
      `namespace QOU

section Helpers

structure Inside where
  a : ℕ

end Helpers

structure After where
  b : ℕ

end QOU
`,
    );
    expect(decls.map((d) => d.fqn)).toEqual(["QOU.Inside", "QOU.After"]);
  });

  test("an anonymous section is popped too", () => {
    const decls = parseLeanDecls(
      F,
      `namespace QOU
section
structure A where
  a : ℕ
end
structure B where
  b : ℕ
end QOU
`,
    );
    expect(decls.map((d) => d.fqn)).toEqual(["QOU.A", "QOU.B"]);
  });

  // Mistake 2 — docstrings are full of prose that matches `name :`.
  test("docstring and comment lines are not read as fields", () => {
    const [d] = parseLeanDecls(
      F,
      `structure VolumeFromRigidity where
  /-- The projection \`π : V ⊗ V ↠ Λ²V\`.
      note : this line looks exactly like a field. -/
  projection : X ⟶ Y
  -- comment : also not a field
  volumeIso : Y ≅ Z
`,
    );
    expect(d.fields).toEqual(["projection", "volumeIso"]);
  });

  // Mistake 3 — inherit-vs-inline is a real difference, but it is not field
  // drift, and conflating them made the old scan's diffs unreadable.
  test("extends is captured, on the head line and wrapped onto the next", () => {
    const [inline, wrapped] = parseLeanDecls(
      F,
      `structure A extends B, C where
  x : ℕ

structure D
    extends E where
  y : ℕ
`,
    );
    expect(inline.extends).toEqual(["B", "C"]);
    expect(inline.fields).toEqual(["x"]);
    expect(wrapped.extends).toEqual(["E"]);
    expect(wrapped.fields).toEqual(["y"]);
  });

  test("a dedented declaration closes the previous body", () => {
    const decls = parseLeanDecls(
      F,
      `structure A where
  a : ℕ

def notAField : ℕ := 0

structure B where
  b : ℕ
`,
    );
    expect(decls.map((d) => [d.fqn, d.fields])).toEqual([
      ["A", ["a"]],
      ["B", ["b"]],
    ]);
  });

  test("classes are parsed like structures, and nested namespaces concatenate", () => {
    const [d] = parseLeanDecls(
      F,
      `namespace QOU
namespace LiftingDescent
class MotivicGaloisCharacter (K0 : Type*) where
  frobenius_at : Nat.Primes → Mhat
end LiftingDescent
end QOU
`,
    );
    expect(d.fqn).toBe("QOU.LiftingDescent.MotivicGaloisCharacter");
    expect(d.kind).toBe("class");
    expect(d.fields).toEqual(["frobenius_at"]);
  });

  test("field order is significant — a reordering is drift, not a match", () => {
    const [a] = parseLeanDecls(F, `structure S where\n  x : ℕ\n  y : ℕ\n`);
    const [b] = parseLeanDecls(F, `structure S where\n  y : ℕ\n  x : ℕ\n`);
    expect(a.fields).not.toEqual(b.fields);
  });

  test("records the head line so a finding can be clicked to source", () => {
    const [d] = parseLeanDecls(F, `\n\n\nstructure S where\n  x : ℕ\n`);
    expect(d.line).toBe(4);
  });
});
