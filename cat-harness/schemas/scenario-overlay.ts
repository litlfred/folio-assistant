/**
 * Roles, actors and capabilities EXTENDED BY ID from a higher instance's own
 * `scenarios/` (placement PR0b, bean `ejye`; owner rulings 2026-09-30).
 *
 * @module schemas/scenario-overlay
 * @graphNode schema
 *
 * ## The problem it removes
 *
 * The harness's `scenarios/roles.json` held 54 role→skill edges naming skills
 * that belong above it (core 28, sci 20, fhir-harness 4, smart-base 2), and 5
 * actor→role bindings naming roles that move up (placement proposal §5). Moving
 * a skill up while its role edge stays down leaves an UPWARD reference in the
 * harness; moving the whole role up moves 34 harness roles' neighbours with it.
 * Neither is acceptable, so the edge has to be able to live in the higher
 * instance, pointing down.
 *
 * ## The rule — the dependent holds the pointer
 *
 * The same shape #1168 settled for voices (a voice points at the role it
 * addresses, so the role names no voice) and stories (a story points at the
 * role it is told as). A higher instance's `scenarios/` may:
 *
 * | what | how | what it may change |
 * |---|---|---|
 * | extend a ROLE | `roles.json` → `extensions: [{ "role": "<id>", "skills": […] }]` | adds skills; nothing else |
 * | add a ROLE | `roles.json` → `roles: […]`, a NEW id | its own role; may `inherits` a lower one |
 * | extend an ACTOR | `actors/<file>.json` with `"extends": "<actor id>"` | adds `roles` and `capabilities`; nothing else |
 * | add an ACTOR | `actors/<file>.json` without `extends`, a NEW id | its own actor |
 * | extend a CAPABILITY | `capabilities/<file>.json` with `"extends": "<capability id>"` | adds `requires`; nothing else |
 * | add a CAPABILITY | `capabilities/<file>.json`, a NEW id | its own probe |
 *
 * Id-matching is the same rule as a directory override and as `inherits`.
 * **Redeclaring a lower id is refused**, not merged: an override that could
 * change a lower role's title or description would make the lower instance's
 * own audit and the checkout's disagree about what the role IS. And an
 * extension may only name something declared BELOW it — a pointer at an
 * equal or higher layer is the upward edge this module exists to remove.
 *
 * It does NOT restore `roles:` in skill front matter (beans `tuvg`, `v625`):
 * the edge stays on the role graph, which is now spread across instances.
 *
 * ## Where the layers come from
 *
 * The base is the instance asked about; the layers are the CHECKOUT's
 * instances that depend on it ({@link checkoutDependentsOf}), deepest first.
 * Resolved alone, an instance sees only its own graph — the cmsl falsifier:
 * a split checkout sees less.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { ownDirectoryById } from "./cat-harness";
import { checkoutDependentsOf } from "./harness-config";
import {
  ACTORS_DIRNAME,
  CAPABILITIES_DIRNAME,
  readActors,
  readRoleGraph,
  type LoadedActor,
  type RoleDef,
  type RoleGraph,
} from "./role-graph";

/** A higher instance's `scenarios/` directory, as an overlay layer. */
export interface ScenarioLayer {
  /** The instance's declared name. */
  instance: string;
  /** Absolute path of its `scenarios` directory. */
  dir: string;
}

/**
 * The `scenarios` directories of every checkout instance that depends on
 * `instanceRoot`, deepest first. Each is asked of THAT instance's own
 * declaration — never inherited — so the harness's own `scenarios/` is never
 * read twice as a layer of itself.
 */
export function scenarioLayersAbove(instanceRoot: string): ScenarioLayer[] {
  const out: ScenarioLayer[] = [];
  for (const dep of checkoutDependentsOf(instanceRoot)) {
    // declared-path-literal: the convention fallback, at the call site, as
    // `kg-audit` reads a dependency's scenarios — the id is asked first.
    const dir = ownDirectoryById(dep.root, "scenarios", "scenarios");
    if (existsSync(dir)) out.push({ instance: dep.name, dir: resolve(dir) });
  }
  return out;
}

/** Who added what to a role, for a report that must name the instance. */
export interface RoleExtensionRecord {
  instance: string;
  role: string;
  skills: string[];
}

