/**
 * The declared merge-conflict patterns and the region resolver (bean `y7b3`).
 *
 * The refusals are the point: each test that resolves has a sibling showing
 * the unsafe neighbour is refused, because a resolver proven only on the
 * cases it handles is proven against its author's optimism.
 */
import { describe, expect, test } from "bun:test";

import { plan } from "../merge-base.js";
import { classify, PATTERNS, resolveGeneratedRegions } from "../merge-conflict-patterns.js";

describe("classify", () => {
  test("measured generated families resolve by their declared strategy", () => {
    expect(classify("cat-harness/test/results/skill-register.qa-results.json").pattern?.id).toBe("qa-results");
    expect(classify("cat-harness/test/results/lsi/cat-harness/skills.lsi.json").strategy).toBe("take-base");
    expect(classify("cat-harness/docs/cat-harness/docs-auto/index/index.html").pattern?.id).toBe("docs-auto");
    expect(classify("cat-harness/docs/glossary/index.md").pattern?.id).toBe("glossary");
    expect(classify("beans/README.md").strategy).toBe("generated-regions");
  });

  test("a kg-qa sidecar is delegated, not taken: it may carry an attestation", () => {
    // Order matters: it is ALSO under test/results, and must not fall through
    // to a take-base family that would drop a recorded adjudication.
    expect(classify("cat-harness/test/results/kg-qa/skills/x.kg-qa.json").strategy).toBe("qa-sidecar");
  });

  test("a kg-qa MANIFEST is taken, though the sidecars it indexes are delegated", () => {
    // It holds the auditor's script hash and nothing else; found by replaying
    // real merges, where one refused on these files alone.
    expect(classify("fhir-harness/test/results/kg-qa.manifest.json").pattern?.id).toBe("kg-qa-manifest");
    expect(classify("cat-harness/test/results/bootstrap/kg-qa.manifest.json").pattern?.id).toBe("kg-qa-manifest");
  });

  test("translated glossaries and viewer pages are taken; their authored neighbours are not", () => {
    for (const l of ["ar", "es", "fr", "ru", "zh"]) {
      expect(classify(`cat-harness/docs/${l}/glossary/index.md`).pattern?.id).toBe("translated-glossary");
    }
    expect(classify("cat-harness/docs/external-schemas/index.md").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/docs/processes/index.md").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/docs/processes/merge-base.md").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/docs/translation-status/index.html").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/docs/methodologies/index.md").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/docs/cat-harness/published-graphs.md").pattern?.id).toBe("handler-index");
    expect(classify("cat-harness/test/health/results/repository.health-report.json").pattern?.id).toBe("health-report");
    // Authored neighbours: a methodology page itself, and the health producer.
    expect(classify("cat-harness/docs/methodologies/prov-o.md").strategy).toBe("refuse");
    expect(classify("cat-harness/test/health/run.ts").strategy).toBe("refuse");
    // The unsafe neighbours: authored translations, and a locale no generator writes.
    expect(classify("cat-harness/docs/ar/index.md").strategy).toBe("refuse");
    expect(classify("cat-harness/docs/fr/getting-started.md").strategy).toBe("refuse");
    expect(classify("cat-harness/docs/de/glossary/index.md").strategy).toBe("refuse");
  });

  test("a path no pattern names is REFUSED, with no pattern attached", () => {
    const c = classify("cat-harness/scripts/merge-base.ts");
    expect(c.strategy).toBe("refuse");
    expect(c.pattern).toBeUndefined();
  });

  test("authored families are refused BY DECLARATION, with the reason", () => {
    const b = classify("beans/defs/folio-assistant-x--y.md");
    expect(b.strategy).toBe("refuse");
    expect(b.pattern?.why).toContain("Authored");
  });

  test("every pattern says why", () => {
    for (const p of PATTERNS) expect(p.why.length).toBeGreaterThan(20);
  });
});

describe("plan is all-or-nothing input", () => {
  test("one authored conflict among generated ones is reported as refused", () => {
    const p = plan(["cat-harness/docs/glossary/index.md", "cat-harness/scripts/merge-base.ts"]);
    expect(p.resolvable.map((c) => c.path)).toEqual(["cat-harness/docs/glossary/index.md"]);
    expect(p.refused.map((c) => c.path)).toEqual(["cat-harness/scripts/merge-base.ts"]);
  });
});

const README = (hunk: string) =>
  [
    "# Title",
    "",
    "Authored prose.",
    "<!-- kg:subgraph:begin -->",
    "| file | what |",
    hunk,
    "<!-- kg:subgraph:end -->",
    "More authored prose.",
  ].join("\n");

describe("resolveGeneratedRegions", () => {
  test("a hunk inside a generated region takes the base side; authored text survives", () => {
    const text = README("<<<<<<< HEAD\n| defs/ | 1150 files |\n=======\n| defs/ | 1151 files |\n>>>>>>> origin/main");
    const out = resolveGeneratedRegions(text)!;
    expect(out).toContain("| defs/ | 1151 files |");
    expect(out).not.toContain("1150");
    expect(out).toContain("Authored prose.");
    expect(out).not.toContain("<<<<<<<");
  });

  test("diff3 style (a ||||||| base section) resolves the same way", () => {
    const text = README("<<<<<<< HEAD\n| a | 2 |\n||||||| merged common ancestors\n| a | 1 |\n=======\n| a | 3 |\n>>>>>>> origin/main");
    expect(resolveGeneratedRegions(text)).toContain("| a | 3 |");
  });

  test("a hunk in AUTHORED text is refused", () => {
    const text = [
      "<<<<<<< HEAD", "Prose one way.", "=======", "Prose another way.", ">>>>>>> origin/main",
      "<!-- kg:subgraph:begin -->", "x", "<!-- kg:subgraph:end -->",
    ].join("\n");
    expect(resolveGeneratedRegions(text)).toBeUndefined();
  });

  test("a hunk that moves a region boundary is refused: structure, not content", () => {
    const text = README("<<<<<<< HEAD\n| a | 1 |\n<!-- kg:subgraph:end -->\n=======\n| a | 2 |\n>>>>>>> origin/main");
    expect(resolveGeneratedRegions(text)).toBeUndefined();
  });

  test("an unterminated conflict block is refused", () => {
    expect(resolveGeneratedRegions(README("<<<<<<< HEAD\n| a | 1 |\n=======\n| a | 2 |"))).toBeUndefined();
  });

  test("a file with no conflict comes back unchanged", () => {
    const t = README("| a | 1 |");
    expect(resolveGeneratedRegions(t)).toBe(t);
  });
});
