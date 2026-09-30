#!/usr/bin/env bun
/**
 * A short slash command for every skill a person may invoke.
 *
 * Usage: `bun run skill:commands` (write) · `bun run skill:commands:check`
 *
 * Bean `j6t3`, option A, on the owner's choice of 2026-09-30 ("F + A"). The
 * MCP prompts (`src/tools/skill-prompts.ts`) reach every MCP host but are
 * namespaced — `/mcp__folio-assistant__coordinate`. This writes the short form,
 * `/coordinate`, as `.claude/commands/<name>.md`, for Claude Code. Both read the
 * same list, {@link userInvocableSkills}, so neither can offer a skill the
 * other does not.
 *
 * ## A command is a POINTER, never a copy
 *
 * A generated command says which skill to run and where its body is. It does
 * not inline the body: a copy is a second place the instructions live, free to
 * disagree with the first, which is the drift this generator exists to end.
 *
 * ## Both directions, and four findings that are not "clean"
 *
 * Measured 2026-09-22 and again 2026-09-30: the drift ran BOTH ways — skills
 * declaring `user_invocable` with no command, and `/prepare-merge`, a command
 * whose skill declared nothing. A generator that only writes from the
 * declarations would fix the first and never notice the second. So:
 *
 * - **missing** — a `user_invocable` skill with no command. Written.
 * - **stale** — a generated command whose text no longer matches. Rewritten.
 * - **orphaned** — a GENERATED command whose skill no longer declares itself
 *   invocable. Removed: it is this generator's own output, and a command that
 *   points at nothing is worse than none.
 * - **undeclared** — a HAND-WRITTEN command with no `user_invocable` skill of
 *   its name. Reported and never touched: a person wrote it, and whether the
 *   skill should declare itself or the command should go is theirs to decide.
 *
 * A hand-written command (no `generated:` key) for a declared skill is left
 * alone — `watch`, `goal-review` and `staging-review` carry argument handling
 * a pointer cannot.
 *
 * `--check` exits 1 on any finding, 0 when every declared skill has a command
 * and every command has a declared skill.
 *
 * @module cat-harness/scripts/gen-skill-commands
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { userInvocableSkills, type InvocableSkill } from "../src/tools/skill-prompts.ts";

export const GENERATED_BY = "cat-harness/scripts/gen-skill-commands.ts";
export const COMMANDS_DIR = join(".claude", "commands");

/** True when a command file was written by this generator. */
export function isGenerated(text: string): boolean {
  if (!text.startsWith("---")) return false;
  const end = text.indexOf("\n---", 3);
  return end !== -1 && new RegExp(`^generated:\\s*${GENERATED_BY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(text.slice(3, end));
}

/** One line, YAML-safe: the description a host shows in its command menu. */
function menuLine(summary: string | undefined, name: string): string {
  const s = (summary ?? `Run the ${name} skill.`).replace(/\s+/g, " ").trim();
  const first = s.length > 200 ? `${s.slice(0, 197).trimEnd()}...` : s;
  return JSON.stringify(first);
}

/** The text of the command for one skill. */
export function commandText(skill: InvocableSkill, repo: string): string {
  const rel = relative(repo, skill.path);
  return [
    "---",
    `description: ${menuLine(skill.summary, skill.name)}`,
    `argument-hint: "[what to run it on]"`,
    `generated: ${GENERATED_BY}`,
    "---",
    "",
    `# /${skill.name}`,
    "",
    `Run the \`${skill.name}\` skill. Read [\`${rel}\`](../../${rel}) and follow it.`,
    "",
    `This command is a pointer, generated from that skill's \`user_invocable: true\`; the`,
    `instructions live in the skill and nowhere else. The same skill is also served as the`,
    `MCP prompt \`${skill.name}\` by the folio-assistant server.`,
    "",
    "Arguments, if any: $ARGUMENTS",
    "",
  ].join("\n");
}

export type Finding =
  | { kind: "missing" | "stale"; name: string; file: string }
  | { kind: "orphaned"; name: string; file: string }
  | { kind: "undeclared"; name: string; file: string };

export interface CommandReport {
  declared: number;
  findings: Finding[];
  duplicates: { name: string; paths: string[] }[];
}

export function reconcile(repo: string, packages?: Record<string, string>): CommandReport {
  const { skills, duplicates } = userInvocableSkills(packages);
  const dir = join(repo, COMMANDS_DIR);
  const present = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  const declared = new Map(skills.map((s) => [s.name, s]));
  const findings: Finding[] = [];
  for (const s of skills) {
    const file = join(COMMANDS_DIR, `${s.name}.md`);
    const abs = join(repo, file);
    if (!existsSync(abs)) findings.push({ kind: "missing", name: s.name, file });
    else {
      const text = readFileSync(abs, "utf8");
      if (isGenerated(text) && text !== commandText(s, repo)) findings.push({ kind: "stale", name: s.name, file });
    }
  }
  for (const f of present) {
    const name = f.slice(0, -3);
    if (declared.has(name)) continue;
    const file = join(COMMANDS_DIR, f);
    const text = readFileSync(join(repo, file), "utf8");
    findings.push({ kind: isGenerated(text) ? "orphaned" : "undeclared", name, file });
  }
  return { declared: skills.length, findings, duplicates };
}

/** Write what is missing or stale and remove this generator's orphans. Returns the files changed. */
export function write(repo: string, packages?: Record<string, string>): string[] {
  const { skills } = userInvocableSkills(packages);
  const byName = new Map(skills.map((s) => [s.name, s]));
  const changed: string[] = [];
  mkdirSync(join(repo, COMMANDS_DIR), { recursive: true });
  for (const f of reconcile(repo, packages).findings) {
    const abs = join(repo, f.file);
    if (f.kind === "missing" || f.kind === "stale") {
      writeFileSync(abs, commandText(byName.get(f.name)!, repo));
      changed.push(f.file);
    } else if (f.kind === "orphaned") {
      rmSync(abs);
      changed.push(f.file);
    }
  }
  return changed;
}

if (import.meta.main) {
  const repo = resolve(import.meta.dir, "..", "..");
  const check = process.argv.includes("--check");
  if (!check) {
    const changed = write(repo);
    console.log(changed.length ? changed.map((f) => `  wrote ${f}`).join("\n") : "  nothing to write");
  }
  const r = reconcile(repo);
  for (const d of r.duplicates) console.log(`✗ ${d.name} is declared by ${d.paths.length} files: ${d.paths.map((p) => relative(repo, p)).join(", ")}`);
  for (const f of r.findings) {
    const why = {
      missing: "declares user_invocable and has no command — run `bun run skill:commands`",
      stale: "generated command is stale — run `bun run skill:commands`",
      orphaned: "generated command whose skill no longer declares user_invocable — run `bun run skill:commands`",
      undeclared: "hand-written command with no user_invocable skill of that name — give the skill `name:` and `user_invocable: true`, or remove the command (a person's call)",
    }[f.kind];
    console.log(`✗ ${f.file}: ${why}`);
  }
  const bad = r.findings.length + r.duplicates.length;
  if (bad === 0) console.log(`✓ ${r.declared} user_invocable skill(s), each with a command; every command has a declared skill`);
  process.exit(check && bad > 0 ? 1 : 0);
}
