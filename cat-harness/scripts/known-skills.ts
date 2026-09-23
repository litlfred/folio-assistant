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
import { basename, isAbsolute, join, join as joinPath, relative, resolve } from "node:path";

import { resolveDirectories, repoRootFor, isKgContentDirectory } from "../schemas/cat-harness.js";
import { readRoleGraph, type RoleGraph } from "../schemas/role-graph.js";
import { parseFrontMatter, scalar, type FrontMatter } from "../schemas/front-matter.js";
// The `folio` graph kind is registered by CORE. This module is a LIBRARY, so it
// does NOT import that registration: a library's edge is inherited by every
// module that imports it, and the harness may not depend on core. The
// COMMAND that runs carries it — and since #840 every caller does, because
// the trigger sits at the foot of `cat-harness.ts` and a reader lives in that
// module, so loading it is a precondition of calling one.
//
// THIS COMMENT NAMED `check:composition-roots` AS THE GUARANTEE UNTIL
// 2026-09-22, in SEVEN files, AND THAT SCRIPT DOES NOT EXIST. `bun run
// check:composition-roots` exits "Script not found". The safety argument for
// a library omitting the registration rested on a gate nobody built, and no
// gate failed to say so — the same silence this repository keeps paying for.
// It is moot now rather than fixed: #840 made the registration automatic, so
// there is no longer a command that can forget it (bean `z9ax`).

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
// `conventions` joins these for the same reason as the rest: the directory
// holds a different NODE KIND, and a scan that took them for skills would
// publish a convention as something an activity could implement.
export const NON_SKILL_GROUPS = new Set([
  "actors", "capabilities", "roles", "hooks", "requirements", "conventions",
]);

/**
 * Does this directory hold at least one SKILL `.md` directly?
 *
 * Not merely a `.md`. The two halves of this arrived from opposite directions
 * and meet here: declaration-driven discovery asks WHICH DIRECTORIES to look
 * in, and {@link isSkillMd} asks WHICH FILES in one count. Either alone
 * overcounts — the 25 agent-memory nodes then in `skills/memory/` were `.md` in a
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
 *
 * **Exported, and it carries `id`, because the path is the unstable half.**
 * {@link kgRoots} drops everything but `absPath`, which is all a scanner
 * needs; a consumer that must NAME a root needs the declared id. `harness.json`
 * states the rule on its own `cat-harness` entry — *"ids are stable across a
 * relocation, paths are not"* — and `gen-skill-docs` is where it was paid for:
 * it keyed a category heading on the basename, that basename was `bootstrap`
 * only while the root was `bootstrap/`, and when #422 moved the skills to
 * `bootstrap/skills/` the generator demanded a heading for a package called
 * "skills".
 */
