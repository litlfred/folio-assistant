/**
 * Where each skill's input and output contracts are — read from the skill.
 *
 * A skill names its own contracts in its front matter (#1168, B3b):
 *
 * ```yaml
 * input: schemas/skills/content-validate/input.schema.json
 * output: schemas/skills/content-validate/output.schema.json
 * ```
 *
 * The value is either a path relative to the declaring instance's root — a
 * node of this knowledge graph — or an external `https://` IRI. Until B3b the
 * contract was found by DIRECTORY NAME (`schemas/skills/<skill>/`), a
 * convention checked against nothing: a skill could not say its contract was
 * elsewhere, and a directory could claim a skill that did not exist. The JSON
 * Schema files themselves are the contract; how they are authored is not
 * (bean `319n`).
 *
 * @module scripts/skill-contracts
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, normalize, relative } from "node:path";
import { frontMatter } from "./front-matter.js";
import { isSkillMd, skillMdDirs } from "./known-skills.js";

export type ContractIo = "input" | "output";

/** One skill's declared contracts, and the file that declares them. */
export interface SkillContract {
  skill: string;
  /** The skill file, relative to the instance root. */
  from: string;
  input?: string;
  output?: string;
}

/** True for an external IRI; false for a path into this instance. */
export function isExternalContract(ref: string): boolean {
  return /^https:\/\//.test(ref);
}

/**
 * Why a contract ref is malformed, or undefined when its shape is right.
 * Shape only — whether the file exists is {@link contractFile}'s question.
 */
export function contractRefProblem(ref: string): string | undefined {
  if (isExternalContract(ref)) return undefined;
  if (/^[a-z]+:/i.test(ref)) return "an external contract is an https:// IRI";
  if (ref.startsWith("/")) return "a local contract is a path relative to the instance root, not absolute";
  if (normalize(ref).startsWith("..")) return "a local contract must stay inside the instance";
  if (!ref.endsWith(".json")) return "a contract is a JSON Schema file";
  return undefined;
}

/** The absolute path of a local contract ref, or undefined for an external one. */
export function contractFile(root: string, ref: string): string | undefined {
  return isExternalContract(ref) ? undefined : join(root, ref);
}

/**
 * Every skill under `root` that declares a contract, keyed by skill name. A
 * skill declaring none is absent — the common case, and not a defect.
 */
export function skillContracts(root: string): Map<string, SkillContract> {
  const out = new Map<string, SkillContract>();
  for (const dir of skillMdDirs(root)) {
    const abs = join(root, ...dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      const path = join(abs, f);
      if (!f.endsWith(".md") || !isSkillMd(path)) continue;
      const fm = frontMatter(readFileSync(path, "utf-8"));
      if (fm.input === undefined && fm.output === undefined) continue;
      const skill = f.slice(0, -3);
      if (out.has(skill)) continue; // first package wins, as kg-export's own scan does
      out.set(skill, { skill, from: relative(root, path), input: fm.input, output: fm.output });
    }
  }
  return out;
}