/**
 * Overlay higher instances' role graphs onto `base`.
 *
 * Throws on a redeclared id, an extension naming no lower role, or a new
 * role inheriting an undeclared one — the same loud stance `readRoleGraph`
 * takes, because a quietly short skill set is the failure this repository
 * keeps paying for.
 */
export function overlayRoleGraphs(
  base: RoleGraph,
  layers: ReadonlyArray<{ instance: string; graph: RoleGraph }>,
  baseInstance = base.name,
): { graph: RoleGraph; extensions: RoleExtensionRecord[] } {
  const roles = new Map<string, RoleDef>(base.roles.map((r) => [r.id, { ...r, skills: [...(r.skills ?? [])] }]));
  const owner = new Map<string, string>(base.roles.map((r) => [r.id, baseInstance]));
  const records: RoleExtensionRecord[] = [];
  for (const { instance, graph } of layers) {
    // Extensions first, against what is BELOW this layer: an extension of a
    // role this same layer adds is a role edited in two places of one file.
    for (const ext of graph.extensions ?? []) {
      const target = roles.get(ext.role);
      if (target === undefined) {
        throw new Error(
          `${instance}: extends role "${ext.role}", which no instance below it declares. ` +
            `An extension points DOWN at a lower instance's role; a role this instance owns is declared under \`roles\`.`,
        );
      }
      const have = new Set(target.skills ?? []);
      const added = ext.skills.filter((s) => !have.has(s));
      target.skills = [...(target.skills ?? []), ...added];
      records.push({ instance, role: ext.role, skills: added });
    }
    for (const r of graph.roles) {
      const prev = owner.get(r.id);
      if (prev !== undefined) {
        throw new Error(
          `${instance}: role "${r.id}" is already declared by ${prev}. A higher instance adds skills to a lower ` +
            `role with \`extensions: [{ "role": "${r.id}", "skills": [...] }]\`; it never redeclares it.`,
        );
      }
      for (const parent of r.inherits ?? []) {
        if (!roles.has(parent) && !graph.roles.some((x) => x.id === parent)) {
          throw new Error(`${instance}: role "${r.id}" inherits "${parent}", which is declared nowhere at or below it.`);
        }
      }
      roles.set(r.id, { ...r, skills: [...(r.skills ?? [])] });
      owner.set(r.id, instance);
    }
  }
  return { graph: { ...base, roles: [...roles.values()] }, extensions: records };
}

/**
 * The role graph of `instanceRoot` as its CHECKOUT sees it: its own graph,
 * then every dependent's `scenarios/roles.json` overlaid by id.
 *
 * `undefined` when the instance has no role graph of its own. Identical to the
 * instance's own graph when no dependent extends it — which is every role on
 * the day PR0 lands, and the falsifier it is held to.
 */
export function checkoutRoleGraph(
  instanceRoot: string,
  own: RoleGraph | undefined,
): { graph: RoleGraph; extensions: RoleExtensionRecord[] } | undefined {
  if (own === undefined) return undefined;
  const layers: Array<{ instance: string; graph: RoleGraph }> = [];
  const known = new Set(own.roles.map((r) => r.id));
  for (const layer of scenarioLayersAbove(instanceRoot)) {
    const g = readRoleGraph(layer.dir, known);
    if (g === undefined) continue;
    layers.push({ instance: layer.instance, graph: g });
    for (const r of g.roles) known.add(r.id);
  }
  return overlayRoleGraphs(own, layers);
}

/** The fields an actor or capability EXTENSION may carry besides its pointer. */
const ACTOR_EXTENSION_FIELDS = new Set(["extends", "roles", "capabilities"]);
const CAPABILITY_EXTENSION_FIELDS = new Set(["extends", "requires"]);

function readJson(p: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function jsonFiles(dir: string): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => join(dir, f))
    : [];
}

/** Refuse any field an extension may not carry; `_`-keys are documentation. */
function onlyExtensionFields(raw: Record<string, unknown>, allowed: ReadonlySet<string>, p: string): void {
  const bad = Object.keys(raw).filter((k) => !k.startsWith("_") && k !== "$schema" && !allowed.has(k));
  if (bad.length > 0) {
    throw new Error(
      `${p}: an extension adds ${[...allowed].filter((k) => k !== "extends").join(" and ")} only; ` +
        `it may not carry ${bad.join(", ")} — override nothing, add only.`,
    );
  }
}

