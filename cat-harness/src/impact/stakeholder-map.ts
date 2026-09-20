/**
 * Who is affected by a proposed change — the mechanically determinable part.
 *
 * CRDM phase 1 asks the agent to identify stakeholders, and the CRDM page
 * proposed a `stakeholder_map` tool reading "affected roles from
 * `harness.config.json` and CODEOWNERS".
 *
 * NEITHER SOURCE EXISTS. This repository has no CODEOWNERS file, and
 * `schemas/harness-config.ts` declares no role, owner, maintainer or contact
 * field. A tool built on those two would have reported "no stakeholders" for
 * every change, forever, and looked like it worked.
 *
 * What does exist, and what this reads instead:
 *
 *   1. SKILLS declare `roles:` in their front matter — reader, collaborator,
 *      owner, auditor. A change to a skill affects whoever holds its roles.
 *   2. BPMN LANES name the actor accountable for each activity, and an
 *      activity names the skill that implements it (`<folio:skill ref>`). So
 *      a changed skill reaches a set of lanes across the process corpus —
 *      "editors and authoring agents", "publication manager", "clinical SMEs".
 *
 * ON DELIBERATELY NOT GUESSING PEOPLE. `crdm-requirements.bpmn` documents its
 * own stakeholder step as "The agent asks the BA who is affected by this
 * change. The BA knows the domain — the agent does not guess." That is a
 * design decision, not an oversight, and this module respects it: it
 * enumerates roles, lanes and processes, and it NEVER outputs a list of
 * humans as "the stakeholders". The named-people half stays the BA's answer;
 * this exists so the BA is asked a sharper question than "who cares?".
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isSkillMd, skillMdDirs, workflowFiles } from "../../scripts/known-skills.js";
import { join, relative } from "node:path";
import { loadProcessModel, isActivity } from "../workflow/process-model.js";

export interface SkillImpact { name: string; path: string; roles: string[] }
export interface LaneImpact {
  process: string;
  lane: string;
  activities: string[];
  viaSkills: string[];
}
export interface StakeholderMap {
  changed: string[];
  skills: SkillImpact[];
  lanes: LaneImpact[];
  roles: string[];
  untraced: string[];
  /** The boundary of the mechanical part — always populated, never an error. */
  notDetermined: string[];
}

/** `roles: [a, b]` from a skill's YAML front matter. */
function rolesOf(file: string): string[] {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf-8");
  if (!text.startsWith("---")) return [];
  const end = text.indexOf("\n---", 3);
  const fm = end === -1 ? text : text.slice(0, end);
  const m = fm.match(/^roles:\s*\[([^\]]*)\]/m);
  return m ? m[1].split(",").map((r) => r.trim()).filter(Boolean) : [];
}

/**
 * Every skill `.md`, by name, from the directories the instance DECLARES.
 *
 * ## The list this replaces was already wrong
 *
 * It was five literals — four under `skills/`, plus `src/skills` — and
 * `skillMdDirs()` finds **six** `skills/` packages, so `authoring-math` (3
 * skills) and `authoring-who-smart-guidelines` (9) were invisible to the
 * stakeholder map. Changing one of those twelve files reported no impact:
 * no roles, no lanes, no processes. Exactly the failure `known-skills.ts`'s
 * own header describes for the copy it was extracted to remove — *"a list
 * somebody has to remember to extend is not a single answer; it is a copy
 * that happens to match today"* — and here the copy had already stopped
 * matching.
 *
 * Found by `check:declared-paths` on its first run, which is the argument
 * for that gate: nobody was looking at this file.
 *
 * ## Keyed by PATH, because the name is not unique
 *
 * It was `name → path`, which was safe only while the list omitted
 * `.claude/skills/local/`. Reading the declaration admits it, and
 * `todo-manager.md` exists **three** times — `skills/folio-core/`,
 * `.claude/skills/local/` and the generated mirror, a divergence `AGENTS.md`
 * documents at length. Under `name → path` the last one scanned wins and a
 * change to either of the others reports NO impact: no roles, no lanes,
 * nobody accountable. Indistinguishable from a change that affects nobody,
 * which is the one wrong answer this analysis must not give.
 *
 * `path → name` collides on nothing. Several paths mapping to one skill name
 * is the corpus stating a fact about itself, not a conflict to resolve.
 */
function skillIndex(root: string): Map<string, string> {
  const index = new Map<string, string>();
  for (const parts of skillMdDirs(root)) {
    const dir = parts.join("/");
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      // Per FILE, not per directory: a declared directory holds skills, never
      // only skills — the 25 agent-memory nodes then in `skills/memory/` were `.md` in
      // one, and a role's `roles:` front matter is not theirs to carry.
      if (f.endsWith(".md") && isSkillMd(join(abs, f))) index.set(`${dir}/${f}`, f.slice(0, -3));
    }
  }
  return index;
}

