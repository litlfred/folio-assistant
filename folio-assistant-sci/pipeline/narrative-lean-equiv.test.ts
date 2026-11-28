import { describe, test, expect } from "bun:test";
import {
  extractKind,
  extractMdDeclaredKind,
  extractMdStatement,
  checkEquivalence,
} from "./proof-narrative-lean-equiv-sweep";

/**
 * `checkEquivalence` took `mdText` as its first parameter and never read it,
 * so a sweep named *narrative*–Lean equivalence compared only `.ts` metadata
 * against `.lean` declarations. These pin the narrative half.
 *
 * Semantic comparison (quantifiers, hypotheses, conclusion) is the criterion's
 * registry contract and stays an AGENT job. What is pinned here is only what a
 * script can decide without understanding the mathematics — and, crucially,
 * that it stays SILENT when the narrative makes no checkable claim. A noisy
 * checker is worse than a missing one.
 */

const THEOREM_LEAN = "theorem foo_bar (n : Nat) : n = n := rfl\n";

describe("extractKind", () => {
  test("kindFromBuilderCall", () => {
    expect(extractKind('export default definition({\n  label: "def:x",\n});')).toBe("definition");
    expect(extractKind('export default conjecture({\n  label: "conj:x",\n});')).toBe("conjecture");
  });

  test("kindNotFooledByAuthorNotes", () => {
    // The live bug: a bare /kind:\s*"(\w+)"/ ran FIRST and matched the author
    // note, so every block carrying one was typed `note` / `caveat` / `status`
    // and the kind-vs-declaration checks compared against the wrong kind.
    // On the qou corpus this alone accounted for 118 of 137 warnings.
    const ts = `export default definition({
  authorNotes: [
    { kind: "note", body: "Lean sibling: archimedean specialisation." },
  ],
  label: "def:h2-molecular-braid",
});`;
    expect(extractKind(ts)).toBe("definition");
  });

  test("kindFromTopLevelField", () => {
    expect(extractKind('  kind: "remark",\n')).toBe("remark");
  });
});

describe("extractMdDeclaredKind", () => {
  test("mdKindFromBoldDeclaration", () => {
    expect(extractMdDeclaredKind("**Proposition.** Every gadget is flat.")).toBe("proposition");
    expect(extractMdDeclaredKind("**Conjecture.** *V is the valley.*")).toBe("conjecture");
  });

  test("mdKindFromEnvAndHeading", () => {
    expect(extractMdDeclaredKind("\\begin{theorem}\nx\n\\end{theorem}")).toBe("theorem");
    expect(extractMdDeclaredKind("### Lemma\n\nx")).toBe("lemma");
  });

  test("mdKindParentheticalForm", () => {
    expect(
      extractMdDeclaredKind("**Proposition (conditional on [`conj:x`](#conj:x)).**\n\nBody."),
    ).toBe("proposition");
  });

  test("mdKindUndefinedWithoutDeclaration", () => {
    // The quiet case, and the majority of blocks.
    expect(extractMdDeclaredKind("The braid group acts on the tower.")).toBeUndefined();
  });

  test("mdKindIgnoresFencedCode", () => {
    expect(extractMdDeclaredKind("```\n**Theorem.** not prose\n```\n\nReal prose.")).toBeUndefined();
  });
});

describe("extractMdStatement", () => {
  test("statementAfterBoldMarker", () => {
    expect(extractMdStatement("**Theorem.** Every gadget is flat.")).toBe("Every gadget is flat.");
  });

  test("statementFallsBackToFirstLine", () => {
    expect(extractMdStatement("# Title\n\n> quote\n\nThe real claim.")).toBe("The real claim.");
  });

  test("loneLabelNotStatement", () => {
    expect(extractMdStatement("**Theorem.**\n")).toBeUndefined();
  });

  test("headingsDirectivesOnlyUndefined", () => {
    expect(extractMdStatement("# Heading\n\n:::note\n:::\n\n## Another\n")).toBeUndefined();
  });
});

describe("checkEquivalence — narrative side", () => {
  const ts = (builder: string, label: string) =>
    `export default ${builder}({\n  label: "${label}",\n});`;

  test("warnsNarrativeStrongerThanMetadata", () => {
    // Live example: conj:hydrogen-shell-writhe is `conjecture(...)` while its
    // .md opens "**Proposition (conditional on …).**" — a reader-facing overclaim.
    const r = checkEquivalence(
      "**Proposition.** The shell writhe is quantised.",
      THEOREM_LEAN,
      ts("conjecture", "conj:hydrogen-shell-writhe"),
    );
    expect(r.result).toBe("warn");
    expect(r.evidence).toContain("proposition");
    expect(r.evidence).toContain("conjecture");
  });

  test("warnsRemarkStatingConjecture", () => {
    // Live example: rem:periodic-table-demand. §3a — a remark making a formal
    // claim should be promoted or carry `interprets:`.
    const r = checkEquivalence(
      "**Conjecture.** *V coincides with the valley of stability.*",
      THEOREM_LEAN,
      ts("remark", "rem:periodic-table-demand"),
    );
    expect(r.result).toBe("warn");
    expect(r.notes).toContain("kind mismatch");
  });

  test("noWarnWithinProvableFamily", () => {
    // "Theorem" over a block typed `proposition` is house style, not a defect.
    const r = checkEquivalence(
      "**Theorem.** Every gadget is flat.",
      THEOREM_LEAN,
      ts("proposition", "prop:gadget-flat"),
    );
    expect(r.result).not.toBe("warn");
  });

  test("noWarnWithoutSelfDeclaration", () => {
    const r = checkEquivalence(
      "Every gadget is flat, by the tower argument.",
      THEOREM_LEAN,
      ts("proposition", "prop:gadget-flat"),
    );
    expect(r.result).not.toBe("warn");
  });

  test("warnsProvableWithEmptyNarrative", () => {
    const r = checkEquivalence(
      "# Heading\n\n:::note\n:::\n",
      THEOREM_LEAN,
      ts("theorem", "thm:empty-narrative"),
    );
    expect(r.result).toBe("warn");
    expect(r.evidence).toContain("no statement");
  });

  test("emptyNarrativeNonProvableIgnored", () => {
    const r = checkEquivalence("# Heading\n", THEOREM_LEAN, ts("remark", "rem:x"));
    expect(r.evidence ?? "").not.toContain("no statement");
  });
});
