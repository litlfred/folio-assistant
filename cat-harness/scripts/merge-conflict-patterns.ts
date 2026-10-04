/**
 * The declared merge-conflict patterns: which conflicted paths a merge may
 * resolve WITHOUT a person, and how (bean `y7b3`, issue #1707).
 *
 * @module scripts/merge-conflict-patterns
 * @graphNode none — data and a classifier, read by `merge-base.ts`
 *
 * ## Why a registry, and why it refuses by default
 *
 * Measured 2026-09-30 over 300 `main`-into-branch merges: 235 conflicted, and
 * 147 (63 %) conflicted ONLY on generated files, whose resolution is always the
 * same mechanical step: take the base's copy, regenerate. Owner, 2026-10-01:
 * *"1 + new skills/tools for each common churn/conflict pattern"* — so each
 * pattern is DECLARED, with why it churns and how it resolves, and the skill
 * `merge-conflict-patterns` carries one section per entry.
 *
 * **A path no pattern names is refused**, and so is the whole merge: resolving
 * nine generated files and leaving one authored conflict half-done is worse
 * than leaving all ten to a person, because a half-resolved merge reads as
 * progress. `refuse` entries exist only to say WHY a common path is not
 * automatic (so the next agent does not add it on a hunch).
 *
 * ## The four strategies
 *
 * | strategy | resolution | safe because |
 * |---|---|---|
 * | `take-base` | the base's copy, then regenerate | the file is wholly generated; the gate set regenerates it from the merged inputs |
 * | `generated-regions` | each hunk takes the base's side, then regenerate | EVERY hunk lies inside a `<!-- x:begin -->`…`<!-- x:end -->` region, which the generator rewrites; a hunk in authored text refuses |
 * | `qa-sidecar` | `qa:resolve-conflicts` | that command reads git's stages and refuses a sidecar carrying an agent's attestation |
 * | `refuse` | none | authored, or carries judgement a generator cannot reproduce |
 *
 * Verification is NOT per pattern: after resolving, `merge-base.ts` runs
 * `regen`, which derives every check/writer pair from the CI workflow and so
 * cannot drift from what CI enforces. A pattern names no check of its own on
 * purpose — a hand-kept list of check names is the list that rots.
 */

export type ConflictStrategy = "take-base" | "generated-regions" | "qa-sidecar" | "refuse";

export interface ConflictPattern {
  /** Stable id; the skill's section anchor. */
  id: string;
  /** Repo-relative globs (Bun.Glob syntax). First matching pattern wins. */
  globs: string[];
  strategy: ConflictStrategy;
  /** Why it churns (or, for `refuse`, why it is not automatic). */
  why: string;
}

/**
 * Ordered: the FIRST pattern whose glob matches decides. Specific paths come
 * before general ones (`kg-qa` sidecars before the generic results tree).
 * Counts are from the 2026-09-30 measurement (conflicted files across 235
 * conflicted merges), recorded in bean `y7b3`.
 */
