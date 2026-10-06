/**
 * Concern groups in EVERY grouping kind — skills, processes, schemas,
 * library, uml and the test directories — declared once from within and
 * inherited as members (placement PR0c, bean `ejye`; the eight groups of bean
 * `9umr`; option A of bean `1g4s`).
 *
 * @module scripts/concern-groups
 * @covers cat-harness
 *
 * ## The rule, in three sentences
 *
 * A grouping kind's directory names its groups in its own declaration file —
 * `skills/skills.json` (`topics`), `processes/processes.json`,
 * `schemas/schemas.json`, `library/library.json`, `uml/uml.json`, a test
 * directory's `code.json` (`groups`) — by a code from
 * `code-lists/concern-group.json`. A group is declared ONCE, by the lowest
 * instance whose same-named directory declares it, and every higher
 * instance's same-named `<dir>/<group>/` is a MEMBER of it, so a higher
 * instance adds no group of its own. Nesting is declared FROM WITHIN (the
 * #980 rule `directory-conventions` carries): never by `<instance>.json`
 * reaching down a path it cannot verify.
 *
 * ## Why one walker for every kind
 *
 * `scripts/skill-topics.ts` already had this walk for skills, and the
 * placement proposal splits five more kinds the same way. Five private copies
 * of "which subdirectories are groups" would be five answers free to disagree
 * — the `dh4f` shape, where a consumer scanning the wrong set reports a clean
 * run over it. `packageDirsIn` now delegates here.
 *
 * ## "Same-named" is the member test
 *
 * A member is found at the SAME path relative to its own instance as the
 * declaring directory: core's `skills/library/` is a member of the harness's
 * `skills/library/` group. That is option A's rule one level down, and the
 * reason a group's directory is its code.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { findInstanceRoot, readDeclaration } from "../schemas/cat-harness.ts";
import { ConcernGroupsSchema } from "../schemas/concern-groups.ts";
import { defaultGraphTypologies, type GraphTypologyRegistry } from "../schemas/graph-typology-registry.ts";
import { checkoutDirectories, orderedDependencies } from "../schemas/harness-config.ts";
import { SkillTopicsSchema } from "../schemas/skill-topics.ts";

/** The code list every group id is drawn from, by its `id`. */
export const CONCERN_GROUP_LIST = "concern-group";

/** A group as a directory's declaration file names it. */
export interface DeclaredGroup {
  /** The concern-group code. */
  code: string;
  /** Its directory, one segment under the declaring directory. */
  path: string;
}

/** The kinds that group by concern, read from the registry rather than listed. */
export function groupingKinds(registry: GraphTypologyRegistry = defaultGraphTypologies): string[] {
  return registry
    .names()
    .filter((k) => registry.get(k)?.concernGroups === true && typeof registry.get(k)?.declarationFile === "string")
    .sort();
}

/**
 * The groups `<dir>`'s own declaration file names for `kind`; `[]` when there
 * is no file. Throws on a malformed file or on a group whose directory does
 * not exist — declare only what exists (bean `dh4f`).
 */
