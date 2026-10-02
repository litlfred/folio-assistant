/**
 * The declared merge-conflict patterns and the region resolver (bean `y7b3`).
 *
 * The refusals are the point: each test that resolves has a sibling showing
 * the unsafe neighbour is refused, because a resolver proven only on the
 * cases it handles is proven against its author's optimism.
 */
import { describe, expect, test } from "bun:test";

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { plan, takeBase, takeBaseAction, unmergedStages } from "../merge-base.js";
import { plan as qaPlan } from "../qa-resolve-conflicts.ts";
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
    expect(classify("cat-harness/docs/qa/index.html").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/test/results/witnesses/guides-who-smart-dak/the-l2-artifacts.kg.json").pattern?.id).toBe("qa-witnesses");
    expect(classify("cat-harness/translations/ar/publication-workflow.pot").pattern?.id).toBe("pot-templates");
    // The authored translation beside the template is NOT a template.
    expect(classify("cat-harness/translations/ar/publication-workflow.po").strategy).toBe("refuse");
    // The unsafe neighbours: authored translations, and a locale no generator writes.
    expect(classify("cat-harness/docs/ar/index.md").strategy).toBe("refuse");
    expect(classify("cat-harness/docs/fr/getting-started.md").strategy).toBe("refuse");
    expect(classify("cat-harness/docs/de/glossary/index.md").strategy).toBe("refuse");
  });

  test("generated VIEWERS of uploads/ are taken; uploads/ itself stays refused", () => {
    // The false positive found on #1764/#1775: `**/uploads/**` caught pages
    // that render uploads/ rather than being uploads.
    expect(classify("cat-harness/docs/uploads/index.html").pattern?.id).toBe("viewer-pages");
    expect(classify("cat-harness/docs/cat-harness/uploads/who-iris/index.html").pattern?.id).toBe("viewer-namespace");
    for (const p of ["beans", "todos", "health", "issue-marks", "swimlane-glossary"]) {
      expect(classify(`cat-harness/docs/${p}/index.html`).pattern?.id).toBe("viewer-pages");
    }
    for (const seg of ["catalogue", "folio", "library", "schemas", "voices"]) {
      expect(classify(`cat-harness/docs/cat-harness/${seg}/index.html`).pattern?.id).toBe("viewer-namespace");
    }
    expect(classify("cat-harness/docs/_includes/generated/navbar-footer.html").pattern?.id).toBe("navbar-include");
    expect(classify("cat-harness/test/results/viewer-nav/viewer-nav.qa.json").pattern?.id).toBe("viewer-nav-qa");
    // The real uploads stay refused, at the root and in any instance.
    expect(classify("uploads/9789240093362-eng.pdf").pattern?.id).toBe("uploads");
    expect(classify("who-iris/uploads/x.pdf").pattern?.id).toBe("uploads");
    // Authored neighbours of the new globs stay refused.
    expect(classify("cat-harness/docs/beans/notes.md").strategy).toBe("refuse");
    expect(classify("cat-harness/docs/_includes/head_custom.html").strategy).toBe("refuse");
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

/**
 * A modify/delete conflict: `ours` changes the file, `theirs` (the base being
 * merged in) deletes it — or the reverse. Measured 2026-10-02 on #1805, where
 * main deleted docs-auto pages the branch had touched and `checkout --theirs`
 * threw "does not have their version".
 */
function modifyDelete(deletedBy: "theirs" | "ours"): string {
  const dir = mkdtempSync(join(tmpdir(), "merge-base-md-"));
  const g = (...a: string[]) => execFileSync("git", a, { cwd: dir, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  g("init", "-q", "-b", "branch");
  g("config", "user.email", "t@example.invalid");
  g("config", "user.name", "t");
  writeFileSync(join(dir, "gen.html"), "v1\n");
  g("add", ".");
  g("commit", "-qm", "base");
  g("checkout", "-q", "-b", "main");
  if (deletedBy === "theirs") g("rm", "-q", "gen.html");
  else writeFileSync(join(dir, "gen.html"), "main\n");
  g("commit", "-qam", "main side");
  g("checkout", "-q", "branch");
  if (deletedBy === "ours") g("rm", "-q", "gen.html");
  else writeFileSync(join(dir, "gen.html"), "branch\n");
  g("commit", "-qam", "branch side");
  try { g("merge", "--no-commit", "main"); } catch { /* the conflict is the point */ }
  return dir;
}

describe("take-base when one side deleted the file", () => {
  const dirs: string[] = [];
  const mk = (by: "theirs" | "ours") => { const d = modifyDelete(by); dirs.push(d); return d; };

  test("the stage set decides: no stage 3 means the base deleted it", () => {
    expect(takeBaseAction(new Set([1, 2]))).toBe("delete");
    expect(takeBaseAction(new Set([1, 3]))).toBe("theirs");
    expect(takeBaseAction(new Set([1, 2, 3]))).toBe("theirs");
  });

  test("deleted by the base: the deletion is taken, not a throw", () => {
    const d = mk("theirs");
    expect([...unmergedStages(d, "gen.html")].sort()).toEqual([1, 2]);
    takeBase(d, "gen.html");
    expect(existsSync(join(d, "gen.html"))).toBe(false);
    expect(execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], { cwd: d, encoding: "utf-8" })).toBe("");
  });

  test("deleted on the branch, changed on the base: the base's copy is taken", () => {
    const d = mk("ours");
    expect([...unmergedStages(d, "gen.html")].sort()).toEqual([1, 3]);
    takeBase(d, "gen.html");
    expect(readFileSync(join(d, "gen.html"), "utf-8")).toBe("main\n");
    expect(execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], { cwd: d, encoding: "utf-8" })).toBe("");
  });

  test("cleanup", () => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
});

describe("modify/delete on DECLARED paths: generated resolves, authored refuses (#1854)", () => {
  // Real pattern paths rather than a bare `gen.html`, so classification and
  // the stage handling are exercised together on what git actually reports.
  const GEN = "cat-harness/docs/cat-harness/docs-auto/index/index.html";
  const BEAN = "beans/defs/folio-assistant-x--y.md";
  const mk = (): string => {
    const dir = mkdtempSync(join(tmpdir(), "merge-base-md2-"));
    const g = (...a: string[]) => execFileSync("git", a, { cwd: dir, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    g("init", "-q", "-b", "branch");
    g("config", "user.email", "t@example.invalid");
    g("config", "user.name", "t");
    for (const p of [GEN, BEAN]) {
      mkdirSync(join(dir, p, ".."), { recursive: true });
      writeFileSync(join(dir, p), "v1\n");
    }
    g("add", ".");
    g("commit", "-qm", "base");
    g("checkout", "-q", "-b", "main");
    g("rm", "-q", GEN, BEAN); // main deletes both
    g("commit", "-qm", "main deletes");
    g("checkout", "-q", "branch");
    for (const p of [GEN, BEAN]) writeFileSync(join(dir, p), "branch\n"); // the branch edits both
    g("commit", "-qam", "branch edits");
    try { g("merge", "--no-commit", "main"); } catch { /* the conflict is the point */ }
    return dir;
  };

  test("the generated page takes main's deletion; the bean is refused", () => {
    const d = mk();
    try {
      const conflicted = execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], { cwd: d, encoding: "utf-8" })
        .split("\n").filter(Boolean).sort();
      expect(conflicted).toEqual([BEAN, GEN].sort());
      const p = plan(conflicted);
      expect(p.resolvable.map((c) => c.path)).toEqual([GEN]);
      expect(p.resolvable[0]!.pattern?.id).toBe("docs-auto");
      expect(p.refused.map((c) => c.path)).toEqual([BEAN]);
      expect(p.refused[0]!.pattern?.id).toBe("beans");
      for (const c of p.resolvable) takeBase(d, c.path);
      expect(existsSync(join(d, GEN))).toBe(false);
      const left = execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], { cwd: d, encoding: "utf-8" });
      expect(left.trim()).toBe(BEAN);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});

describe("qa sidecars of a NESTED instance are in scope", () => {
  // Measured 2026-10-02 on #1822: a who-iris kg-qa sidecar was classified
  // `qa-sidecar` here and then "left alone — outside the declared qa graph"
  // by the resolver, which knew only the root instance's directory.
  test("plan accepts every declared qa directory, not only the first", () => {
    const dirs = ["cat-harness/test/results/", "who-iris/test/results/"];
    const [o] = qaPlan("/nonexistent", dirs, ["unrelated/x.json"]);
    expect(o!.action).toBe("skip");
    expect(o!.reason).toContain("who-iris/test/results/");
  });
});