function union(a: readonly string[] | undefined, b: unknown): string[] | undefined {
  if (!Array.isArray(b)) return a === undefined ? undefined : [...a];
  const out = [...(a ?? [])];
  for (const x of b) if (typeof x === "string" && !out.includes(x)) out.push(x);
  return out;
}

/**
 * Overlay higher instances' actor directories onto `base`: a file with
 * `extends` adds `roles` and `capabilities` to a lower actor; any other file
 * is a new actor, refused if its id is already taken.
 */
export function overlayActors(
  base: readonly LoadedActor[],
  layers: ReadonlyArray<{ instance: string; dir: string }>,
  grants?: ReadonlyMap<string, readonly string[]>,
): LoadedActor[] {
  const byId = new Map<string, LoadedActor>(base.map((a) => [a.id, { ...a }]));
  for (const { instance, dir } of layers) {
    for (const p of jsonFiles(dir)) {
      const raw = readJson(p);
      if (typeof raw.extends !== "string") continue;
      onlyExtensionFields(raw, ACTOR_EXTENSION_FIELDS, p);
      const target = byId.get(raw.extends);
      if (target === undefined) {
        throw new Error(`${p} (${instance}): extends actor "${raw.extends}", which no instance below it declares.`);
      }
      target.roles = union(target.roles, raw.roles);
      target.capabilities = union(target.capabilities, raw.capabilities);
    }
    for (const a of readActors(dir, grants)) {
      if (byId.has(a.id)) {
        throw new Error(
          `${a.path} (${instance}): actor "${a.id}" is already declared below. Extend it with ` +
            `\`"extends": "${a.id}"\` and the roles or capabilities to add; never redeclare it.`,
        );
      }
      byId.set(a.id, a);
    }
  }
  return [...byId.values()];
}

/** The actor registry of `instanceRoot`'s checkout: its own, then dependents' overlays. */
export function checkoutActors(
  instanceRoot: string,
  ownActorsDir: string,
  grants?: ReadonlyMap<string, readonly string[]>,
): LoadedActor[] {
  const layers = scenarioLayersAbove(instanceRoot).map((l) => ({ instance: l.instance, dir: join(l.dir, ACTORS_DIRNAME) }));
  return overlayActors(readActors(ownActorsDir, grants), layers, grants);
}

/** A capability probe, as its JSON file declares it. */
export type CapabilityRecord = Record<string, unknown> & { id: string; path: string };

/**
 * Overlay higher instances' capability directories onto `base`'s: a file with
 * `extends` adds `requires` to a lower probe; any other file is a new probe,
 * refused if its id is already taken.
 */
export function overlayCapabilities(
  baseDir: string,
  layers: ReadonlyArray<{ instance: string; dir: string }>,
): CapabilityRecord[] {
  const byId = new Map<string, CapabilityRecord>();
  const add = (p: string, raw: Record<string, unknown>, instance?: string): void => {
    const id = String(raw.id ?? p.replace(/^.*\//, "").slice(0, -5));
    if (byId.has(id)) {
      throw new Error(
        `${p}${instance ? ` (${instance})` : ""}: capability "${id}" is already declared below. ` +
          `Extend it with \`"extends": "${id}"\`; never redeclare it.`,
      );
    }
    byId.set(id, { ...raw, id, path: p });
  };
  for (const p of jsonFiles(baseDir)) add(p, readJson(p));
  for (const { instance, dir } of layers) {
    const files = jsonFiles(dir).map((p) => ({ p, raw: readJson(p) }));
    for (const { p, raw } of files) {
      if (typeof raw.extends !== "string") continue;
      onlyExtensionFields(raw, CAPABILITY_EXTENSION_FIELDS, p);
      const target = byId.get(raw.extends);
      if (target === undefined) {
        throw new Error(`${p} (${instance}): extends capability "${raw.extends}", which no instance below it declares.`);
      }
      target.requires = union(target.requires as string[] | undefined, raw.requires);
    }
    for (const { p, raw } of files) if (typeof raw.extends !== "string") add(p, raw, instance);
  }
  return [...byId.values()];
}

/** The capability registry of `instanceRoot`'s checkout. */
export function checkoutCapabilities(instanceRoot: string, ownCapabilitiesDir: string): CapabilityRecord[] {
  const layers = scenarioLayersAbove(instanceRoot).map((l) => ({
    instance: l.instance,
    dir: join(l.dir, CAPABILITIES_DIRNAME),
  }));
  return overlayCapabilities(ownCapabilitiesDir, layers);
}
