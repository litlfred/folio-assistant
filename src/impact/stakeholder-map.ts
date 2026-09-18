/**
 * Who is affected by a proposed change — the mechanically determinable part.
 *
 * CRDM phase 1 asks the agent to identify stakeholders, and the CRDM page
 * proposed a `stakeholder_map` tool reading "affected roles from
 * `folio.config.json` and CODEOWNERS".
 *
 * NEITHER SOURCE EXISTS. This repository has no CODEOWNERS file, and
 * `schemas/folio-config.ts` declares no role, owner, maintainer or contact
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
import { join } from "node:path";
import { loadProcessModel, isActivity } from "../workflow/process-model.js";

/** Directories whose `.md` files are skills. */
const SKILL_DIRS = [
  "skills/content-lifecycle",
  "skills/folio-core",
  "skills/folio-document-adapter",
  "skills/folio-paper-adapter",
  "src/skills",
];

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

function skillIndex(root: string): Map<string, string> {
  const index = new Map<string, string>();
  for (const dir of SKILL_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (f.endsWith(".md")) index.set(f.slice(0, -3), `${dir}/${f}`);
    }
  }
  return index;
}

/** Map changed repo-relative paths to the roles, processes and lanes they reach. */
export async function stakeholderMap(root: string, changed: string[]): Promise<StakeholderMap> {
  const byPath = new Map<string, string>();
  for (const [name, path] of skillIndex(root)) byPath.set(path, name);

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
  const wfDir = join(root, "docs", "workflows");

  if (existsSync(wfDir) && changedSkills.size > 0) {
    for (const file of readdirSync(wfDir).filter((f) => f.endsWith(".bpmn")).sort()) {
      const model = await loadProcessModel(join(wfDir, file));
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
        lanes.push({ process: file, lane, activities: entry.activities, viaSkills: [...entry.viaSkills].sort() });
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