export function declaredGroupsIn(dir: string, kind: string, registry: GraphTypologyRegistry = defaultGraphTypologies): DeclaredGroup[] {
  const def = registry.get(kind);
  if (def?.concernGroups !== true || def.declarationFile === undefined) return [];
  const file = join(dir, def.declarationFile);
  if (!existsSync(file)) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${String(e)}`);
  }
  let groups: DeclaredGroup[];
  if (kind === "skills") {
    // `skills.json` predates the code list and names its groups `topics`,
    // each with a title and description; the skills walk owns that shape.
    const r = SkillTopicsSchema.safeParse(raw);
    if (!r.success) throw new Error(`${file}: ${r.error.issues[0]?.path.join(".") || "(root)"}: ${r.error.issues[0]?.message}`);
    groups = r.data.topics.map((t) => ({ code: t.id, path: t.path }));
  } else {
    const r = ConcernGroupsSchema.safeParse(raw);
    if (!r.success) throw new Error(`${file}: ${r.error.issues[0]?.path.join(".") || "(root)"}: ${r.error.issues[0]?.message}`);
    groups = r.data.groups.map((c) => ({ code: c, path: c }));
  }
  for (const g of groups) {
    const p = join(dir, g.path);
    if (!existsSync(p) || !statSync(p).isDirectory()) {
      throw new Error(`${file}: group "${g.code}" names ${g.path}/, which does not exist`);
    }
  }
  return groups;
}

const inheritedCache = new Map<string, DeclaredGroup[]>();

/**
 * The groups declared in the SAME-NAMED directory of every instance `dir`'s
 * instance depends on — what `dir` inherits, whether or not it holds them.
 * A lower instance's malformed file is that instance's finding, not this
 * walk's, so it contributes nothing here rather than throwing.
 */
export function inheritedGroupsFor(dir: string, kind: string, registry: GraphTypologyRegistry = defaultGraphTypologies): DeclaredGroup[] {
  const key = `${resolve(dir)}\0${kind}`;
  const hit = inheritedCache.get(key);
  if (hit !== undefined) return hit;
  const out: DeclaredGroup[] = [];
  const inst = findInstanceRoot(dir);
  if (inst !== undefined) {
    const rel = relative(inst, resolve(dir));
    let deps: string[] = [];
    try {
      deps = orderedDependencies(inst).map((d) => d.rootPath);
    } catch {
      deps = [];
    }
    for (const dep of deps) {
      const same = join(dep, rel);
      if (!existsSync(same)) continue;
      try {
        for (const g of declaredGroupsIn(same, kind, registry)) {
          if (!out.some((o) => o.code === g.code)) out.push(g);
        }
      } catch {
        // reported by `check:concern-groups` against the instance that owns it
      }
    }
  }
  inheritedCache.set(key, out);
  return out;
}

/** One candidate child of a grouping directory. */
export interface GroupedChild {
  /** Its basename. */
  name: string;
  /** Absolute path. */
  dir: string;
  /** Relative to the grouping directory: `crdm`, or `kg/graph-management`. */
  rel: string;
  /** The group it sits in, when it sits in one. */
  group?: string;
}

/**
 * Every candidate child of `dir`: its direct subdirectories that are not
 * groups, and the subdirectories of each group present here — declared by
 * `dir` itself or INHERITED from the same-named directory below. Sorted by
 * `rel`, so every caller sees one order.
 */
export function groupedChildrenIn(dir: string, kind: string, registry: GraphTypologyRegistry = defaultGraphTypologies): GroupedChild[] {
  if (!existsSync(dir)) return [];
  const groups = new Map<string, string>();
  for (const g of declaredGroupsIn(dir, kind, registry)) groups.set(g.path, g.code);
  for (const g of inheritedGroupsFor(dir, kind, registry)) {
    // A member exists only where it exists: an inherited group absent here
    // is not this directory's defect.
    if (!groups.has(g.path) && existsSync(join(dir, g.path))) groups.set(g.path, g.code);
  }
  const children = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  const out: GroupedChild[] = [];
  for (const name of children(dir)) {
    const code = groups.get(name);
    if (code === undefined) {
      out.push({ name, dir: join(dir, name), rel: name });
      continue;
    }
    for (const inner of children(join(dir, name))) {
      out.push({ name: inner, dir: join(dir, name, inner), rel: `${name}/${inner}`, group: code });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** A group across the checkout: who declared it, and every member. */
export interface ResolvedGroup {
  kind: string;
  code: string;
  /** The grouping directory's path, relative to each instance. */
  within: string;
  /** The instance that declared it — the lowest one, in overlay order. */
  declaredBy: string;
  /** Every instance holding `<within>/<code>/`, the declarer first. */
  members: Array<{ member: string; absPath: string }>;
  /** Other instances that ALSO declared it — a finding: a higher instance adds no group. */
  redeclaredBy: string[];
}

/**
 * Every concern group of `kind` in the checkout `start` is staged in.
 * Resolved over {@link checkoutDirectories}, deepest instance first, so the
 * first declarer is the lowest.
 */
export function resolveGroups(kind: string, start: string, registry: GraphTypologyRegistry = defaultGraphTypologies): ResolvedGroup[] {
  const dirs = checkoutDirectories(start).filter((d) => d.graphTypologies.includes(kind as never));
  const norm = (p: string): string => p.replace(/^\.\//, "").replace(/\/+$/, "");
  const nameOf = (d: { member?: string; declaredBy: string; absPath: string }): string => {
    if (d.member !== undefined && d.member !== "(default)") return d.member;
    const inst = findInstanceRoot(d.absPath);
    return (inst && readDeclaration(inst)?.name) ?? d.declaredBy;
  };
  const byKey = new Map<string, ResolvedGroup>();
  for (const d of dirs) {
    for (const g of declaredGroupsIn(d.absPath, kind, registry)) {
      const key = `${norm(d.path)}\0${g.code}`;
      const who = nameOf(d);
      const prev = byKey.get(key);
      if (prev === undefined) {
        byKey.set(key, { kind, code: g.code, within: norm(d.path), declaredBy: who, members: [], redeclaredBy: [] });
      } else if (prev.declaredBy !== who && !prev.redeclaredBy.includes(who)) {
        prev.redeclaredBy.push(who);
      }
    }
  }
  for (const grp of byKey.values()) {
    for (const d of dirs) {
      if (norm(d.path) !== grp.within) continue;
      const abs = join(d.absPath, grp.code);
      if (!existsSync(abs) || grp.members.some((m) => m.absPath === abs)) continue;
      grp.members.push({ member: nameOf(d), absPath: abs });
    }
    grp.members.sort((a, b) => (a.member === grp.declaredBy ? -1 : b.member === grp.declaredBy ? 1 : 0));
  }
  return [...byKey.values()].sort((a, b) => `${a.within}/${a.code}`.localeCompare(`${b.within}/${b.code}`));
}

/** Forget the memoised inheritance answers (a test that rewrites a fixture). */
export function clearGroupCache(): void {
  inheritedCache.clear();
}
