/**
 * Where a skill lives, and therefore what "this skill exists" means.
 *
 * Extracted from `check-workflow-refs.ts` so that the reference checker and
 * `kg-audit.ts` cannot disagree about it. Two checkers with two copies of this
 * list is how one of them ends up reporting a wall of false dangling refs —
 * and a check that cries wolf is a check somebody switches off.
 *
 * Kept in step with `GROUPS` in `gen-skill-docs.ts`, plus the two homes that
 * file does not generate from: `schemas/skills/<name>/` (a directory of JSON
 * schemas) and `.claude/skills/<group>/`.
 *
 * @module scripts/known-skills
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, join as joinPath } from "node:path";

import { resolveDirectories } from "../schemas/cat-harness.js";

/**
 * Groups under `.claude/skills/` that hold something other than skills.
 *
 * Each one is a different kind of node in the knowledge graph — participants,
 * environment probes, an assignment table, a shell hook, conformance
 * requirements — and none of them is an instruction body an activity can name.
 *
 * `scripts/generate-registry.ts` states the same taxonomy and is the reason to
 * trust this list rather than the directory's name: it loads `actors/` as
 * `ActorDefinition`, `capabilities/` as `CapabilityDefinition`, `requirements/`
 * as `Requirement` and **only `local/` as `SkillDefinition`**.
 *
 * `requirements/` is the one that looks most like skills and is least like
 * them. Its entries are `{ id: "req:commit-hygiene", statements: [{ conformance:
 * "SHALL", … }], satisfiedBy: [{ kind: "skill", ref: "content-plan" }] }` — a
 * requirement points **at** a skill; it is not one. Reading the four of them as
 * skills is what made `commit-hygiene`, `content-lifecycle`, `lean-verification`
 * and `session-start` appear as reachable skill names with nothing behind them.
 */
export const NON_SKILL_GROUPS = new Set(["actors", "capabilities", "roles", "hooks", "requirements"]);

/**
 * Does this directory hold at least one SKILL `.md` directly?
 *
 * Not merely a `.md`. The two halves of this arrived from opposite directions
 * and meet here: declaration-driven discovery asks WHICH DIRECTORIES to look
 * in, and {@link isSkillMd} asks WHICH FILES in one count. Either alone
 * overcounts — `skills/memory/`'s 25 agent-memory nodes are `.md` in a
 * declared directory, and were admitted until the file-level predicate
 * existed.
 */
function holdsMarkdown(abs: string): boolean {
  if (!existsSync(abs)) return false;
  return readdirSync(abs).some((f) => f.endsWith(".md") && isSkillMd(joinPath(abs, f)));
}

/**
 * The instance's declared `cat-harness` directories, or nothing it cannot read.
 *
 * A declaration that will not parse is the instance's problem to fix, not this
 * function's to guess around — but skill discovery must not crash a tool that
 * had nothing to do with the declaration, so an unreadable one yields an empty
 * list and the explicit extras below still resolve.
 */
function kgDirectories(root: string): Array<{ path: string; absPath: string }> {
  try {
    return resolveDirectories([{ name: "(local)", root, own: true }])
      // EXACTLY `cat-harness`, not merely including it.
      //
      // `schemas/` declares `["schemas", "cat-harness"]` — a schema IS a
      // knowledge-graph node, which is why it carries the kind at all — but
      // its `.md` files are READMEs and its nodes are `.ts`. Including it
      // added `schemas/README.md` and `schemas/block-qa-schema/README.md` to
      // the skill set: 150 where the corpus has 149.
      //
      // Requiring YAML front matter instead would have been the principled
      // rule and is measurably wrong here: only 117 of 147 skill bodies carry
      // any, so it would have dropped 30 real skills. A directory that holds
      // one kind can be scanned for it; one that holds several has to say
      // which file is which, and for `schemas/` that answer is `@graphNode`
      // on the `.ts`, not a guess about the `.md`.
      .filter((d) => d.graphs.length === 1 && d.graphs[0] === "cat-harness")
      .filter((d) => existsSync(d.absPath));
  } catch {
    return [];
  }
}