export const PATTERNS: readonly ConflictPattern[] = [
  {
    id: "kg-qa-sidecar",
    globs: ["**/test/results/kg-qa/**"],
    strategy: "qa-sidecar",
    why: "kg-audit sidecars (53). Delegated: a sidecar can carry an attestation an earlier run or a person recorded, and only qa:resolve-conflicts checks for one.",
  },
  {
    id: "kg-qa-manifest",
    globs: ["**/test/results/kg-qa.manifest.json", "**/test/results/**/kg-qa.manifest.json"],
    strategy: "take-base",
    why: "kg-audit's per-instance manifest: only the auditor's script hash, so every change to kg-audit.ts restamps all of them at once. Found by replaying 40 real merges (one refused on these alone). Holds no attestation, unlike the sidecars it indexes.",
  },
  {
    id: "qa-results",
    globs: ["**/*.qa-results.json"],
    strategy: "take-base",
    why: "whole-artefact QA results (292). Rewritten whole by their producer; carried updated_at until #1714, and still change whenever any finding does.",
  },
  {
    id: "derived-results",
    globs: [
      "**/test/results/lsi/**",
      "**/test/results/detangle/**",
      "**/test/results/tool-runs/**",
    ],
    strategy: "take-base",
    why:
      "LSI indexes, detangle sidecars and tool-run records (56 + 71 + 15). Recomputed from the whole corpus, so any concurrent skill or schema change touches them. " +
      "The LSI half is UNTRACKED on `main` since bean `tqjj` and these globs are kept for the branches still carrying it: a branch that edited the sidecar meets a base that deleted it, and `take-base` is the right answer to that too. " +
      "It is also the measured limit of what a declaration buys. These paths carried this entry all along and still conflicted on seven open pull requests each, because the strategy settles HOW a conflict is resolved and never whether one arises — `.gitattributes` says the same thing in its own words: \"Removing these conflicts, rather than tidying them, needs the files off `main` altogether.\"",
  },
  {
    id: "docs-auto",
    globs: ["**/docs-auto/**"],
    strategy: "take-base",
    why: "the generated docs index pages (352). Marked -merge in .gitattributes; one page per directory, so every new file anywhere changes one.",
  },
  {
    id: "uml",
    globs: ["**/uml/**", "**/assets/img/uml/**"],
    strategy: "take-base",
    why: "generated overview diagrams and their SVGs (201). Recomputed from the declarations; any new node redraws them.",
  },
  {
    id: "prov-qaqc",
    // Instance-agnostic, like `derived-results` and unlike `glossary`: a
    // dependent folio runs `prov:qaqc` over its own workflow instances and
    // writes the same two shapes under its own root.
    globs: ["**/docs/prov-qaqc/**", "**/docs/assets/prov/**"],
    strategy: "take-base",
    why:
      "the PROV-O QA/QC report and its per-instance logs. Generated WHOLE from the workflow instances under " +
      "`beans/workflows/` by `scripts/prov-qaqc.ts`, so any branch that records an instance — which every " +
      "branch doing process work does — rewrites the index page and adds a `.prov.jsonld`. Added 2026-10-03 " +
      "after it refused #1892 as the single unclassified path among 32 resolved by pattern: a file nobody " +
      "authors, blocking a merge nobody can usefully resolve by hand. `take-base` then `regen`, which runs " +
      "`prov:qaqc` because `check:prov-qaqc` is a workflow gate — so the pattern names no check of its own.",
  },
  {
    id: "glossary",
    globs: ["cat-harness/docs/glossary/**", "cat-harness/docs/lsi/**"],
    strategy: "take-base",
    why:
      "the generated glossary and LSI pages (173 + 34). Whole-corpus aggregates; concurrent term additions always collide. " +
      "The LSI page still conflicts but much less often since bean `tqjj`: its per-index detail — the half a one-sentence skill edit moved — is added by the docs-site build rather than committed, and what is left is a function of the tree. The glossary page has no equivalent split: every number on it is a term count over the whole corpus, and there is no half that only the tree moves.",
  },
  {
    id: "translated-glossary",
    globs: ["cat-harness/docs/{ar,es,fr,ru,zh}/glossary/index.md"],
    strategy: "take-base",
    why: "the translated glossary pages, one per locale, written whole by glossary-page.ts beside the English one (check:glossary). Same aggregate, so the same collision; found 2026-10-01 when a merge refused on all five. The rest of each locale directory is authored translation and stays refused.",
  },
  {
    id: "viewer-pages",
    globs: [
      "cat-harness/docs/external-schemas/index.md",
      "cat-harness/docs/methodologies/index.md",
      "cat-harness/docs/tools/index.md",
      "cat-harness/docs/processes/*.md",
      "cat-harness/docs/qa/index.html",
      "cat-harness/docs/translation-status/index.html",
      // state:visualizer's other pages, each headed "Generated by
      // scripts/state-visualizer.ts. Do not hand-edit". docs/uploads/index.html
      // is the VIEWER of uploads/, not an upload: it must match here, before
      // the `uploads` refusal below catches it. Found 2026-10-01 on #1764.
      "cat-harness/docs/{beans,todos,health,issue-marks,swimlane-glossary,uploads}/index.html",
      // fsh-guts:viz writes this page whole (writeFileSync) from fsh-guts/**;
      // refused on #1766 2026-10-03 when main archived new uploads into fsh-guts/.
      "cat-harness/docs/fsh-guts/index.md",
    ],
    strategy: "take-base",
    why: "whole-file viewer pages (external-schemas:viz, methodologies:viz, tools:viz, processes:viz, state:visualizer, translation:status, fsh-guts:viz), each with a --check in the CI workflow. Rewritten whole from the declarations they render, so a new schema, diagram or translation anywhere changes them; found 2026-10-01 when a merge refused on these alone; tools/index.md (rendered-by tools-viewer) added 2026-10-03 after #1987 refused on it twice.",
  },
  {
    id: "viewer-namespace",
    // declared-path-literal: a GLOB matched against conflicted paths.
    globs: ["cat-harness/docs/cat-harness/{catalogue,folio,library,schemas,uploads,voices}/**"],
    strategy: "take-base",
    why: "the viewer namespace that gen-library-viz, gen-folio-viz and gen-schema-viz place through viewerPlacement(site, \"<handler>/<seg>/<subject>\"); every page is rewritten whole from the corpus and checked by its :viz --check. Its uploads/ pages render uploads/, they are not uploads, so this must precede the `uploads` refusal. Found 2026-10-01 when #1775 refused on four of them.",
  },
  {
    id: "navbar-include",
    globs: ["cat-harness/docs/_includes/generated/**"],
    strategy: "take-base",
    why: "the site navbar/footer include written whole by gen-navbar-include.ts (navbar:include, with a --check). Any new page, graph or tile changes it. Found 2026-10-01 on #1764.",
  },
  {
    id: "viewer-nav-qa",
    globs: ["**/test/results/viewer-nav/viewer-nav.qa.json"],
    strategy: "take-base",
    why: "check-viewer-nav's mechanical layout verdict over every viewer page; recomputed from the pages, carries no reviewer's attestation. Found 2026-10-01 on #1775.",
  },
  {
    id: "handler-index",
    globs: ["cat-harness/docs/cat-harness/published-graphs.md"],
    strategy: "take-base",
    why: "the handler's index of every published graph and declared viewer, written whole by gen-handler-index.ts (handler:index:check in CI). Any new graph or viewer anywhere rewrites it; found 2026-10-01 on #1754.",
  },
  {
    id: "skos-glossary-export",
    globs: ["**/docs/assets/glossary/*.skos.jsonld"],
    strategy: "take-base",
    why: "the published SKOS export, written whole by `glossary:export` (glossary-export.ts, `glossary:check`). Bean `8rff` measured 54 pair-path hits on it across 32 open PRs: every instance's export restamps when any declared role, skill or term moves. Deliberately NOT the ledger, which is the carry-forward artefact and stays refused — see the `glossary-ledger` note in the skill.",
  },
  {
    id: "glossary-generated",
    globs: ["**/glossary/generated/**"],
    strategy: "take-base",
    why: "the per-instance generated glossary JSON under `<instance>/glossary/generated/**`, same writer as `skos-glossary-export` and the same check. 50 pair-path hits (`8rff`). The glob stops at `generated/`, so the sibling `glossary-ledger.json` one level up is untouched.",
  },
  {
    id: "skill-instructions",
    globs: ["**/docs/reference/skill-instructions/**"],
    strategy: "take-base",
    why: "skill instruction bodies, written whole by `skills:docs` (gen-skill-docs.ts `OUT_DIR`, `skills:docs:check`). 30 pair-path hits (`8rff`), and AGENTS.md says never hand-edit the directory. Its `emit()` is compare-or-write with no merge, so nothing is carried forward. The SKILL SOURCE under `skills/**` is the authored neighbour and stays refused.",
  },
  {
    id: "docs-pages",
    // declared-path-literal: a GLOB matched against conflicted paths, not a
    // directory read. The 17 slugs are ENUMERATED rather than globbed because
    // `cat-harness/docs/*.md` is a MIX — measured 2026-10-03, 13 of its 31
    // `.md` pages are generated and 18 are authored (`architecture.md`,
    // `index.md`, `getting-started.md`, …), and `guides/` is 4 of 9 — so a
    // directory glob such as `docs/*.md` would take a side on
    // authored prose. A page added to `content/docs/` is refused until it is
    // named here, which is the safe direction to be wrong in.
    globs: [
      "cat-harness/docs/{agentic-harness,beans-and-todos,content-types,crdm-methodology,document-ingestion,evidence,fhir-content,harness,harnessed-kg-overview,ig-publisher,knowledge-graph,managing-agent-context,publication-workflow}.md",
      "cat-harness/docs/guides/{who-smart-dak,who-smart-ig,writing-a-document,writing-a-paper}.md",
    ],
    strategy: "take-base",
    why: "the 17 whole-file docs pages gen-docs-pages.ts writes from the authored blocks under cat-harness/content/docs/<slug>/ (`docs:pages`, gated by `docs:pages:check`), each carrying `generated: scripts/gen-docs-pages.ts — do not hand-edit` in its own front matter. Bean `8c6v`: all 17 were named by NO pattern, so merge:main refused them and handed back for hand-editing the files that forbid it — docs/publication-workflow.md was one of the 2 refusals that blocked #1888 after 53 of its 55 conflicts resolved. Safe because `emit()` is compare-or-write and the only read of a prior page is inside its `--check` branch, so nothing is carried forward; and the `page` kind is gated on EXACT content, which makes regeneration the verifiable resolution. The AUTHORED SOURCES under cat-harness/content/docs/** are the neighbour and stay refused.",
  },
  {
    id: "health-report",
    globs: ["**/test/health/results/*.health-report.json"],
    strategy: "take-base",
    why: "the committed repository health report: a MEASUREMENT of external state (the publish branch, clone size, the work plan) written by `bun run health` and refreshed daily on the base by the health-check workflow, so the base's copy is the newer measurement. check:harness-state judges its producer hash; if the merge changes the producer, `bun run health` rewrites it. Found 2026-10-01 on #1754.",
  },
  {
    id: "qa-witnesses",
    globs: ["**/test/results/witnesses/**"],
    strategy: "take-base",
    why: "QA witness projections (qa-witness/v1) and page verdict indexes, written by gen-docs-pages.ts from the kg-qa sidecars and the live subject. A projection, never an attestation: the sidecars it reads are delegated above, and docs-site regenerates the witnesses at publish. Found 2026-10-01 on #1754.",
  },
  {
    id: "pot-templates",
    globs: ["cat-harness/translations/**/*.pot"],
    strategy: "take-base",
    why: "gettext TEMPLATES, extracted from the English pages by pot-for-pages.ts (translation:pot:check). Every edit to a source page rewrites its .pot in every locale. The .po files beside them are authored translations and stay refused. Found 2026-10-01 on #1754.",
  },
  {
    id: "site-data",
    globs: ["cat-harness/docs/assets/**/*.json", "cat-harness/docs/_data/**"],
    strategy: "take-base",
    why: "generated site data indexes (23 + 13). Rewritten from the graph on every regeneration.",
  },
  {
    id: "readme-generated-regions",
    globs: ["**/README.md"],
    strategy: "generated-regions",
    why: "directory READMEs (209). Their generated regions carry file counts and listings that every concurrent addition changes; the prose around them is authored, so only a hunk INSIDE a region resolves.",
  },
  {
    id: "beans",
    globs: ["beans/defs/**"],
    strategy: "refuse",
    why: "bean definitions (44). Authored work-plan state, so it is resolved by a person. It may be TWO sessions editing one bean, which is a coordination question — or ONE session whose claim went to the default branch while its completion stayed on the branch, which is `beans:claim`'s normal path and needs no coordination at all (bean `24fa`). Check which before looking for a sibling. Either way, do not union the front matter: a duplicated updated_at is check-bean-front-matter's recorded defect.",
  },
  {
    id: "artefact-verification",
    globs: ["**/scripts/artefact-verification.json"],
    strategy: "refuse",
    why:
      "the per-check consumer-verification declaration. It READS like a generated sidecar — under `scripts/`, " +
      "a `.json`, its key set DERIVED from `package.json` — and it is the only path that refused on two open " +
      "PRs at once (#1958, #1955, swept 2026-10-03), so it is the one a sweep is most likely to glob by " +
      "mistake. Two facts rule that out. `task-io.ts` classifies `check:artefact-verification` as `READ_ONLY`: " +
      "NO script writes this file, so there is no writer for `regen` to run and `take-base` would be a silent " +
      "discard rather than a resolution. And its own `_comment` requires every `none` entry to carry a REASON " +
      "in prose and says the file may only SHRINK — so a branch that adds a gated check adds an authored " +
      "sentence, which is exactly what taking base would drop. A conflict here is a genuine editorial merge " +
      "(both reasons are wanted; which survives is a judgement), and human merge is the cost of the file's " +
      "shape, not a hole in this catalogue. Bean `mjl3`, which also records the falsifier: if a `--write` is " +
      "ever added that composes the derived keys and carries existing reasons forward, this becomes " +
      "`take-base` and the pattern changes with it.",
  },
  {
    id: "uploads",
    // declared-path-literal: a GLOB matched against conflicted paths, not a
    // directory read; it refuses any uploads/ wherever an instance declares one.
    globs: ["uploads/**", "**/uploads/**"],
    strategy: "refuse",
    why: "uploaded source material (30). Provenance-bearing input, never regenerated.",
  },
];

