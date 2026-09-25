/**
 * Which skill governs a declared directory — read from the SKILLS.
 *
 * Until #1168 B7b each directory named its governing skill
 * (`coverage.skill`): the directory pointing at what depends on it. The owner
 * chose (2026-09-24) that the skill declares instead, in its front matter:
 *
 * ```yaml
 * graph-kinds:          # the kinds of graph it governs, wherever they are
 *   - voices
 * governs:              # one directory, <instance>/<id>, where the kind is too general
 *   - smart-trust/smart-trust-docs
 * ```
 *
 * `graph-kinds:` already existed (B3) and is the normal form: a skill that
 * governs `beans` governs every `beans` directory. `governs:` is for the case
 * the kind cannot say — a domain skill over one `docs` or `tools` directory —
 * where listing the generic kind would claim every directory of it (measured
 * 2026-09-24: 5 directories, each of kind `docs`, `tools` or `skills` alone).
 * Instance-qualified because a directory id is unique only within its
 * instance: `smart-base` and `cat-harness` each declare one called `tools`.
 *
 * A kind claim reaches only the skill's own instance and the instances that
 * DEPEND on it: `fhir-harness`'s `ig-build-pipeline` governs fhir-harness's
 * tools and never `cat-harness`'s, which does not depend on it.
 *
 * @module scripts/skill-governance
 */
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/** What one skill declares it governs. */
export interface SkillGovernance {
  skill: string;
  /** Repository-relative path of the skill file. */
  file: string;
  /** The instance directory the skill lives in (its first path segment). */
  instance: string;
  kinds: string[];
  directories: string[];
}

/** A YAML list under `key:` in a markdown file's front matter, or []. */
export function frontMatterList(text: string, key: string): string[] {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1];
  if (block === undefined || !new RegExp(`^${key}:`, "m").test(block)) return [];
  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(block);
  } catch {
    return [];
  }
  const v = (parsed as Record<string, unknown>)[key];
  return Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : [];
}

/**
 * Every skill that declares a kind or a directory, from the repository's
 * tracked markdown under any `skills/` directory.
 */
export function skillGovernance(repoRoot: string, files: readonly string[]): SkillGovernance[] {
  const out: SkillGovernance[] = [];
  for (const f of files) {
    if (!f.endsWith(".md") || !/(^|\/)skills\//.test(f) || f.includes("/docs/")) continue;
    let text: string;
    try {
      text = readFileSync(join(repoRoot, f), "utf-8");
    } catch {
      continue;
    }
    const kinds = frontMatterList(text, "graph-kinds");
    const directories = frontMatterList(text, "governs");
    if (kinds.length === 0 && directories.length === 0) continue;
    out.push({ skill: basename(f, ".md"), file: f, instance: f.split("/")[0]!, kinds, directories });
  }
  return out;
}

/**
 * The skills governing one directory.
 *
 * @param dir the directory's instance, id and graph kinds
 * @param reach absolute roots of the directory's instance and every instance
 *   it depends on — a kind claim counts only from a skill in one of them
 */
export function governingSkills(
  dir: { instance: string; id: string; graphKinds: readonly string[] },
  skills: readonly SkillGovernance[],
  repoRoot: string,
  reach: readonly string[],
): string[] {
  const inReach = new Set(reach.map((r) => resolve(r)));
  const names = skills
    .filter(
      (s) =>
        s.directories.includes(`${dir.instance}/${dir.id}`) ||
        (s.kinds.some((k) => dir.graphKinds.includes(k)) && inReach.has(resolve(repoRoot, s.instance))),
    )
    .map((s) => s.skill);
  return [...new Set(names)].sort();
}