/**
 * Is this `.md` a skill, or another node kind that happens to live here?
 *
 * **Declaration over location.** A markdown file whose front matter carries
 * `$schema:` is declaring what it IS, and a skill does not — skills declare
 * `name` / `summary`. So a `$schema` is a positive statement that this file is
 * something else, and it is the same contract `part-of:` carries for a split
 * skill's siblings.
 *
 * ## This module's own header was falsified, and this is the repair
 *
 * {@link skillMdDirs} says non-skill directories under `skills/` "are excluded
 * by carrying **no `.md`**, which is the same test that admits a package", and
 * that "a directory that later grows a `.md` is a decision somebody makes
 * visibly". `skills/memory/` is exactly that directory: 25 agent-memory nodes,
 * every one a `.md`, none a skill. Measured 2026-09-19 — before this guard,
 * `skill-coverage.test.ts` demanded a published reference page for all 25, and
 * `kg-audit` had already written 25 bogus `kg-qa/` sidecars beside them
 * asserting brevity and heading rules against files that are not instruction
 * bodies.
 *
 * The visible decision the header asks for is the `$schema` line inside each
 * file, not the directory's name — a name list is the thing this module exists
 * to stop, and a directory's contents can be mixed.
 *
 * Unreadable is **not** "not a skill": an unreadable file returns `true` and is
 * counted, so a permissions error or a truncated read cannot silently shrink
 * the skill set. Undercounting here is what produces a clean run over nothing.
 */
export function isSkillMd(path: string): boolean {
  let text: string;
  try {
    text = readFileSync(path, "utf-8");
  } catch {
    return true;
  }
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  return fm === null || !/^\$schema:\s*\S+/m.test(fm[1]!);
}

/**
 * Directories holding one `<skill>.md` per skill, DISCOVERED rather than listed.
 *
 * ## Why it stopped being a literal
 *
 * It was five hardcoded entries, four of them under `skills/`. Measured
 * 2026-09-19: **six** `skills/` directories hold `.md`, so `authoring-math`
 * (3 skills) and `authoring-who-smart-guidelines` (9) were absent from the one
 * function that answers "does this skill exist".
 *
 * Nothing had broken, and that is the point. All twelve resolved anyway
 * through a SECOND home — eleven because they also have a
 * `schemas/skills/<name>/` I/O contract, and `smart-base-tools` because it
 * also has `.claude/skills/local/smart-base-tools.json`. Delete any one of
 * those second homes and `check-workflow-refs` reports a real, present skill
 * as dangling: the "wall of false dangling refs" this module's own header says
 * it exists to prevent, arriving from the module itself.
 *
 * `kg-export.ts`'s `skillMdDirs()` already scanned `skills/*` dynamically and
 * saw all six, so the two definitions disagreed BY CONSTRUCTION and agreed only
 * BY COINCIDENCE. A list somebody has to remember to extend is not a single
 * answer; it is a copy that happens to match today.
 *
 * ## Why scanning is safe here
 *
 * `skills/` is not uniformly skill packages — `framework/`, `permissions/`,
 * `remote-packages/`, `requirements/`, `roles/` and `workflows/` are other
 * node kinds. Most are excluded by carrying **no `.md`**, which is the same
 * test that admits a package, rather than by a name list that would need the
 * same remembering.
 *
 * **That test alone was not enough, and it was falsified within the day.**
 * This doc said "a directory that later grows a `.md` is a decision somebody
 * makes visibly"; `skills/memory/` then arrived with 25 of them, none a skill.
 * So the admitting test is now `.md` **that {@link isSkillMd} accepts** — the
 * visible decision is the `$schema` line inside each file rather than the
 * directory's name, because a name list is the thing this module exists to
 * stop and a directory's contents can be mixed.
 */
