/**
 * The declared merge-conflict patterns and the region resolver (bean `y7b3`).
 *
 * The refusals are the point: each test that resolves has a sibling showing
 * the unsafe neighbour is refused, because a resolver proven only on the
 * cases it handles is proven against its author's optimism.
 */
import { describe, expect, test } from "bun:test";

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { plan, resolutionFailure, takeBase, takeBaseAction, unmergedStages } from "../merge-base.js";
import { parseLog } from "../merge-main-comment.js";
import { plan as qaPlan } from "../qa-resolve-conflicts.ts";
import { classify, PATTERNS, resolveGeneratedRegions } from "../merge-conflict-patterns.js";
import { repoRootFor, siteDirFor } from "../../schemas/cat-harness.js";

/** This instance and the repository it sits in, for the filesystem-driven sweeps. */
const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = repoRootFor(INSTANCE);

/**
 * The leading `---`-delimited front matter of a markdown file, or `""` when it
 * has none.
 *
 * **Front matter ONLY, and that is not fussiness.** The first cut of
 * `generatedDocsPages` tested the WHOLE file for `generated:
 * scripts/gen-docs-pages.ts`, and the very first merge after it was written
 * found an 18th subject: `docs/reference/skill-instructions/
 * merge-conflict-patterns.md`, the generated body of the skill that DOCUMENTS
 * this pattern, which quotes that front-matter line in a fenced code block. A
 * detector that reads a quotation as a declaration finds its own
 * documentation — *"a docblock that documents a tag necessarily contains the
 * tag"* (`audit-coverage`). That page's own front matter names
 * `gen-skill-docs.ts` and the `skill-instructions` pattern already owns it.
 */
function frontMatter(text: string): string {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 3);
  return end === -1 ? "" : text.slice(4, end + 1);
}

/**
 * Every `.md` under this instance's site directory whose own front matter names
 * `gen-docs-pages.ts` as its writer, repo-relative. Read from the TREE rather
 * than listed, so a page added to `content/docs/` makes the `docs-pages` test
 * fail until its slug is declared — the enumeration cannot go quietly stale.
 */
function generatedDocsPages(): string[] {
  const out: string[] = [];
  const walk = (abs: string): void => {
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
      const p = join(abs, e.name);
      if (e.isDirectory()) {
        if (e.name === "assets" || e.name === "vendor") continue;
        walk(p);
        continue;
      }
      if (!e.isFile() || !e.name.endsWith(".md")) continue;
      if (/^generated:\s*scripts\/gen-docs-pages\.ts/m.test(frontMatter(readFileSync(p, "utf8")))) {
        out.push(relative(REPO, p));
      }
    }
  };
  walk(join(INSTANCE, siteDirFor(INSTANCE)));
  return out.sort();
}

