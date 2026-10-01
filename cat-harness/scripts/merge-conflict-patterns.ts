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
    why: "LSI indexes, detangle sidecars and tool-run records (56 + 71 + 15). Recomputed from the whole corpus, so any concurrent skill or schema change touches them.",
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
    id: "glossary",
    globs: ["cat-harness/docs/glossary/**", "cat-harness/docs/lsi/**"],
    strategy: "take-base",
    why: "the generated glossary and LSI pages (173 + 34). Whole-corpus aggregates; concurrent term additions always collide.",
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
    why: "bean definitions (44). Authored work-plan state: two sessions editing one bean is a coordination question, and a duplicated updated_at from a careless resolution is check-bean-front-matter's recorded defect.",
  },
  {
    id: "uploads",
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