export function skillMdDirs(root: string): string[][] {
  const dirs: string[][] = [];

  // Every directory the instance DECLARES as holding a `cat-harness` graph —
  // not the literal `skills/`.
  //
  // This is what lets a topical directory (`bootstrap/`, `crdm/`, …) cost a
  // declaration line and no code change. The literal was the last thing
  // standing between the layout and the declaration that is supposed to
  // describe it: `harness.json` said where the knowledge graph lives and
  // this function did not read it.
  //
  // `resolveDirectories` supplies the defaults too, so an instance that
  // follows the convention still resolves `skills/` without declaring it.
  for (const d of kgDirectories(root)) {
    // The directory itself, when it holds skills directly — the shape a
    // topical directory has (`bootstrap/getting-started.md`).
    if (holdsMarkdown(d.absPath)) dirs.push([d.path.replace(/\/+$/, "")]);
    // ...and its immediate subdirectories, which is how `skills/` is laid out
    // today: one package per subdirectory.
    for (const e of readdirSync(d.absPath, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const inner = join(d.absPath, e.name);
      if (holdsMarkdown(inner)) dirs.push([d.path.replace(/\/+$/, ""), e.name]);
    }
  }
  // Not under `skills/`, so not reachable by the scan above.
  if (existsSync(join(root, "src", "skills"))) dirs.push(["src", "skills"]);

  // `.claude/skills/<group>/`, minus the groups that hold other node kinds.
  //
  // A DENY-list, so a new group of real skills is picked up automatically and a
  // new group of something else is a one-line addition to
  // {@link NON_SKILL_GROUPS}. `kg-export.ts` had its own copy of this that
  // hardcoded `local` alone; measured 2026-09-19 by creating
  // `.claude/skills/probegroup/probe-skill.md`, which `knownSkills()` resolved
  // and the exported graph did not — a skill by this repository's own
  // definition, absent from the graph. Latent rather than live (only `local`
  // exists today), and now impossible: the exporter reads this function.
  const localRoot = join(root, ".claude", "skills");
  if (existsSync(localRoot)) {
    for (const g of readdirSync(localRoot, { withFileTypes: true })) {
      if (!g.isDirectory() || NON_SKILL_GROUPS.has(g.name)) continue;
      if (readdirSync(join(localRoot, g.name)).some((f) => f.endsWith(".md"))) {
        dirs.push([".claude", "skills", g.name]);
      }
    }
  }
  return dirs;
}



/**
 * Skills a **declared remote package** supplies, which this instance does not hold.
 *
 * Two questions, and they must not be collapsed:
 *
 *  - **can this instance SERVE it** — {@link knownSkills}. A remote skill is
 *    `false` here: its body is in another repository, so `skill_fetch` cannot
 *    answer for it and an activity naming it is a real dangling reference.
 *  - **is this entry a real skill SOMEWHERE** — this function, unioned with
 *    {@link knownSkills}. A bundle manifest curating a remote skill is the
 *    design, not a defect.
 *
 * This lived only in `kg-audit.ts`, whose own comment records the near-miss:
 * *"collapsing them would have had this criterion demand the deletion of three
 * correct manifest entries the first time it ran. That very nearly happened."*
 *
 * **It then happened anyway, because the answer was in one checker and not the
 * other.** `d3e63f15a` set out to fix exactly the two-definitions defect — it
 * pointed `skill-manifest-coverage.test.ts` at `knownSkills()` so the test and
 * this module could not disagree — but `knownSkills()` had never read
 * `remote-packages/`, so it was a THIRD definition. Under it,
 * `scientific-visualization`, `hypothesis-generation` and
 * `scientific-critical-thinking` read as dangling, and all three were deleted
 * from `skills/authoring-math/package-manifest.json` two hours after bean
 * `m4zg` recorded that deleting them would be wrong. The evidence offered was a
 * `git log --diff-filter=A` search finding no file ever added for any of them —
 * which is the wrong question, because a remote skill has no file here by
 * design.
 *
 * So the answer lives beside the other one now. A checker that needs the wider
 * question unions the two; a checker that needs the narrower one does not, and
 * the difference is visible at the call site instead of buried in whether a
 * module happened to scan a directory.
 */
export function remotePackageSkills(root: string): Set<string> {
  const out = new Set<string>();
  const dir = join(root, "skills", "remote-packages");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        wrapper?: { skills?: string[] };
      };
      for (const s of p.wrapper?.skills ?? []) out.add(s);
    } catch {
      // A remote-package file that will not parse is validate-skills.ts's finding.
    }
  }
  return out;
}

/**
 * Every name a **manifest entry** may legitimately carry: held here, or
 * declared by a remote package.
 *
 * The one answer to "is this a real skill somewhere". Named rather than left as
 * a union at each call site, because the union IS the rule and two call sites
 * spelling it out is how they come to disagree.
 */
export function manifestResolvableSkills(root: string): Set<string> {
  return new Set([...knownSkills(root), ...remotePackageSkills(root)]);
}