export interface Classified {
  path: string;
  /** Undefined when no pattern names the path — which refuses. */
  pattern?: ConflictPattern;
  strategy: ConflictStrategy;
}

/** The first declared pattern matching `path`, or a refusal naming no pattern. */
export function classify(path: string, patterns: readonly ConflictPattern[] = PATTERNS): Classified {
  for (const p of patterns) {
    if (p.globs.some((g) => new Bun.Glob(g).match(path))) return { path, pattern: p, strategy: p.strategy };
  }
  return { path, strategy: "refuse" };
}

const REGION_BEGIN = /<!--\s*[a-z0-9][a-z0-9:_-]*:begin\s*-->/i;
const REGION_END = /<!--\s*[a-z0-9][a-z0-9:_-]*:end\s*-->/i;

/**
 * Resolve a conflicted file whose every hunk lies inside a generated region,
 * by taking the BASE side ("theirs" when merging the base in) of each hunk.
 * The generator then rewrites the region from the merged tree, so which side
 * was taken does not survive — only the authored text around it does.
 *
 * Returns `undefined` — refuse — when any hunk starts outside a region, or when
 * a hunk's sides contain a region marker (the region's own boundary moved,
 * which is structure, not content).
 */
export function resolveGeneratedRegions(text: string): string | undefined {
  const lines = text.split("\n");
  const out: string[] = [];
  let inRegion = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.startsWith("<<<<<<< ")) {
      if (REGION_BEGIN.test(line)) inRegion = true;
      if (REGION_END.test(line)) inRegion = false;
      out.push(line);
      continue;
    }
    if (!inRegion) return undefined;
    const ours: string[] = [];
    const theirs: string[] = [];
    let side: "ours" | "base" | "theirs" = "ours";
    let closed = false;
    for (i++; i < lines.length; i++) {
      const l = lines[i]!;
      if (l.startsWith("||||||| ")) { side = "base"; continue; }
      if (l === "=======") { side = "theirs"; continue; }
      if (l.startsWith(">>>>>>> ")) { closed = true; break; }
      if (side === "ours") ours.push(l);
      else if (side === "theirs") theirs.push(l);
    }
    if (!closed) return undefined;
    if ([...ours, ...theirs].some((l) => REGION_BEGIN.test(l) || REGION_END.test(l))) return undefined;
    out.push(...theirs);
  }
  return out.join("\n");
}
