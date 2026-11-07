/**
 * The `mathpaper` vocabulary module keeps cat-harness's contract
 * (`vocabulary-modules.ts`): one schema per kind this layer's block-kind
 * nodes declare, and its builders build blocks those schemas accept.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readVocabulary } from "@litlfred/cat-harness-tools/schemas/content/vocabulary-modules.ts";
import * as mathpaper from "./mathpaper-vocabulary.ts";

const ROOT = join(import.meta.dir, "..");
const declared = readdirSync(join(ROOT, "block-kinds"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(ROOT, "block-kinds", f), "utf-8")) as { kind: string; adapter: string })
  .filter((n) => n.adapter === "mathpaper")
  .map((n) => n.kind);
const adapter = JSON.parse(readFileSync(join(ROOT, "content-adapters", "mathpaper.json"), "utf-8")) as { vocabulary?: string };

describe("the mathpaper vocabulary module", () => {
  test("is the module the adapter node names", () => {
    expect(adapter.vocabulary).toBe("schemas/mathpaper-vocabulary.ts");
  });

  test("types exactly the kinds this layer declares, and keeps the contract", () => {
    const v = readVocabulary("mathpaper", adapter.vocabulary!, mathpaper, declared);
    expect([...v.schemas.keys()].sort()).toEqual([...declared].sort());
    expect(v.constraintRules.map((r) => r.id).sort()).toEqual(["lean-file-exists", "lean-stub-conjecture-kind-check", "mathpaper-md-exists", "provable-lean-warning"]);
  });

  test("each builder builds a block its schema accepts, and a label of the wrong kind is refused", () => {
    expect(mathpaper.theorem({ label: "thm:x", title: "X" }).kind).toBe("theorem");
    expect(mathpaper.proof({ label: "prf:x", of: "thm:x" }).of).toBe("thm:x");
    expect(mathpaper.definition({ label: "def:widget" }).lean.ref).toBe("qou:QOU.Widget");
    expect(() => mathpaper.lemma({ label: "thm:x" })).toThrow();
    for (const name of Object.keys(mathpaper.builders)) expect(declared).toContain(name);
  });

  test("conjecture() supports formal | identification classification and rejects conflicts", () => {
    const bare = mathpaper.conjecture({ label: "conj:bare", title: "Bare" });
    expect(bare.kind).toBe("conjecture");
    expect(bare.conjectureKind).toBeUndefined();

    const formal = mathpaper.conjecture({
      label: "conj:spectral-gap",
      title: "Spectral gap",
      conjectureKind: "formal",
      lean: { ref: "qou:QOU.SpectralGap" },
    });
    expect(formal.conjectureKind).toBe("formal");

    const viaAlias = mathpaper.conjecture({
      label: "conj:mass-match",
      title: "Numerical mass identification",
      formality: "identification",
    });
    expect(viaAlias.conjectureKind).toBe("identification");
    expect(viaAlias.formality).toBe("identification");

    expect(() =>
      mathpaper.conjecture({
        label: "conj:conflict",
        conjectureKind: "formal",
        formality: "identification",
      }),
    ).toThrow(/conflicting conjectureKind/);

    expect(() =>
      mathpaper.conjecture({
        label: "conj:bad-kind",
        conjectureKind: "speculative" as never,
      }),
    ).toThrow();
  });

  test("contributes the Lean constraint context its rules read (bean saqd)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "mathpaper-ctx-"));
    try {
      mkdirSync(join(tmp, "ch"), { recursive: true });
      mkdirSync(join(tmp, "lake", "Pkg", "Deep"), { recursive: true });
      writeFileSync(join(tmp, "ch", "def-a.lean"), "-- conjectural sibling stub\n");
      writeFileSync(join(tmp, "lake", "Pkg", "Deep", "Widget.lean"), "def w := 1\n");
      const perBlock = mathpaper.constraintContext({ repoRoot: tmp });
      const a = perBlock({ rootName: "def-a", dir: join(tmp, "ch") });
      expect(a.leanContent).toBe("-- conjectural sibling stub\n");
      expect(perBlock({ rootName: "def-b", dir: join(tmp, "ch") }).leanContent).toBeUndefined();
      expect(a.lakeTreeContainsBasename?.("lake", "Widget.lean")).toBe(true);
      expect(a.lakeTreeContainsBasename?.("lake", "Gadget.lean")).toBe(false);
      expect(a.lakeTreeContainsBasename?.("no-such-root", "Widget.lean")).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
