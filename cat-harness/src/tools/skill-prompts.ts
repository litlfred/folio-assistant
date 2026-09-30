/**
 * Every skill that says a PERSON may invoke it, served as an MCP prompt.
 *
 * @module cat-harness/src/tools/skill-prompts
 *
 * Bean `j6t3`, option F, on the owner's choice of 2026-09-30 ("F + A").
 * Measured that day: 40 skills declare `user_invocable: true` and 3 could be
 * typed as a slash command. The declaration said a person may reach for the
 * skill; no host let them.
 *
 * ## Prompts, not tools — and that is the owner's rule, not a preference
 *
 * MCP has two primitives that look alike and are not. A **tool** is offered to
 * the model; a **prompt** is listed for the person, who picks one. Claude Code
 * renders a server's prompts as `/mcp__<server>__<name>` slash commands. So the
 * person-facing half of a skill is a prompt, and this module registers no tool.
 *
 * It also keeps the owner's 2026-09-21 ruling, *"keep tools and skills
 * separate!"*, by construction: nothing here mints a Tool node or writes into
 * `tools/`. A prompt is an INVOCATION of a skill — the skill's own body, sent
 * as the person's message — and the skill stays where it is declared.
 *
 * ## One derivation, two surfaces
 *
 * {@link userInvocableSkills} is also what `scripts/gen-skill-commands.ts`
 * reads to write `.claude/commands/` (option A). Two surfaces from one list is
 * the point: the 3-of-40 gap was two hand-kept surfaces drifting from the
 * declarations, and a third hand-kept one would drift the same way.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { frontMatter, nodeSummary } from "../../scripts/front-matter.js";
import { LOCAL_PACKAGES } from "./skill-fetch.js";

/** A skill that declares `user_invocable: true`. */
export interface InvocableSkill {
  /** The declared `name:` — the command a person types. */
  name: string;
  /** The package `skill_fetch` serves it from. */
  packageName: string;
  /** Absolute path to the skill body. */
  path: string;
  /** The declared description, or the first heading; undefined when neither. */
  summary?: string;
}

export interface InvocableSkillList {
  skills: InvocableSkill[];
  /**
   * A name declared by more than one file. The first (by package, then file)
   * is served; the rest are reported, because a command that silently means
   * one of two skills is worse than a command that is missing.
   */
  duplicates: { name: string; paths: string[] }[];
}

/** True when the file's YAML front matter carries `user_invocable: true`. */
export function declaresUserInvocable(text: string): boolean {
  if (!text.startsWith("---")) return false;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return false;
  return /^user_invocable:\s*true\s*$/m.test(text.slice(3, end));
}

/**
 * Every `user_invocable` skill in the given packages, sorted by name.
 *
 * A file that declares `user_invocable: true` but no `name:` is skipped: the
 * name IS the command, and inventing one from the filename would be a command
 * nobody declared.
 */
export function userInvocableSkills(packages: Record<string, string> = LOCAL_PACKAGES): InvocableSkillList {
  const byName = new Map<string, InvocableSkill[]>();
  for (const packageName of Object.keys(packages).sort()) {
    const dir = packages[packageName];
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
      const path = join(dir, f);
      const text = readFileSync(path, "utf8");
      if (!declaresUserInvocable(text)) continue;
      const name = frontMatter(text).name;
      if (!name) continue;
      const entry = { name, packageName, path, summary: nodeSummary(text) };
      byName.set(name, [...(byName.get(name) ?? []), entry]);
    }
  }
  const skills: InvocableSkill[] = [];
  const duplicates: InvocableSkillList["duplicates"] = [];
  for (const [name, entries] of [...byName].sort(([a], [b]) => a.localeCompare(b))) {
    skills.push(entries[0]);
    if (entries.length > 1) duplicates.push({ name, paths: entries.map((e) => e.path) });
  }
  return { skills, duplicates };
}

/** The message a prompt sends: the skill's own body, plus whatever the person typed after it. */
export function promptText(skill: InvocableSkill, args?: string): string {
  const body = readFileSync(skill.path, "utf8");
  const tail = args && args.trim() ? `\n\n## Arguments\n\n${args.trim()}\n` : "";
  return `Run the \`${skill.name}\` skill (package \`${skill.packageName}\`). Its instructions follow.\n\n${body}${tail}`;
}

/** Register one MCP prompt per `user_invocable` skill. Returns the names registered. */
export function registerSkillPrompts(server: McpServer, packages: Record<string, string> = LOCAL_PACKAGES): string[] {
  const { skills } = userInvocableSkills(packages);
  for (const skill of skills) {
    server.registerPrompt(
      skill.name,
      {
        title: skill.name,
        description: skill.summary,
        argsSchema: { args: z.string().optional().describe("What to run it on — passed through to the skill as written") },
      },
      ({ args }) => ({
        messages: [{ role: "user" as const, content: { type: "text" as const, text: promptText(skill, args) } }],
      }),
    );
  }
  return skills.map((s) => s.name);
}