/** Map changed repo-relative paths to the roles, processes and lanes they reach. */
export async function stakeholderMap(root: string, changed: string[]): Promise<StakeholderMap> {
  const byPath = skillIndex(root);

  const skills: SkillImpact[] = [];
  const untraced: string[] = [];
  for (const raw of changed) {
    const path = raw.replace(/^\.\//, "");
    const name = byPath.get(path);
    if (name) skills.push({ name, path, roles: rolesOf(join(root, path)) });
    else untraced.push(path);
  }

  const changedSkills = new Set(skills.map((s) => s.name));
  const lanes: LaneImpact[] = [];
  // Every declared knowledge-graph directory, not the literal
  // `skills/workflows/`. An impact report that misses a diagram reports NO
  // lane affected, which is indistinguishable from a change that affects
  // nobody — the one wrong answer this analysis must not give.
  const diagrams = workflowFiles(root).filter((f) => f.endsWith(".bpmn"));

  if (diagrams.length > 0 && changedSkills.size > 0) {
    for (const file of diagrams) {
      const model = await loadProcessModel(file);
      const hits = new Map<string, { activities: string[]; viaSkills: Set<string> }>();
      for (const node of [...model.nodes.values()].filter(isActivity)) {
        const matched = (node.skills ?? []).filter((s) => changedSkills.has(s));
        if (matched.length === 0) continue;
        const lane = node.lane ?? "(no lane — nobody is accountable for this step)";
        const entry = hits.get(lane) ?? { activities: [], viaSkills: new Set<string>() };
        entry.activities.push(node.id);
        for (const s of matched) entry.viaSkills.add(s);
        hits.set(lane, entry);
      }
      for (const [lane, entry] of hits) {
        // REPO-RELATIVE, not the absolute path `workflowFiles` returns and
        // not the bare basename this used to be. Absolute leaks the
        // machine into a report; bare hides WHICH declared directory the
        // diagram came from, which is the thing a topical layout makes
        // worth knowing.
        lanes.push({
          process: relative(root, file),
          lane,
          activities: entry.activities,
          viaSkills: [...entry.viaSkills].sort(),
        });
      }
    }
  }

  const roles = [...new Set(skills.flatMap((s) => s.roles))].sort();

  const notDetermined = [
    "The PEOPLE. `crdm-requirements.bpmn` documents its stakeholder step as " +
      '"the agent does not guess" — naming humans is the BA\'s answer. This ' +
      "sharpens the question rather than answering it.",
  ];
  if (untraced.length) {
    notDetermined.push(
      `${untraced.length} changed path(s) match no skill, so no lane or role is ` +
        `derivable from them. That is unknown impact, not absent impact.`,
    );
  }
  const noRoles = skills.filter((s) => s.roles.length === 0).map((s) => s.name);
  if (noRoles.length) {
    notDetermined.push(
      `Skill(s) declaring no \`roles:\`: ${noRoles.join(", ")}. Their audience ` +
        `is undeclared rather than empty.`,
    );
  }

  return { changed, skills, lanes, roles, untraced, notDetermined };
}

/** Human-readable report, shared by the CLI and the MCP tool. */
export function formatStakeholderMap(map: StakeholderMap): string {
  const out: string[] = [`Stakeholder map — ${map.changed.length} changed path(s)\n`];

  if (map.skills.length) {
    out.push("Skills changed");
    for (const s of map.skills) {
      out.push(`  ${s.name.padEnd(30)} ${s.roles.length ? s.roles.join(", ") : "(no roles declared)"}`);
    }
  } else {
    out.push("No changed path is a skill, so nothing maps to a role this way.");
  }

  if (map.roles.length) out.push(`\nRoles reached: ${map.roles.join(", ")}`);

  if (map.lanes.length) {
    out.push("\nProcess lanes reached — who is accountable for a step a changed skill implements");
    for (const l of map.lanes) {
      out.push(`  ${l.process}`);
      out.push(`    ${l.lane}`);
      out.push(`      via ${l.viaSkills.join(", ")} at ${l.activities.join(", ")}`);
    }
  } else if (map.skills.length) {
    out.push("\nNo process lane references these skills, so no diagram says who owns work using them.");
  }

  out.push("\nNOT DETERMINED");
  for (const n of map.notDetermined) out.push(`  · ${n}`);
  return out.join("\n");
}
