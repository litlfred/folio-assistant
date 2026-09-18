#!/usr/bin/env bun
/**
 * Every `satisfies` names a skill that exists, and every skill has a Tool.
 *
 * `ToolDefinitionSchema` can require `satisfies` to be non-empty; it cannot
 * know whether the names resolve, because a schema does not get to read the
 * tree. That is this.
 *
 * ## Both directions, and they mean different things
 *
 * **A `satisfies` naming no skill** is a dangling edge — the Tool claims to
 * implement something that does not exist, and an agent following the graph
 * from Tool to skill lands nowhere. Hard error.
 *
 * **A skill with no Tool** is the more interesting one and is NOT an error. The
 * skill/Tool separation says a skill states a capability generically; plenty of
 * skills are pure judgement (`interaction-modality`, `one-voice-style-guide`)
 * and have no mechanism to name. What matters is that the number is *reported*,
 * because a skill that describes an action and has no Tool is a skill whose
 * mechanism is still inlined in its prose — the migration debt
 * `skills-and-tools` names.
 *
 * Deliberately NOT here: whether `io.*.schema` IRIs dereference. They point at
 * the published type document, which does not exist until CI publishes it, so
 * checking it locally would fail on every developer machine and be switched
 * off. What IS checked is that every `$defs` name a Tool references is one the
 * shared vocabulary actually declares — the half that can be known offline.
 *
 * @module scripts/check-tools
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { tools } from "../tools/index.js";
import { TOOL_TYPES, isInjectionSafe } from "../schemas/tool-types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Skill names, discovered — never a hardcoded list. See kg-export's note. */
export function knownSkills(): Set<string> {
  const names = new Set<string>();
  const dirs: string[] = [];
  const skillsRoot = join(ROOT, "skills");
  if (existsSync(skillsRoot)) {
    for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (d.isDirectory()) dirs.push(join(skillsRoot, d.name));
    }
  }
  for (const extra of ["src/skills", ".claude/skills/local"]) {
    if (existsSync(join(ROOT, extra))) dirs.push(join(ROOT, extra));
  }
  for (const dir of dirs) {
    for (const f of readdirSync(dir)) if (f.endsWith(".md")) names.add(f.slice(0, -3));
  }
  const io = join(ROOT, "schemas", "skills");
  if (existsSync(io)) {
    for (const e of readdirSync(io, { withFileTypes: true })) if (e.isDirectory()) names.add(e.name);
  }
  return names;
}

export interface ToolCheck {
  danglingSatisfies: Array<{ tool: string; skill: string }>;
  unknownTypes: Array<{ tool: string; port: string; ref: string }>;
  /** Command-line inputs whose type can express a shell payload. */
  unsafeArgs: Array<{ tool: string; port: string; type: string }>;
  skillsWithTools: number;
  skillsWithoutTools: number;
}

export function checkTools(): ToolCheck {
  const skills = knownSkills();
  const typeNames = new Set(Object.keys(TOOL_TYPES));
  const dangling: Array<{ tool: string; skill: string }> = [];
  const unknownTypes: Array<{ tool: string; port: string; ref: string }> = [];
  const unsafeArgs: Array<{ tool: string; port: string; type: string }> = [];
  const covered = new Set<string>();

  for (const t of tools()) {
    for (const s of t.satisfies) {
      if (skills.has(s)) covered.add(s);
      else dangling.push({ tool: t.id, skill: s });
    }
    for (const p of [...t.io.inputs, ...t.io.outputs]) {
      const name = p.schema.split("#/$defs/")[1];
      if (name === undefined || !typeNames.has(name)) {
        unknownTypes.push({ tool: t.id, port: p.name, ref: p.schema });
      }
    }
    // The injection rule, enforced rather than documented: a value that reaches
    // argv must be of a type that cannot express a shell payload. Free prose
    // goes on stdin, where it is data instead of program text.
    for (const i of t.io.inputs) {
      if (i.arg === undefined || "stdin" in i.arg) continue;
      const name = i.schema.split("#/$defs/")[1] ?? "";
      if (!isInjectionSafe(name)) unsafeArgs.push({ tool: t.id, port: i.name, type: name });
    }
  }

  return {
    danglingSatisfies: dangling,
    unknownTypes,
    unsafeArgs,
    skillsWithTools: covered.size,
    skillsWithoutTools: skills.size - covered.size,
  };
}

if (import.meta.main) {
  const r = checkTools();
  const all = tools();
  console.log(`Tools: ${all.length}\n`);
  for (const t of all) console.log(`  ${t.id.padEnd(16)} → ${t.satisfies.length} skill(s)`);
  console.log(`\n  ${r.skillsWithTools} skill(s) have a Tool; ${r.skillsWithoutTools} do not.`);
  console.log("  A skill with no Tool is not an error — many are pure judgement.");
  console.log("  It is reported because a skill that describes an ACTION and has no");
  console.log("  Tool still has its mechanism inlined in its prose.");

  let bad = false;
  if (r.danglingSatisfies.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.danglingSatisfies.length} satisfies naming no skill:`);
    for (const d of r.danglingSatisfies) console.error(`    ${d.tool} → ${d.skill}`);
  }
  if (r.unsafeArgs.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.unsafeArgs.length} command-line input(s) of a type that can express a shell payload:`);
    for (const u of r.unsafeArgs) console.error(`    ${u.tool}.${u.port} : ${u.type} — put free text on stdin`);
  }
  if (r.unknownTypes.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.unknownTypes.length} port(s) referencing an unknown type:`);
    for (const u of r.unknownTypes) console.error(`    ${u.tool}.${u.port} → ${u.ref}`);
  }
  if (bad) process.exit(1);
  console.log("\n✓ every satisfies resolves; every io type is declared; every argv input is injection-safe");
}