describe("classify", () => {
  test("measured generated families resolve by their declared strategy", () => {
    expect(classify("cat-harness/test/results/skill-register.qa-results.json").pattern?.id).toBe("qa-results");
    expect(classify("cat-harness/test/results/lsi/cat-harness/skills.lsi.json").strategy).toBe("take-base");
    expect(classify("cat-harness/docs/cat-harness/docs-auto/index/index.html").pattern?.id).toBe("docs-auto");
    expect(classify("cat-harness/docs/glossary/index.md").pattern?.id).toBe("glossary");
    expect(classify("beans/README.md").strategy).toBe("generated-regions");
  });

  test("the three generated glossary/skill families classify, and their carry-forward neighbours do not", () => {
    // Bean `8rff`: each was named by no pattern, so `merge:main` refused it
    // and `merge:overlap` counted it as authored — 54 + 50 + 30 pair-path hits
    // across 32 open PRs.
    expect(classify("cat-harness/docs/assets/glossary/bootstrap--kg-skills.skos.jsonld").pattern?.id).toBe(
      "skos-glossary-export",
    );
    expect(classify("folio-assistant-core/glossary/generated/cat-harness/kg-skills.glossary.json").pattern?.id).toBe(
      "glossary-generated",
    );
    expect(classify("cat-harness/docs/reference/skill-instructions/bean-coordination.md").pattern?.id).toBe(
      "skill-instructions",
    );
  });

  test("the glossary LEDGER is refused: it is the one artefact that carries forward", () => {
    // glossary-export.ts reads the prior ledger and preserves a concept's
    // earlier names as skos:hiddenLabel (#1168 B10b). Taking one side would
    // drop a term's history, so `glossary-generated`'s glob must stop at
    // `generated/` and leave the sibling alone. This is the unsafe neighbour
    // the skill's §"Adding a pattern" step 3 asks for.
    expect(classify("cat-harness/glossary/glossary-ledger.json").strategy).toBe("refuse");
    expect(classify("cat-harness/glossary/bootstrap/glossary-ledger.json").strategy).toBe("refuse");
  });

  test("a skill SOURCE is refused while its generated instruction page is taken", () => {
    // The pair that makes `skill-instructions` safe: resolve the generated
    // copy, never the authored skill it is generated from.
    expect(classify("cat-harness/docs/reference/skill-instructions/merge-conflict-patterns.md").strategy).toBe(
      "take-base",
    );
    expect(classify("cat-harness/skills/sdlc/sdlc-core/merge-conflict-patterns.md").strategy).toBe("refuse");
  });

  test("every generated docs page classifies to `docs-pages` — read from the tree, not listed", () => {
    // Bean `8c6v`: 17 pages under `cat-harness/docs/` carry
    // `generated: scripts/gen-docs-pages.ts — do not hand-edit` in their own
    // front matter, and NONE was named by a pattern, so `merge:main` returned
    // `refuse / — none —` and handed back for hand-editing the files that
    // forbid it. `docs/publication-workflow.md` was one of the 2 refusals that
    // blocked #1888 after 53 of its 55 conflicts had resolved.
    const pages = generatedDocsPages();
    expect(pages.length).toBeGreaterThanOrEqual(17);
    // Deriving the subjects from the tree is the point: a page added to
    // `content/docs/` lands here and fails until the glob names its slug.
    const unmatched = pages.filter((p) => classify(p).pattern?.id !== "docs-pages");
    expect(unmatched).toEqual([]);
    expect(classify("cat-harness/docs/publication-workflow.md").pattern?.id).toBe("docs-pages");
    expect(classify("cat-harness/docs/guides/writing-a-paper.md").pattern?.id).toBe("docs-pages");
  });

  test("the AUTHORED source a docs page is generated from is refused, and so are its authored siblings", () => {
    // The pair that makes `docs-pages` safe, and step 3 of §"Adding a pattern":
    // `gen-docs-pages.ts` READS the blocks under `content/docs/<slug>/`, which
    // are hand-written and genuinely need a person. The glob must not reach
    // them, nor the authored `docs/*.md` pages sitting beside the generated
    // ones in the SAME directory — `cat-harness/docs/*.md` is a mix, which is
    // why the 17 slugs are enumerated instead of globbed.
    expect(
      classify("cat-harness/content/docs/publication-workflow/every-workflow-in-the-repo.md").strategy,
    ).toBe("refuse");
    for (const authored of [
      "cat-harness/docs/architecture.md",
      "cat-harness/docs/getting-started.md",
      "cat-harness/docs/index.md",
      "cat-harness/docs/guides/agent-onboarding.md",
      "cat-harness/docs/guides/voices.md",
    ]) {
      expect(classify(authored).strategy).toBe("refuse");
    }
    // Nothing under `content/` may be claimed by it, at any depth.
    const claimed = generatedDocsPages().filter((p) => p.includes("/content/"));
    expect(claimed).toEqual([]);
  });

  test("a page that QUOTES the generated marker is not a subject of it", () => {
    // Found on this branch's first merge of `main`: the generated body of the
    // skill documenting `docs-pages` quotes `generated: scripts/gen-docs-pages.ts`
    // in a code fence, so a whole-file detector counted an 18th page. Its OWN
    // front matter names gen-skill-docs.ts, and `skill-instructions` — declared
    // BEFORE `docs-pages`, so it wins the first match — already owns it.
    const quoting = "cat-harness/docs/reference/skill-instructions/merge-conflict-patterns.md";
    expect(readFileSync(join(REPO, quoting), "utf8")).toContain("generated: scripts/gen-docs-pages.ts");
    expect(generatedDocsPages()).not.toContain(quoting);
    expect(classify(quoting).pattern?.id).toBe("skill-instructions");
  });

  test("site-data still owns docs/assets JSON: the new SKOS entry did not widen it", () => {
    // `.skos.jsonld` is not `*.json`, so the two cannot overlap — pinned
    // because `8rff` flagged exactly this as the thing to confirm.
    expect(classify("cat-harness/docs/assets/library/index.json").pattern?.id).toBe("site-data");
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
    expect(classify("cat-harness/docs/fsh-guts/index.md").pattern?.id).toBe("viewer-pages");
    // ...but not the archive it renders: fsh-guts/ holds authored, kept content.
    expect(classify("fsh-guts/uploads/Home-_-folio-assistant.md").strategy).toBe("refuse");
    expect(classify("cat-harness/docs/fsh-guts/other.md").strategy).toBe("refuse");
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

  test("the PROV-O report is taken; the workflow instances it is derived FROM are refused", () => {
    // The single unclassified path when the runner refused #1892 against 32 it
    // resolved. Generated whole by `prov:qaqc` from the instances under
    // `beans/workflows/`, so any branch that records one rewrites the index.
    expect(classify("cat-harness/docs/prov-qaqc/index.md").pattern?.id).toBe("prov-qaqc");
    expect(classify("cat-harness/docs/assets/prov/x.prov.jsonld").pattern?.id).toBe("prov-qaqc");
    // Instance-agnostic, like `derived-results`: a dependent folio writes the
    // same two shapes under its own root.
    expect(classify("who-iris/docs/prov-qaqc/index.md").pattern?.id).toBe("prov-qaqc");
    // The unsafe neighbours. The INPUT is committed workflow state, not a
    // derivative of it, so taking base would discard a recorded instance.
    expect(classify("beans/workflows/crdm-requirements-1.json").strategy).toBe("refuse");
    // And the generator itself is authored source.
    expect(classify("cat-harness/scripts/prov-qaqc.ts").strategy).toBe("refuse");
  });

  test("artefact-verification.json refuses BY NAME, which an unclassified path does not", () => {
    // The distinction this entry exists for, and the reason it is declared
    // rather than left to the default: a named refusal tells the next sweep WHY
    // (bean `mjl3`), where "no declared pattern" reads as an omission. It looks
    // generated — under scripts/, a .json, key set derived from package.json —
    // and refused on two open PRs at once (#1958, #1955).
    const named = classify("cat-harness/scripts/artefact-verification.json");
    expect(named.strategy).toBe("refuse");
    expect(named.pattern?.id).toBe("artefact-verification");

    // A genuinely unclassified neighbour refuses with NO pattern. If these two
    // ever report the same thing, the entry has stopped carrying its reason.
    const unnamed = classify("cat-harness/scripts/sync-docs-harness.ts");
    expect(unnamed.strategy).toBe("refuse");
    expect(unnamed.pattern).toBeUndefined();
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

  test("the standalone baseline is taken from the base; its sibling baseline and its writer are not", () => {
    // Fail-closed: the base's list, nothing regenerated (#1977). The neighbour
    // with the same shape, declared-path-baseline.json, is a different ratchet
    // nobody has measured a pattern for, so it stays refused.
    expect(classify("cat-harness/scripts/standalone-baseline.json").pattern?.id).toBe("standalone-baseline");
    expect(classify("cat-harness/scripts/standalone-baseline.json").strategy).toBe("take-base");
    expect(classify("cat-harness/scripts/declared-path-baseline.json").strategy).toBe("refuse");
    expect(classify("cat-harness/scripts/check-standalone.ts").strategy).toBe("refuse");
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

/**
 * #1801, 2026-10-03: the branch adds `results/` to `.gitignore` while the
 * files there stay tracked on both sides. git checks an UNMERGED path against
 * `.gitignore` as if it were new, so a plain `git add` refused, and merge-main
 * went red on every push to main ("exited 1 without a refusal").
 */
function ignoredTrackedConflict(): string {
  const dir = mkdtempSync(join(tmpdir(), "merge-base-ign-"));
  const g = (...a: string[]) => execFileSync("git", a, { cwd: dir, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  g("init", "-q", "-b", "branch");
  g("config", "user.email", "t@example.invalid");
  g("config", "user.name", "t");
  mkdirSync(join(dir, "results"));
  writeFileSync(join(dir, "results/x.json"), "{}\n");
  g("add", ".");
  g("commit", "-qm", "base");
  g("checkout", "-q", "-b", "main");
  writeFileSync(join(dir, "results/x.json"), "{\"main\":1}\n");
  g("commit", "-qam", "main side");
  g("checkout", "-q", "branch");
  writeFileSync(join(dir, ".gitignore"), "results/\n");
  writeFileSync(join(dir, "results/x.json"), "{\"branch\":1}\n");
  g("add", ".gitignore");
  g("commit", "-qam", "branch side: ignore results/, still tracked");
  try { g("merge", "--no-commit", "main"); } catch { /* the conflict is the point */ }
  return dir;
}

describe("a conflicted path the branch's .gitignore matches (#1801)", () => {
  const dirs = [ignoredTrackedConflict(), ignoredTrackedConflict()];

  test("the crash, reproduced: a plain `git add` exits 1 on the unmerged ignored path", () => {
    // (git stages it all the same; only the exit status is the failure, and
    // the resolver's git() helper throws on it.)
    const dir = dirs[0]!;
    expect([...unmergedStages(dir, "results/x.json")].sort()).toEqual([1, 2, 3]);
    expect(() => execFileSync("git", ["add", "--", "results/x.json"], { cwd: dir, stdio: "pipe" })).toThrow();
  });

  test("takeBase stages the base's copy anyway, and nothing else", () => {
    const dir = dirs[1]!;
    expect([...unmergedStages(dir, "results/x.json")].sort()).toEqual([1, 2, 3]);
    writeFileSync(join(dir, "results/untracked.json"), "{}\n");
    takeBase(dir, "results/x.json");
    expect(readFileSync(join(dir, "results/x.json"), "utf-8")).toBe("{\"main\":1}\n");
    expect(execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], { cwd: dir, encoding: "utf-8" })).toBe("");
    // -f is scoped to the conflicted path: an ignored untracked neighbour stays out.
    expect(execFileSync("git", ["ls-files", "--", "results/untracked.json"], { cwd: dir, encoding: "utf-8" })).toBe("");
  });

  test("cleanup", () => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
});

describe("a resolution that fails is reported as a refusal, not an unexplained exit", () => {
  test("the line has the refusal shape merge-main.yml and merge-main-comment read", () => {
    const err = Object.assign(new Error("Command failed"), { stderr: "\nThe following paths are ignored by one of your .gitignore files:\nresults\n" });
    const line = resolutionFailure("results/x.json", "derived-results", err);
    expect(line).toBe("  ✗ results/x.json  [derived-results: could not resolve] — The following paths are ignored by one of your .gitignore files:");
    // merge-main.yml: grep -qE '^  ✗ .*  \['
    expect(/^ {2}✗ .* {2}\[/.test(line)).toBe(true);
    expect(parseLog(`merge-base: 1 conflicted path(s)\n${line}\n`).refused).toContain("results/x.json");
  });
});
