import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { basename, resolve, join } from "node:path";

import { nodeSummary } from "../../scripts/front-matter.js";
import { isSkillMd } from "../../scripts/known-skills.js";
import { resolveSkillDirs } from "../../schemas/harness-config.js";
import { readDeclaration, findInstanceRoot } from "../../schemas/cat-harness.js";
// The `folio` graph kind is registered by CORE as a load-time side effect
// (`schemas/folio-graph-kind.ts`: "a layer that cannot render must not own the
// renderable kind"), so the harness alone does not know it exists. This module
// reads instance declarations, and this instance now DECLARES a folio graph, so
// without this import `readDeclaration` throws `unknown graph kind "folio"` on a
// declaration that is perfectly valid. Twelve tests and three gates failed that
// way the first time a folio graph was declared here (issue #464) — nothing had
// ever declared one before, so nothing had ever needed the registration to have
// happened. Same import `scripts/kg-export.ts` and
// `scripts/check-avatar-coverage.ts` already carry, and for the same reason.
import "../../schemas/folio-graph-kind.js";

// Session-level cache (lives for the lifetime of the MCP server process)
const skillCache = new Map<string, { content: string; fetchedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Registry of known external skill packages (reference-only, not synced)
const REFERENCE_PACKAGES: Record<string, { repo: string; ref: string; skills: Record<string, string> }> = {
  "academic-research-skills": {
    repo: "Imbad0202/academic-research-skills",
    ref: "main",
    skills: {
      "academic-paper-reviewer": "academic-paper-reviewer/SKILL.md",
      "academic-paper-reviewer/quality-rubrics": "academic-paper-reviewer/references/quality_rubrics.md",
      "academic-paper-reviewer/review-criteria": "academic-paper-reviewer/references/review_criteria_framework.md",
      "academic-paper-reviewer/editorial-standards": "academic-paper-reviewer/references/editorial_decision_standards.md",
      "academic-paper-reviewer/devils-advocate": "academic-paper-reviewer/agents/devils_advocate_reviewer_agent.md",
      "academic-paper-reviewer/methodology-reviewer": "academic-paper-reviewer/agents/methodology_reviewer_agent.md",
      "academic-paper-reviewer/domain-reviewer": "academic-paper-reviewer/agents/domain_reviewer_agent.md",
      "academic-paper-reviewer/eic": "academic-paper-reviewer/agents/eic_agent.md",
      "academic-paper-reviewer/editorial-synthesizer": "academic-paper-reviewer/agents/editorial_synthesizer_agent.md",
      "deep-research": "deep-research/SKILL.md",
      "deep-research/source-verification": "deep-research/agents/source_verification_agent.md",
      "deep-research/devils-advocate": "deep-research/agents/devils_advocate_agent.md",
      "deep-research/evidence-hierarchy": "deep-research/references/source_quality_hierarchy.md",
      "deep-research/logical-fallacies": "deep-research/references/logical_fallacies.md",
      "academic-pipeline": "academic-pipeline/SKILL.md",
      "academic-pipeline/integrity-verification": "academic-pipeline/agents/integrity_verification_agent.md",
      "academic-pipeline/claim-verification": "academic-pipeline/references/claim_verification_protocol.md",
    },
  },
};

// Locally-served skill packages (no network fetch). Each maps a package name to
// the directory holding its `<skill>.md` instruction bodies. The skill lists are
// read from disk so they stay in sync with the files — no hardcoded names.
//   - folio-core             : the core agent skills, including `corpus-grep`,
//                              which sits beside the `.ts` implementing it
//   - content-lifecycle      : plan → author → validate → review → test →
//                              publish → feedback, the skills every BPMN
//                              content process names
//   - authoring-who-smart-guidelines : WHO SMART Guidelines L2/L3 — DAK
//                              components, FSH/SUSHI, validation, IG publication
//   - authoring-math         : the formal-math entry points (Lean, LaTeX) that
//                              route into folio-paper-adapter's depth
//   - folio-core             : content-agnostic platform bundle (skills/folio-core)
//   - folio-document-adapter : prose-folio bundle, no Lean and no required TeX
//   - folio-paper-adapter    : formal-math paper-adapter bundle (skills/folio-paper-adapter)
//
// `folio-document-adapter` and `folio-paper-adapter` are the two halves of one
// content model, not alternatives to pick between: a paper folio wants both,
// because a paper is a document whose blocks may additionally carry Lean. A
// document folio wants the first only — the paper bundle's skills assume a
// toolchain it does not have.
//
// `content-lifecycle` was MISSING from this table until 2026-09-18, and the
// consequence was not subtle: its eight skills — `content-author`,
// `content-validate`, `content-review`, `content-publish`, `content-plan`,
// `content-test`, `content-feedback`, `content-retire` — are named by **52**
// `<folio:skill ref>` activities across the twenty diagrams in
// `processes/`. So `workflow_next` handed an agent `content-validate`,
// the agent called `skill_fetch`, and got "package not found". Every step of
// every content-lifecycle process. `kg:audit`'s `skill-servable` criterion
// exists to keep that closed.
//
// EXPORTED because reachability is not a property of a manifest: a skill is
// reachable when something can SERVE it. `scripts/kg-audit.ts` reads this table
// rather than keeping its own copy, so a package added here cannot be reported
// as unreachable, and one removed here cannot pass.
/** A directory is a skill PACKAGE when it directly holds at least one skill `.md`. */
function holdsSkill(dir: string): boolean {
  try {
    return readdirSync(dir).some((f) => f.endsWith(".md") && isSkillMd(join(dir, f)));
  } catch {
    return false;
  }
}

/**
 * Every servable skill package, discovered from the DECLARED knowledge-graph
 * directories rather than listed by hand.
 *
 * ## Why discovered, and why it took until now
 *
 * This was a hardcoded table, and the cost of that is on the record: a package
 * missing from it is a package `skill_fetch` answers "not found" for, which is
 * how `content-lifecycle` — named by **52** `<folio:skill ref>` activities —
 * was unservable until 2026-09-18.
 *
 * It is discovered through {@link resolveSkillDirs}, which reads each
 * instance's declaration, so a DEPENDENCY's packages are served too. That is
 * the overlay `AGENTS.md` describes as outstanding Phase 0.1 work.
 *
 * ## The filter is the whole design
 *
 * A naive scan of the declared directory is measurably wrong. Taken plainly it
 * adds seven non-package directories — `roles`, `workflows`, `permissions`,
 * `requirements`, `framework`, `remote-packages` and `memory` — and `memory`
 * is the one already on the record for making `kg-audit` write **25 bogus
 * sidecars** against agent-memory nodes that are not instruction bodies.
 *
 * {@link isSkillMd} is what excludes them, and it is **declaration over
 * location**: a markdown file carrying `$schema:` is stating that it is
 * something else. With that filter, discovery reproduces the hand-written
 * table exactly — measured 2026-09-19, no gain and no loss — which is the
 * evidence that this is a refactor and not a behaviour change.
 *
 * ## Later entries win, and that is the overlay order
 *
 * `resolveSkillDirs` returns deepest-dependency-first with the root last, so
 * assigning in order means a root package of the same name overrides a
 * dependency's. Same rule the directory declaration uses, one level down.
 */
export function discoverLocalPackages(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Collected first and named in a SECOND PASS, because which directly-held
  // directory gets the instance name depends on how many there are — see
  // `nameDirectlyHeld`. Deciding it inline made the answer depend on
  // iteration order, which is the defect rather than the implementation.
  const held: string[] = [];
  for (const kgDir of resolveSkillDirs(root)) {
    // A kg directory may hold skills DIRECTLY as well as in subdirectories,
    // and BOTH shapes are real: `skills/` holds none directly and every
    // package is a subdirectory, while `bootstrap/skills/` and
    // `who-iris/skills/` hold theirs at their root with no subdirectory.
    //
    // The worked example through the rest of this comment is `src/skills/`,
    // which held `corpus-grep.md` beside the `.ts` implementing it. It is GONE
    // as of #760 — `skills/folio-core/` already co-located eight such pairs,
    // so the separate directory bought nothing and cost a name: this function
    // called it `cat-harness` while the declaration gave that id to `skills/`.
    // The history below is kept because the RULES it explains are unchanged
    // and were paid for; only their subject moved.
    //
    // A directly-held set is the INSTANCE's own package, named after the
    // instance, because that is what it is — there is no subdirectory name to
    // take. Before `src/skills/` was declared this was a hand-written
    // exception in this file; now it falls out of the declaration.
    //
    // NAMED BY THE INSTANCE THE DIRECTORY LIVES IN, not by the caller's root.
    // `readDeclaration(root)` gave the ROOT's name to every directly-held set
    // regardless of which instance contributed it, which is correct only while
    // exactly one such directory is ever discovered. The moment a second one
    // is — `bootstrap/skills/`, once `ownDirectories` resolved its declared
    // repository scope — both are assigned the same key and the later wins.
    // Not an error, not a collision report: bootstrap's skills would have
    // been found and then silently dropped, which is the same `dh4f` shape one
    // layer up from the one that hid them in the first place.
    //
    // `findInstanceRoot` walks to the nearest enclosing declaration, so the
    // name is a property of where the skills live rather than of who asked:
    // `src/skills/` → `cat-harness/harness.json` → `folio-assistant`,
    // unchanged and measured; `bootstrap/skills/` → `bootstrap/harness.json`
    // → `bootstrap`. A directory under no declaration at all is skipped rather
    // than guessed at.
    //
    // ...AND THE INSTANCE NAME IS TAKEN BY THE `skills` DIRECTORY ALONE.
    // The paragraph above fixed the CROSS-instance half of this collision and
    // left the within-instance half, which `1hvo` walked straight into:
    // `cat-harness` declares `src/skills/` AND now `theming/`, both hold their
    // skills directly, both resolved to the name `folio-assistant`, and the
    // later won — theming's six skills were found and silently dropped, with
    // `kg:audit` reporting all six as `manifest-skill-exists` criticals. The
    // same `dh4f` shape the paragraph above describes, one scope in.
    //
    // Resolved BY A RULE rather than by first-wins, because first-wins is the
    // defect: whichever directory `resolveSkillDirs` happened to yield last
    // took the name. A directory basenamed `skills` IS the instance's own
    // package — there is no other name for it — so it takes the instance name;
    // any other directly-held directory takes its own basename, which is what
    // a person calls it anyway. `src/skills/` stayed `folio-assistant` and
    // `bootstrap/skills/` stays `bootstrap`, both measured unchanged
    // at the time; `theming/` becomes `theming`. Since #760 removed
    // `src/skills/`, the live subjects of rule 1 are `bootstrap/skills/`,
    // `kg-navigation/skills/`, `large-datasets/skills/` and
    // `who-iris/skills/`.
    //
    // Two `skills`-named directly-held directories in ONE instance would still
    // collide. That is a narrower and more obviously wrong configuration than
    // the one this fixes, and inventing a disambiguator for it now would be a
    // rule with no subject.
    if (holdsSkill(kgDir)) held.push(kgDir);
    for (const e of readdirSync(kgDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const dir = join(kgDir, e.name);
      if (holdsSkill(dir)) out[e.name] = dir;
    }
  }
  Object.assign(out, nameDirectlyHeld(held));
  return out;
}

/**
 * Name the directly-held kg directories, in one pass over all of them.
 *
 * ## Why this cannot be decided one directory at a time
 *
 * Three rules, and the third needs the whole set:
 *
 * 1. A directory basenamed **`skills`** is the instance's own package — there
 *    is no other name for it — so it takes the instance's name. `src/skills/`
 *    stays `folio-assistant`; `bootstrap/skills/` stays `bootstrap`.
 * 2. Otherwise, if it is the instance's **only** directly-held directory, it
 *    takes the instance's name, because there is nothing to disambiguate it
 *    from and the instance's name is the better one.
 * 3. Otherwise it takes its **basename** — `theming/`, `methodologies/crdm/`.
 *
 * Rule 2 is the one that needs the set, and stating it as "unique" rather than
 * "first" is the whole point: FIRST-WINS was the defect. `cat-harness`
 * declares `src/skills/`, `theming/`, `methodologies/crdm/` and
 * `methodologies/raci/` — four directly-held directories, all resolving to the
 * name `folio-assistant`, with the last assignment winning. Measured on
 * 2026-09-20 (bean `1hvo`): three packages were found and silently dropped,
 * `kg:audit` reported six `manifest-skill-exists` CRITICALs for theming alone,
 * and 27 further MAJORs were CRDM activities whose skills nothing could serve.
 * No collision was reported and nothing threw — `dh4f` one scope in from the
 * cross-instance half the caller's docs describe.
 *
 * Two `skills`-basenamed directories in ONE instance would still collide. That
 * is a narrower and more obviously wrong configuration, and inventing a
 * disambiguator for it now would be a rule with no subject.
 */
function nameDirectlyHeld(dirs: readonly string[]): Record<string, string> {
  const instanceOf = new Map<string, string | undefined>();
  for (const dir of dirs) {
    const r = findInstanceRoot(dir);
    // A directory under no declaration at all is skipped rather than guessed
    // at, exactly as before.
    instanceOf.set(dir, r === undefined ? undefined : readDeclaration(r)?.name);
  }
  const count = new Map<string, number>();
  for (const name of instanceOf.values()) {
    if (name !== undefined) count.set(name, (count.get(name) ?? 0) + 1);
  }
  const out: Record<string, string> = {};
  for (const dir of dirs) {
    const name = instanceOf.get(dir);
    if (name === undefined) continue;
    const base = basename(dir);
    out[base === "skills" || count.get(name) === 1 ? name : base] = dir;
  }
  return out;
}

// EXPORTED because reachability is not a property of a manifest: a skill is
// reachable when something can SERVE it. `scripts/kg-audit.ts` reads this table
// rather than keeping its own copy, so a package added here cannot be reported
// as unreachable, and one removed here cannot pass.
export const LOCAL_PACKAGES: Record<string, string> = discoverLocalPackages(
  resolve(__dirname, "..", ".."),
);

/** A servable skill: its id, and what it says it is — when it says anything. */
export interface LocalSkill {
  id: string;
  /** `undefined` when the file declares no `description:` and has no heading. */
  summary?: string;
}

/**
 * List the skills available in a local package dir, each with its summary.
 *
 * **The summary is the whole point, and it was missing.** `AGENTS.md` tells a
 * cold agent to reach for `skill_list` because it gives "what skills exist
 * here, **with their one-line summaries**" — and until 2026-09-19 it gave 150
 * bare names and the `skill_fetch` call to retrieve each. An agent handed 150
 * undifferentiated identifiers cannot pick; it can only fetch at random or
 * fall back to opening files, which is the behaviour the tool exists to
 * replace. Bean `1hsf`.
 *
 * A missing summary stays `undefined` rather than becoming `""`. See
 * `nodeSummary` — a node that never declared itself must not read as one that
 * declared itself as nothing.
 */
function listLocalSkills(dir: string): LocalSkill[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const id = f.slice(0, -3);
      // A skill whose body cannot be read is listed WITHOUT a summary rather
      // than dropped: it is servable, `skill_fetch` will report the real error,
      // and silently shortening the list would hide a skill from the only
      // inventory an agent has.
      let summary: string | undefined;
      try {
        summary = nodeSummary(readFileSync(join(dir, f), "utf8"));
      } catch {
        summary = undefined;
      }
      return { id, summary };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
export function registerSkillFetchTools(server: McpServer): void {
  server.tool(
    "skill_fetch",
    "Fetch a skill's instruction body for the agent to follow. Serves the local " +
    "platform bundles (package_name 'folio-assistant' = agent skills, 'content-lifecycle' = " +
    "the plan/author/validate/review/test/publish/feedback skills every BPMN content " +
    "process names, 'folio-core' = " +
    "content-agnostic platform skills, 'folio-document-adapter' = prose-folio skills " +
    "(no Lean, no required TeX), 'folio-paper-adapter' = formal-math paper skills) " +
    "and external reference packages (Tier 2 escalation: academic-paper-reviewer, " +
    "deep-research, academic-pipeline).",
    {
      skill: z.string().describe(
        "Skill identifier. Examples: 'lean-generation' (package_name 'folio-paper-adapter'), " +
        "'bean-coordination' (package_name 'folio-core'), 'corpus-grep' (package_name 'folio-assistant'), " +
        "'content-validate' (package_name 'content-lifecycle'), " +
        "'l3-fhir-authoring' (package_name 'authoring-who-smart-guidelines'), " +
        "'academic-paper-reviewer' (package_name 'academic-research-skills')"
      ),
      package_name: z.string().default("folio-core").describe(
        "Package name. Local: 'folio-assistant' | 'content-lifecycle' | 'folio-core' | " +
        "'folio-document-adapter' | 'folio-paper-adapter' | " +
        "'authoring-who-smart-guidelines' | 'authoring-math'. " +
        "Reference: 'academic-research-skills'."
      ),
    },
    async ({ skill, package_name }) => {
      const localDir = LOCAL_PACKAGES[package_name];
      if (localDir) {
        const available = listLocalSkills(localDir).map((s) => s.id);
        if (!available.includes(skill)) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Unknown skill '${skill}' in package '${package_name}'. Available: ${available.join(", ")}`,
            }],
          };
        }
        const skillPath = join(localDir, `${skill}.md`);
        if (!existsSync(skillPath)) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Skill file not found at ${skillPath}`,
            }],
          };
        }
        const content = readFileSync(skillPath, "utf-8");
        return {
          content: [{
            type: "text" as const,
            text: `# ${skill} (served locally from ${package_name})\n\n${content}`,
          }],
        };
      }

      const pkg = REFERENCE_PACKAGES[package_name];
      if (!pkg) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: Unknown package '${package_name}'. Available: ${[...Object.keys(LOCAL_PACKAGES), ...Object.keys(REFERENCE_PACKAGES)].join(", ")}`,
          }],
        };
      }

      const skillPath = pkg.skills[skill];
      if (!skillPath) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: Unknown skill '${skill}' in package '${package_name}'. Available skills:\n${Object.keys(pkg.skills).map(s => `  - ${s}`).join("\n")}`,
          }],
        };
      }

      // Check cache
      const cacheKey = `${package_name}/${skill}`;
      const cached = skillCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return {
          content: [{
            type: "text" as const,
            text: `# ${skill} (cached)\n\n${cached.content}`,
          }],
        };
      }

      // Fetch from GitHub raw
      const url = `https://raw.githubusercontent.com/${pkg.repo}/${pkg.ref}/${skillPath}`;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Failed to fetch ${url} — HTTP ${resp.status} ${resp.statusText}`,
            }],
          };
        }
        const content = await resp.text();
        skillCache.set(cacheKey, { content, fetchedAt: Date.now() });
        return {
          content: [{
            type: "text" as const,
            text: `# ${skill} (fetched from ${pkg.repo})\n\n${content}`,
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: Network failure fetching ${url} — ${err instanceof Error ? err.message : String(err)}`,
          }],
        };
      }
    },
  );

  server.tool(
    "skill_list",
    "List available skills WITH their one-line summaries — the local platform bundles " +
    "(folio-assistant, content-lifecycle, folio-core, folio-document-adapter, " +
    "folio-paper-adapter, authoring-who-smart-guidelines, authoring-math) and external " +
    "reference packages — each fetchable via skill_fetch. Call this before improvising a " +
    "procedure: the summary is what lets you pick the right skill without fetching several.",
    {},
    async () => {
      const lines: string[] = ["# Available Skills\n"];

      for (const [pkgName, dir] of Object.entries(LOCAL_PACKAGES)) {
        const skills = listLocalSkills(dir);
        lines.push(`## ${pkgName} (local, ${skills.length} skills)\n`);
        for (const s of skills) {
          // The summary, not the fetch call. Every row previously ended in
          // `skill_fetch skill="x" package_name="y"` — the same template with
          // two substitutions, repeated 150 times, telling the reader nothing
          // they could not derive from the heading and the id. The invocation
          // is stated once below the list instead, and the row carries the one
          // fact only the file knows.
          lines.push(s.summary ? `- **${s.id}** — ${s.summary}` : `- **${s.id}** — _(no summary declared)_`);
        }
        lines.push("");
        lines.push(`Fetch any of these with \`skill_fetch skill="<id>" package_name="${pkgName}"\`.`);
        lines.push("");
      }

      for (const [pkgName, pkg] of Object.entries(REFERENCE_PACKAGES)) {
        lines.push(`## ${pkgName} (${pkg.repo})\n`);
        for (const [skillId, path] of Object.entries(pkg.skills)) {
          const cached = skillCache.get(`${pkgName}/${skillId}`);
          const status = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? " (cached)" : "";
          lines.push(`- **${skillId}**${status} — \`${path}\``);
        }
        lines.push("");
      }
      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
