/**
 * The TOPIC level of a skills directory, and the one walk that honours it.
 *
 * @module scripts/skill-topics
 * @covers cat-harness
 *
 * Owner, 2026-09-29: *"declared sub-graphs of cat-harness based on semantic
 * concern … dont need a separate facet. built into location."* Ruled
 * 2026-09-30 (bean `9umr`, option A): a topic directory HOLDS packages —
 * `skills/<topic>/<package>/`, e.g. `skills/kg/graph-management/` — and
 * `skills/skills.json` is the labelling node that says which subdirectories
 * are topics. It is the node #980 asked for: nesting is described FROM
 * WITHIN, by a file in the directory whose children it names, never by the
 * root declaration reaching down a path it cannot verify.
 *
 * ## Why one walk, and why it returns directories rather than packages
 *
 * Six places walked a skills directory one level deep and read each child as
 * a package. Each one taught to descend on its own is six chances to disagree
 * about which directories are topics, which is the `dh4f` shape: a consumer
 * that scans the wrong set reports a clean run over it.
 *
 * They do NOT agree on what makes a package — one asks for a skill `.md`,
 * another for `package-manifest.json` — and that difference is theirs. So this
 * returns the CANDIDATE directories and each caller keeps its own test.
 *
 * ## Declaration over location
 *
 * Only a subdirectory `skills.json` names is descended into. A directory that
 * merely looks like a topic (holds subdirectories, no skills) is not one, and
 * is not guessed at. A present but malformed `skills.json` throws, and a topic
 * it names that does not exist throws too: declare only what exists (bean
 * `dh4f`), and a declared-but-absent directory is the defect, not a no-op.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The labelling node's file name, inside the skills directory it labels. */
export const TOPICS_FILE = "skills.json";

/** One topic: a subdirectory of the skills directory that holds packages. */
export interface SkillTopic {
  /** Stable id. By convention the same as `path`. */
  id: string;
  /** The subdirectory, relative to the skills directory, one segment. */
  path: string;
  title: string;
  description: string;
}

/** A candidate package directory, and where it sits. */
export interface PackageDir {
  /** The directory's basename — the package name `skill_fetch` takes. */
  name: string;
  /** Absolute path. */
  dir: string;
  /** Relative to the skills directory: `crdm`, or `kg/graph-management`. */
  rel: string;
  /** The topic it sits in, when it sits in one. */
  topic?: string;
}

/**
 * The topics `<skillsDir>/skills.json` declares; `[]` when there is no file.
 *
 * Throws on a malformed file, a topic whose path is not one plain segment, or
 * a topic whose directory does not exist.
 */
export function topicsOf(skillsDir: string): SkillTopic[] {
  const file = join(skillsDir, TOPICS_FILE);
  if (!existsSync(file)) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${String(e)}`);
  }
  const topics = (parsed as { topics?: unknown }).topics;
  if (!Array.isArray(topics)) throw new Error(`${file} declares no "topics" array`);
  return topics.map((raw, i) => {
    const t = raw as Partial<SkillTopic>;
    for (const field of ["id", "path", "title", "description"] as const) {
      if (typeof t[field] !== "string" || t[field] === "") {
        throw new Error(`${file}: topic ${i + 1} has no "${field}"`);
      }
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(t.path!)) {
      throw new Error(`${file}: topic "${t.id}" path "${t.path}" is not one plain segment`);
    }
    const dir = join(skillsDir, t.path!);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      throw new Error(`${file}: topic "${t.id}" names ${t.path}/, which does not exist`);
    }
    return t as SkillTopic;
  });
}

/**
 * Every candidate package directory under a skills directory: its direct
 * subdirectories that are not topics, and the subdirectories of each declared
 * topic. Sorted by `rel`, so every caller sees one order.
 */
export function packageDirsIn(skillsDir: string): PackageDir[] {
  if (!existsSync(skillsDir)) return [];
  const topics = new Map(topicsOf(skillsDir).map((t) => [t.path, t]));
  const out: PackageDir[] = [];
  const children = (dir: string) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  for (const name of children(skillsDir)) {
    const topic = topics.get(name);
    if (topic === undefined) {
      out.push({ name, dir: join(skillsDir, name), rel: name });
      continue;
    }
    for (const inner of children(join(skillsDir, name))) {
      out.push({ name: inner, dir: join(skillsDir, name, inner), rel: `${name}/${inner}`, topic: topic.id });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}