/** Every skill name this instance can resolve. */
export function knownSkills(root: string): Set<string> {
  const names = new Set<string>();

  for (const parts of skillMdDirs(root)) {
    const dir = join(root, ...parts);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      // Filtered per FILE, not per directory: admitting a package says the
      // directory holds skills, never that everything in it is one. A mixed
      // directory is explicitly allowed here -- #263's rule that a place to
      // look may hold more than one part of the graph.
      if (f.endsWith(".md") && isSkillMd(join(dir, f))) names.add(f.slice(0, -3));
    }
  }

  // `schemas/skills/<name>/` — a directory per skill, beside loose .json files.
  const schemaDir = join(root, "schemas", "skills");
  if (existsSync(schemaDir)) {
    for (const e of readdirSync(schemaDir, { withFileTypes: true })) {
      if (e.isDirectory()) names.add(e.name);
    }
  }

  // `.claude/skills/<group>/<name>.{md,json}` — but only the groups that hold
  // skills.
  //
  // This directory is NOT uniformly skills, and reading it as though it were
  // was a live defect: `actors/` holds eighteen participants, `capabilities/`
  // holds environment probes (`docker`, `pandoc`, `python3`), `roles/` holds an
  // assignment table and `hooks/` holds a shell script. Scanning all of them
  // put 46 non-skills into the skill set — which means a diagram could have
  // referenced `<folio:skill ref="viewer"/>` or `ref="latex-compiler"` and the
  // reference checker would have called it resolved.
  //
  // The list is a deny-list of the groups that are known not to be skills
  // rather than an allow-list of `local/`, so that a NEW group of real skills
  // is picked up automatically and a new group of something else is a one-line
  // addition here.
  // Only `.json` here: the `.md` files come through `skillMdDirs()` above, so
  // the deny-list is applied in ONE place rather than two that can disagree.
  const localRoot = join(root, ".claude", "skills");
  if (existsSync(localRoot)) {
    for (const g of readdirSync(localRoot, { withFileTypes: true })) {
      if (!g.isDirectory() || NON_SKILL_GROUPS.has(g.name)) continue;
      for (const f of readdirSync(join(localRoot, g.name))) {
        if (f.endsWith(".json")) names.add(f.slice(0, -5));
      }
    }
  }

  return names;
}

/**
 * Where this instance's BPMN and DMN live, read from the declaration.
 *
 * ## The literal this replaces
 *
 * Nine production sites hardcoded `skills/workflows` — `src/tools/workflow.ts`,
 * `src/impact/stakeholder-map.ts`, `src/workflow/corpus-gate.ts`,
 * `scripts/kg-audit.ts`, `scripts/translate-bpmn.ts`, `scripts/render-bpmn.ts`,
 * `scripts/xml-comment-check.ts` among them. Nine copies of one fact is the
 * same defect `known-skills.ts` was extracted to fix for skills, one directory
 * along, and it is what would have made a topical split a nine-file edit
 * instead of a declaration.
 *
 * ## The shape
 *
 * A `cat-harness` directory's `workflows/` subdirectory, plus the directory
 * itself when it holds diagrams directly. That covers today's
 * `skills/workflows/` and a topical `bootstrap/workflows/` without either
 * being written down.
 *
 * Returns ABSOLUTE paths, unlike {@link skillMdDirs}, because every caller
 * reads files from them rather than composing repo-relative ids.
 */
export function workflowDirs(root: string): string[] {
  const out: string[] = [];
  for (const d of kgDirectories(root)) {
    const wf = joinPath(d.absPath, "workflows");
    if (existsSync(wf)) out.push(wf);
    else if (readdirSync(d.absPath).some((f) => f.endsWith(".bpmn") || f.endsWith(".dmn"))) {
      out.push(d.absPath);
    }
  }
  return out;
}

/**
 * Every `.bpmn` and `.dmn` this instance declares, as absolute paths.
 *
 * One call for the common case, so a caller that only wants the files does not
 * have to re-derive "and their `decisions/` subdirectory too".
 */
export function workflowFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = joinPath(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".bpmn") || e.name.endsWith(".dmn")) out.push(p);
    }
  };
  for (const d of workflowDirs(root)) walk(d);
  return out.sort();
}