export function kgDirectories(root: string): Array<{ id: string; path: string; absPath: string }> {
  try {
    return resolveDirectories([{ name: "(local)", root, own: true }])
      // EXACTLY ONE knowledge-graph kind, not merely including one.
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
      .filter(isKgContentDirectory)
      .filter((d) => existsSync(d.absPath));
  } catch (err) {
    // NOT swallowed into an empty list, and the reason is measured.
    //
    // This was `catch { return []; }`. `AGENTS.md` states the contract it was
    // silently breaking: "Absent declaration is fine (an unmigrated instance
    // falls back to today's conventions); a present-but-unreadable one throws."
    // So the only thing this catch could ever catch was the case that is
    // supposed to be loud — and it turned it into "this instance has no
    // knowledge-graph directories".
    //
    // Measured 2026-09-20, when a `folio` graph was first declared here
    // (issue #464): `resolveDirectories` threw, this returned `[]`,
    // `workflowDirs` found nothing, and `translate-bpmn --check` reported
    // "No .bpmn files in any declared knowledge-graph directory" and EXITED 0
    // on a repository holding 36 of them. `skill_list` and `skill_fetch` read
    // the same list. That is the `dh4f` defect from the inside — a consumer
    // scans nothing and reports a clean run over it — and it is worse than the
    // error it was hiding, because a broken declaration is recoverable and a
    // silent empty graph is believed.
    throw new Error(
      `cannot resolve knowledge-graph directories for ${root}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
}

/**
 * Every directory the instance declares as holding ONLY its knowledge graph.
 *
 * Absolute paths. This is the answer to `join(root, "skills")` — the literal
 * `check:declared-paths` found in a dozen consumers, each of which a topical
 * layout (`bootstrap/`, `crdm/`) breaks silently.
 *
 * ## It is a LIST, and callers must not quietly take the first
 *
 * One root is today's shape, not the contract. A consumer that scans for
 * role graphs, memory nodes or requirements has to look in every declared
 * root or it reports a clean run over the ones it did not visit — the `dh4f`
 * defect, arriving through a helper that was supposed to prevent it. Where a
 * call site genuinely needs one directory (a WRITE target, a fallback), it
 * says so and carries its reason.
 *
 * `schemas/` is excluded because it declares TWO graphs: it is a
 * knowledge-graph node AND the schema definitions, and its `.md` files are
 * READMEs. See {@link kgDirectories} for the measurement that established it.
 */
/**
 * This instance's role graph, found across EVERY declared graph root.
 *
 * Callers wrote `readRoleGraph(kgRoots(root)[0])`, which worked only while the
 * roles lived under the first root returned. Since 2026-09-21 they are in
 * `scenarios/`, a declared directory of its own, and `[0]` is `skills/` — so
 * taking the first root silently returned `undefined` and every consumer read
 * that as "this instance declares no roles".
 *
 * That is the `kgRoots(root)[0]` hazard AGENTS.md names outright: taking the
 * first root is the `dh4f` defect arriving through the helper written to
 * prevent it. One root is today's shape, never the contract.
 */
export function roleGraphFor(root: string): RoleGraph | undefined {
  for (const r of kgRoots(root)) {
    const g = readRoleGraph(r);
    if (g !== undefined) return g;
  }
  return undefined;
}

export function kgRoots(root: string): string[] {
  return kgDirectories(root).map((d) => d.absPath);
}

/**
 * Knowledge-graph roots this audit may write sidecars for.
 *
 * **Every root the instance DECLARES, minus the ones belonging to another
 * instance** — bean `lps0`. This walked the literal
 * `KG_ROOT = join(root, "skills")`, so a skill in a topical directory was not
 * audited AND not reported as unaudited: the `dh4f` shape inside the tool
 * whose job is finding that shape. Measured when it was fixed — 219 skills
 * under the literal, 229 under the declaration, and the 10 in the gap had
 * never been audited at all.
 *
 * ## Another instance's roots are excluded, and that is not this function's
 * ## judgement to make
 *
 * `kgRoots` resolves a DEPENDENCY's directories too, so it returns paths like
 * `../bootstrap/skills`. Walking them is forbidden by
 * `instance-graph-isolation.test.ts`, which guards a live 2026-09-19 leak of
 * 88 references: one instance's graph must not carry another's nodes.
 * `unreadNestedInstances` states the same rule in its own finding text — *"do
 * NOT declare its directories here"*.
 *
 * It would break this audit's own output as well. {@link sidecarPath}
 * composes `dirname(join(root, subject.path))` and mirrors it under
 * `test/results/kg-qa/`, so a `../` subject normalises to
 * `test/results/bootstrap/render` — **outside the results tree
 * altogether**, which is the escaping-path defect bean `chq5` fixed one store
 * over.
 *
 * **The exclusion is not silent, and it needs nothing added here.** The
 * `nested-instance-audited` criterion already names every unread nested
 * instance and counts what it holds — added by bean `sa8y` for exactly this
 * invisibility. A second report from this function would be a second answer to
 * one question, free to disagree with the first.
 */
export function ownKgRoots(root: string): string[] {
  const here = resolve(root);
  const kept = kgRoots(root).filter((r) => {
    const rel = relative(here, resolve(r));
    // `rel === ""` is the instance root itself, which would walk everything
    // including its own results tree.
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  });
  // DEDUPLICATED. `resolveDirectories` supplies the conventional defaults
  // alongside the declaration, so an instance that ALSO declares `skills/`
  // gets it twice — measured on a fixture declaring it explicitly. Harmless to
  // a caller that dedupes its own output and wasteful to one that does not,
  // and a caller cannot tell the two apart from the list alone.
  return [...new Set(kept.map((r) => resolve(r)))].sort();
}

/**
 * NOTE ON THE EXAMPLES BELOW: the agent-memory nodes moved out of
 * `skills/memory/` to the declared `memory/` graph on 2026-09-20 (bean
 * `07xs`), so they are no longer scanned here at all. The history is kept in
 * the present tense of the defect rather than rewritten, because the
 * file-level predicate exists BECAUSE of it — and `isSkillMd` is still what
 * does the work, which is why the move was safe rather than urgent. A reader
 * following `skills/memory/` today finds nothing; that is the point.
 *
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
 * visibly". `skills/memory/` was exactly that directory: 25 agent-memory nodes,
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
  // A README is documentation ABOUT a directory, never a node IN it.
  //
  // This is the one name-based exclusion in a module whose whole doctrine is
  // declaration over location, and it earns the exception by being a
  // filesystem-wide convention rather than this repository's layout: no
  // directory anywhere has a skill called `README`.
  //
  // It has already cost something once. `schemas/` is excluded from the KG
  // scan partly because "its `.md` files are READMEs" — without that, the
  // corpus read 150 skills where it holds 149. Now `bootstrap/README.md` is
  // the entry point an agent with no context reads first, and declaring
  // `bootstrap/` as a knowledge graph would have admitted it as a skill named
  // `README`, making `<folio:skill ref="README"/>` resolve and handing
  // `kg-audit` a sidecar asserting heading and brevity rules against a
  // README. Requiring every README to carry a `$schema` disclaimer instead
  // would mean inventing a schema so that a file can say it is not something
  // it was never going to be.
  if (basename(path).toLowerCase() === "readme.md") return false;

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
    // RELATIVE TO `root`, computed from the absPath the resolver already
    // produced — not from `d.path`, which is relative to whatever root the
    // entry's SCOPE names. Those were the same directory until the move (bean
    // `wggr`); afterwards `bootstrap/skills/` is repository-scoped, so `d.path`
    // said `bootstrap/skills` while `root` was the instance, and every caller
    // resolved `<instance>/bootstrap/skills`. kg-export's `collectSkills`
    // skips a directory that is not there as "a package this instance does not
    // carry", so bootstrap's skills left the published graph IN SILENCE —
    // `confirm-harness` became a dangling `hasSkill` and `kg-navigation` only
    // looked fine because a second copy exists under `skills/` (bean `v3se`).
    //
    // `relative()` may yield a `../` prefix, and that is correct here: it is a
    // COMPUTED path between two known roots, not a declared one. The
    // dot-prefix guard in `check-harness-dirs.ts` governs what a declaration
    // may SAY, which is still `bootstrap/skills/` with a scope beside it.
    // SPLIT back into segments, preserving this function's contract: callers
    // index them (`p[0] === "skills"`, `p[1]` is the package name) as well as
    // joining them. Returning one joined string fixed the root and broke the
    // shape, which `skill-coverage.test.ts` caught by asserting set equality
    // against the filesystem.
    const rel = (abs: string): string[] => relative(root, abs).split("/");
    // The directory itself, when it holds skills directly — the shape a
    // topical directory has (`bootstrap/getting-started.md`).
    if (holdsMarkdown(d.absPath)) dirs.push(rel(d.absPath));
    // ...and its immediate subdirectories, which is how `skills/` is laid out
    // today: one package per subdirectory.
    for (const e of readdirSync(d.absPath, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const inner = join(d.absPath, e.name);
      if (holdsMarkdown(inner)) dirs.push(rel(inner));
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
  const localRoot = join(repoRootFor(root), ".claude", "skills");
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
  // Derived from the per-declaration reader below rather than scanning the
  // directory again: two readers of one directory is how they come to disagree,
  // which is the defect this module's header is about.
  return new Set(remotePackageDeclarations(root).map((d) => d.skill));
}

/** One declared skill, and which wrapper declared it. */
export interface RemoteDeclaration {
  /** The wrapper's filename, e.g. `smarter-fhir.json`. */
  file: string;
  /** A name from that wrapper's `wrapper.skills`. */
  skill: string;
  /** The wrapper's `sync` block, verbatim, or `undefined` when it declares none. */
  sync?: unknown;
}

/**
 * Every remote-package declaration, one row per skill, carrying its wrapper.
 *
 * `remotePackageSkills` flattens this to a name set, which is what a "is this a
 * real skill somewhere" check wants. A check that has to REPORT a finding needs
 * the wrapper too: the two files here have different maintainers and different
 * remedies, so a finding that does not name which one declared the skill is one
 * somebody has to measure again. Bean `wlqd`.
 */
export function remotePackageDeclarations(root: string): RemoteDeclaration[] {
  const out: RemoteDeclaration[] = [];
  const dir = join(kgRoots(root)[0] ?? join(root, "skills"), "remote-packages");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        wrapper?: { skills?: string[] };
        sync?: unknown;
      };
      for (const skill of p.wrapper?.skills ?? []) out.push({ file: f, skill, sync: p.sync });
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

/**
 * The skills that declare `consulted: true` — reference material nobody
 * PERFORMS.
 *
 * ## The distinction, and why it had to be declared
 *
 * `kg-audit`'s `skill-in-role-or-process` reported **110 skills bound to no
 * role and no activity**, graded `major`, and the number was not one
 * population. `build-pdf`, `lean-generation` and `proof-triage` are tasks
 * somebody performs; `directory-conventions`, `opening-brief` and
 * `untrusted-input` are what the performer READS. A consulted skill belongs
 * in no lane **by its nature**, so counting it as unbound measures the
 * criterion rather than the corpus.
 *
 * It is not derivable. Two discriminators were tested over the 110 (bean
 * `y1w9`): a sibling `.ts` `SkillDefinition` covers 20 and misses
 * `glossary-build` and `editor`; an `allowed-tools:` line covers 58 and
 * splits the same families arbitrarily. Both cut across the distinction
 * rather than along it. So the axis is real, load-bearing for an audit
 * criterion, and was declared nowhere — the mirror of this repository's
 * usual defect, which is a field declared and read by nothing.
 *
 * ## Why `consulted` is the EXCEPTION rather than the default
 *
 * Absent means performed. Annotating the smaller set is the difference
 * between marking dozens of files and marking every one of them, and an
 * axis whose default costs 180 edits does not get adopted.
 *
 * ## Why this ships with its reader in the same change
 *
 * Bean `qif9` removed a front-matter field that carried 288 annotations and
 * was consumed by nothing, for three months. `kg-audit` reads this one from
 * the commit it lands in, in BOTH directions: the criterion skips a
 * consulted skill, and a separate criterion reports a consulted skill that
 * a lane or a role claims — so a wrong annotation is a finding rather than
 * a quiet exemption.
 */
export function consultedSkills(root: string): Set<string> {
  const out = new Set<string>();
  for (const parts of skillMdDirs(root)) {
    const dir = join(root, ...parts);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md") || !isSkillMd(join(dir, f))) continue;
      let fm: FrontMatter;
      try {
        fm = parseFrontMatter(readFileSync(join(dir, f), "utf-8")).fm;
      } catch {
        // Unreadable is not "not consulted", by the same reasoning
        // `isSkillMd` gives for the opposite default: there, undercounting
        // the skill set produces a clean run over nothing. Here the risk
        // runs the other way — treating an unreadable file as consulted
        // would EXEMPT it from the criterion — so it stays performed and
        // gets reported.
        continue;
      }
      if (scalar(fm, "consulted") === "true") out.add(f.slice(0, -3));
    }
  }
  return out;
}

/**
 * The skills that declare `published: false` — kept out of every published
 * graph, because publishing them advertises what they document.
 *
 * ## Why a declaration, when a name match already worked
 *
 * `isPublishedSkill` strips a skill whose NAME is an unpublished graph kind,
 * and its own note says why that was enough and where it stops:
 *
 * > *"Same list, because the skill and the kind share a name by
 * > construction. If that ever stops being true this needs its own list, not
 * > a cleverer derivation."*
 *
 * This is that list, and it is a declaration rather than a list in code for
 * the reason this repository applies everywhere else — `isSkillMd`, a bean's
 * front matter, a workflow instance's `$schema`: **a directory is a place to
 * look and the file says what it is.** A skill that must not be published
 * says so in its own front matter, where the author who writes it is looking.
 *
 * It EXTENDS the name rule rather than replacing it. The two answer different
 * questions — "is this named after the trashcan" and "did this skill say not
 * to publish it" — and a skill whose subject is an unpublished graph but
 * whose name is something else was previously unexpressible. Keeping both is
 * the "an unavoidable duplicate is fine while an unchecked one is not" rule:
 * the blanket test in `fsh-guts-unpublished.test.ts` asserts the OUTCOME over
 * the built document at any depth, so neither input can quietly stop working.
 *
 * Unreadable is not "publishable", and the asymmetry is deliberate — the same
 * shape as `consultedSkills` above, resolved the other way. There, treating
 * an unreadable file as consulted would EXEMPT it from a criterion, so it
 * stays performed. Here, treating one as publishable would LEAK it, so it
 * stays unpublished.
 */
export function unpublishedSkills(root: string): Set<string> {
  const out = new Set<string>();
  for (const parts of skillMdDirs(root)) {
    const dir = join(root, ...parts);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md") || !isSkillMd(join(dir, f))) continue;
      let fm: FrontMatter;
      try {
        fm = parseFrontMatter(readFileSync(join(dir, f), "utf-8")).fm;
      } catch {
        out.add(f.slice(0, -3));
        continue;
      }
      if (scalar(fm, "published") === "false") out.add(f.slice(0, -3));
    }
  }
  return out;
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
  const localRoot = join(repoRootFor(root), ".claude", "skills");
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
 * Nine production sites hardcoded `processes` — `src/tools/workflow.ts`,
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
 * `processes/` and a topical `bootstrap/processes/` without either
 * being written down.
 *
 * Returns ABSOLUTE paths, unlike {@link skillMdDirs}, because every caller
 * reads files from them rather than composing repo-relative ids.
 */
export function workflowDirs(root: string): string[] {
  const out: string[] = [];
  for (const d of kgDirectories(root)) {
    // `processes/`, the convention since 2026-09-21. An instance that has not
    // migrated declares its diagrams directly and is reached by the second
    // branch below, so no legacy name is needed here.
    // declared-path-literal: the convention fallback, at the call site. This
    // walks a DEPENDENCY's directory, so the local declaration cannot answer
    // for it — the second branch below is what catches an instance that
    // declares its diagrams directly instead.
    const wf = joinPath(d.absPath, "processes");
    if (existsSync(wf)) out.push(wf);
    else if (readdirSync(d.absPath).some((f) => f.endsWith(".bpmn") || f.endsWith(".dmn"))) {
      out.push(d.absPath);
    }
  }
  // DE-DUPLICATED, because the two branches above can name one directory.
  //
  // `skills/` reaches `processes/` by the CONVENTION in the first
  // branch; since the 2026-09-21 split `processes/` is also declared in
  // its own right, kind `processes`, and reaches itself by the second. One
  // directory, two routes, and every caller here walks what it is given — so
  // the duplicate arrived in the export as 1,354 nodes sharing 677 `@id`s,
  // which is the one thing a JSON-LD consumer may not be handed.
  //
  // Deduping HERE rather than in each caller: the ambiguity is created by this
  // function's own two branches, and a caller cannot see that the path it was
  // handed twice is the same directory found two ways.
  return [...new Set(out)];
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
  // Belt and braces on top of `workflowDirs`'s own dedupe: a caller may pass
  // overlapping directories this function never chose, and the same file
  // reached twice is a duplicate `@id` downstream either way.
  return [...new Set(out)].sort();
}
