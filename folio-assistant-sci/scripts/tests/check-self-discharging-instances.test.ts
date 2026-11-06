import { describe, expect, test } from "bun:test";
import {
  splitInstanceHead,
  propDeclNames,
  looksPropositional,
  isUnconditional,
  isTrivialDischarge,
  parseLean,
} from "../check-self-discharging-instances.ts";

/**
 * Every test below pins a bug that was live in the first version, found by
 * running the checker against the file it was written for and getting **zero**.
 * A checker that returns a clean zero without examining anything is
 * indistinguishable from one that passed.
 */

describe("splitInstanceHead — binder colons", () => {
  test("splits at the colon OUTSIDE the binders", () => {
    // The original `[^:]*` regex stopped at the colon inside `(R : Type u)`
    // and produced the wrong result class, so nothing was ever flagged.
    const r = splitInstanceHead("canonical (R : Type u) : GBFiltrationCollapsesAtE2 R");
    expect(r).not.toBeNull();
    expect(r!.name).toBe("canonical");
    expect(r!.className).toBe("GBFiltrationCollapsesAtE2");
  });

  test("handles instance-implicit and implicit binders", () => {
    const r = splitInstanceHead("foo {α : Type*} [CommRing α] (n : ℕ) : MyClass α n");
    expect(r!.name).toBe("foo");
    expect(r!.className).toBe("MyClass");
    expect(r!.binders).toContain("[CommRing α]");
  });

  test("anonymous instance has no leading name", () => {
    const r = splitInstanceHead("(R : Type u) : HasThing R");
    expect(r!.name).toBe("«anonymous»");
    expect(r!.className).toBe("HasThing");
  });

  test("no top-level colon yields null rather than a wrong answer", () => {
    expect(splitInstanceHead("mangled (R : Type u)")).toBeNull();
  });
});

describe("propDeclNames — result colon, not binder colon", () => {
  test("finds a Prop-valued def whose binders contain colons", () => {
    // The original `[^:]*` could not span `{R : Type u} (S : Foo R)`.
    const src = "def CollapsesAt {R : Type u} (S : Foo R) (r₀ : ℕ) : Prop :=\n  True\n";
    expect(propDeclNames(src)).toContain("CollapsesAt");
  });

  test("finds abbrev and ignores non-Prop defs", () => {
    const src = [
      "abbrev CollapsesAtE2 {R : Type u} (S : Foo R) : Prop := CollapsesAt S 2",
      "def notAClaim (R : Type u) : Type u := R",
    ].join("\n");
    const names = propDeclNames(src);
    expect(names).toContain("CollapsesAtE2");
    expect(names).not.toContain("notAClaim");
  });
});

describe("looksPropositional", () => {
  test("inline propositions", () => {
    expect(looksPropositional("q0 > 1")).toBe(true);
    expect(looksPropositional("∀ A, w A = 3")).toBe(true);
  });

  test("a NAMED predicate needs the package's Prop set", () => {
    // This is what made the checker miss its own flagship case.
    expect(looksPropositional("CollapsesAtE2 ss")).toBe(false);
    expect(looksPropositional("CollapsesAtE2 ss", new Set(["CollapsesAtE2"]))).toBe(true);
  });

  test("data fields are not claims", () => {
    expect(looksPropositional("Type u")).toBe(false);
    expect(looksPropositional("M → ℝ")).toBe(false);
  });
});

describe("isUnconditional", () => {
  test("type and instance binders only", () => {
    expect(isUnconditional(" (R : Type u) ")).toBe(true);
    expect(isUnconditional(" {α : Type*} [CommRing α] ")).toBe(true);
  });

  test("an explicit PROOF OBLIGATION makes it conditional, and fine", () => {
    // `instance foo (hq : q ≠ 1) : C X` is legitimate — the caller supplies it.
    expect(isUnconditional(" (R : Type u) (hq : q ≠ 1) ")).toBe(false);
    // A named predicate needs the package Prop set, same as field types.
    expect(isUnconditional(" (h : MyClaim R) ")).toBe(true);
    expect(isUnconditional(" (h : MyClaim R) ", new Set(["MyClaim"]))).toBe(false);
  });

  test("a DATA parameter does not make it conditional", () => {
    // `instance foo (n : ℕ) : C n` is still supplied for free at every `n` —
    // resolution fills `n` from the goal. Requiring `Type` here was too strict
    // and hid three of the seven known cases in QOU/Mathlib/SpectralSequence.
    expect(isUnconditional(" (R : Type u) (n : ℕ) ")).toBe(true);
  });

  test("nested parens in a binder type are handled", () => {
    // `[^()]*` could not span `(bar R)`, so the binder was skipped entirely and
    // a conditional instance was reported as unconditional.
    expect(isUnconditional(" (h : MyClaim (bar R)) ", new Set(["MyClaim"]))).toBe(false);
  });
});

describe("isTrivialDischarge", () => {
  test("by-construction proofs", () => {
    expect(isTrivialDischarge("rfl")).toBe(true);
    expect(isTrivialDischarge("fun _ => rfl")).toBe(true);
    expect(isTrivialDischarge("fun _ _ _ => rfl")).toBe(true);
    expect(isTrivialDischarge("hf.out")).toBe(true);
  });

  test("a real proof term is not trivial", () => {
    expect(isTrivialDischarge("q_zero_gt_one")).toBe(false);
    expect(isTrivialDischarge("lt_of_lt_of_le zero_lt_one h")).toBe(false);
  });
});

describe("end-to-end", () => {
  const src = [
    "def CollapsesAt {R : Type u} (S : Foo R) (r₀ : ℕ) : Prop := True",
    "abbrev CollapsesAtE2 {R : Type u} (S : Foo R) : Prop := CollapsesAt S 2",
    "",
    "class GBFiltrationCollapsesAtE2 (R : Type u) where",
    "  ss : Foo R",
    "  collapses : CollapsesAtE2 ss",
    "",
    "instance canonical (R : Type u) : GBFiltrationCollapsesAtE2 R where",
    "  ss := trivial R",
    "  collapses := trivial_collapses_at_E2 R",
    "",
    "instance conditional (R : Type u) (h : CollapsesAtE2 (bar R)) :",
    "    GBFiltrationCollapsesAtE2 R where",
    "  ss := bar R",
    "  collapses := h",
  ].join("\n");

  test("catches the unconditional instance of a claim-carrying class", () => {
    const names = new Set(propDeclNames(src));
    const { classes, instances } = parseLean(src, "t.lean", names);
    const cls = new Map(classes.map((c) => [c.name, c]));
    const caught = instances.filter((i) => {
      const c = cls.get(i.className);
      return c && c.propFields.length > 0 && isUnconditional(i.binders, names);
    });
    expect(caught.map((c) => c.name)).toEqual(["canonical"]);
  });

  test("does NOT flag the conditional instance beside it", () => {
    // The discriminator must not become a blanket flag on the class.
    const names = new Set(propDeclNames(src));
    const { instances } = parseLean(src, "t.lean", names);
    const cond = instances.find((i) => i.name === "conditional");
    expect(cond).toBeDefined();
    expect(isUnconditional(cond!.binders, names)).toBe(false);
  });
});
