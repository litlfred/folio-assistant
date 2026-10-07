/**
 * Every node kind a checkout declares, found THROUGH the graph typologies —
 * issue #2195, PR 1.
 *
 * @module cat-harness/schemas/node-kind-index
 * @graphNode none — a function library over the typology registry; it defines no schema
 *
 * ## Two concepts, no third
 *
 * The owner, 2026-10-05, on a proposed JSON `node-kinds/` graph: *"i thought
 * we consolidated to two kinds? why a third? i thought node kind = tpyscpt
 * kind."* So:
 *
 * - a **graph typology** is what a DIRECTORY holds — its `$schema` families
 *   (`nodeSchemas`), each naming the TypeScript that validates it;
 * - a **node kind** is a `nodeKind()` in TypeScript — a class whose parents
 *   make it a subclass.
 *
 * This module joins them and adds nothing: where a family's (or a typology's)
 * `validator` names a `nodeKind()` export, that kind is the family's node kind.
 * There is no list of kinds to keep, because the typologies already list every
 * family a directory holds, and no source scan, because a scan finds kinds that
 * hold nothing.
 *
 * ## The declaring harness is not written down
 *
 * It is the instance the validator ref names — `core:schemas/x.ts#XKind` is
 * declared by `core` — or, for an unqualified ref, the instance the ref
 * resolves against (cat-harness). A second field saying the same thing would
 * be free to disagree with the path.
 *
 * ## UNKINDED is a third state, not a failure
 *
 * Most families predate node kinds: their validator is a bare Zod schema, or
 * they name none. Each is reported as unkinded with the reason, so the gate can
 * hold the existing ones as a baseline and fail only on a NEW one — the owner's
 * *"QA check on new kinds"*.
 */
import { existsSync } from "node:fs";
import { z } from "zod";
import { join, relative, resolve } from "node:path";

import { readDeclaration, resolveGraphTypology, type GraphTypologyRegistry } from "./cat-harness.js";
import type { NodeSchemaRef } from "./graph-typology-registry.js";
import { parseValidatorRef, rootOf } from "./kind-validator.js";
import { isNodeKind, nodeKind, type NodeKind } from "./node-kind.js";

/** One node kind, as the index records it. */
export interface NodeKindEntry {
  /** `nodeKind()`'s id — a `$schema` tag for a tagged kind, a name for a mixin. */
  id: string;
  /** SemVer, for a kind whose nodes are files; absent for a mixin. */
  version?: string;
  /** `<id>/<version>`: the `$schema` a current node carries. */
  tag?: string;
  /** Direct parents, by id, in declared order. */
  parents: string[];
  /** Direct subclasses, by id, sorted: the kinds that name this one as a parent. */
  subclasses: string[];
  /**
   * The instance that declares it: the one whose code holds the `nodeKind()`.
   * Absent for a kind reached only as an ANCESTOR (a mixin such as `themed`):
   * no typology names it, so nothing here says where it lives, and guessing
   * from a child would file it under whichever child was read first.
   */
  declaredBy?: string;
  /** Where, repo-relative, and under which export. Absent for an ancestor reached only as a parent. */
  module?: string;
  exportName?: string;
  /**
   * The kind's own page renderer, when its validator node names one (`pages`),
   * repo-relative. Absent: the generic pages built from the schema.
   */
  pages?: { module: string; exportName: string };
  /** The graph typologies that hold nodes of this kind, and the families they file it under. */
  holdings: { typology: string; family?: string }[];
}

/** A family (or a typology's nodes as a whole) that no node kind validates yet. */
export interface Unkinded {
  typology: string;
  /** The `$schema` family; absent when it is the typology's kind-level validator. */
  family?: string;
  reason: "zod-schema" | "no-validator" | "unresolvable";
  ref?: string;
}

export interface NodeKindIndex {
  kinds: NodeKindEntry[];
  unkinded: Unkinded[];
  /** Two different kinds sharing one id — always a finding. */
  collisions: string[];
}

/**
 * The committed index file, `cat-harness/docs/_data/node-kinds.json`, as a
 * node kind — so the file that records node kinds is itself one, and the gate
 * that refuses a new unkinded family does not start by refusing its own.
 */
export const NodeKindIndexFileKind = nodeKind("node-kind-index/1.0.0", [], {
  kinds: z.array(z.object({
    id: z.string().min(1),
    version: z.string().optional(),
    tag: z.string().optional(),
    parents: z.array(z.string()),
    subclasses: z.array(z.string()),
    declaredBy: z.string().optional(),
    module: z.string().optional(),
    exportName: z.string().optional(),
    pages: z.object({ module: z.string().min(1), exportName: z.string().min(1) }).optional(),
    holdings: z.array(z.object({ typology: z.string().min(1), family: z.string().optional() })),
  })),
  unkinded: z.array(z.object({
    typology: z.string().min(1),
    family: z.string().optional(),
    reason: z.enum(["zod-schema", "no-validator", "unresolvable"]),
    ref: z.string().optional(),
  })),
  collisions: z.array(z.string()),
});

/** The key the gate's baseline is kept under: `typology` or `typology#family`. */
export const unkindedKey = (u: Pick<Unkinded, "typology" | "family">): string =>
  u.family === undefined ? u.typology : `${u.typology}#${u.family}`;

/**
 * Build the index from `registry`. `instanceRoot` is what an unqualified
 * validator ref resolves against (cat-harness's root, as `check:kind-validators`
 * uses); `repoRoot` makes the recorded module paths repo-relative.
 */
export async function nodeKindIndex(
  registry: GraphTypologyRegistry,
  instanceRoot: string,
  repoRoot: string,
): Promise<NodeKindIndex> {
  const byId = new Map<string, { kind: NodeKind; entry: NodeKindEntry }>();
  const collisions = new Set<string>();
  const unkinded: Unkinded[] = [];

  const add = (kind: NodeKind, declared?: { declaredBy: string; module: string; exportName: string }): NodeKindEntry => {
    const prior = byId.get(kind.id);
    if (prior) {
      if (prior.kind !== kind) collisions.add(kind.id);
      if (declared && !prior.entry.module) Object.assign(prior.entry, declared);
      return prior.entry;
    }
    const entry: NodeKindEntry = { id: kind.id, ...(kind.version ? { version: kind.version, tag: kind.tag } : {}), parents: kind.parents.map((p) => p.id), subclasses: [], ...declared, holdings: [] };
    byId.set(kind.id, { kind, entry });
    // Ancestors are kinds too, though no typology may name them directly.
    for (const p of kind.parents) add(p);
    return entry;
  };

  const resolveRef = async (validator: string): Promise<{ kind?: NodeKind; declaredBy: string; at?: { module: string; exportName: string }; reason?: Unkinded["reason"] }> => {
    let ref;
    try {
      ref = parseValidatorRef(validator);
    } catch {
      return { declaredBy: "", reason: "unresolvable" };
    }
    const base = rootOf(ref.instance, instanceRoot);
    if (base === undefined) return { declaredBy: ref.instance ?? "", reason: "unresolvable" };
    const declaredBy = ref.instance ?? readDeclaration(instanceRoot)?.name ?? "";
    const abs = resolve(join(base, ref.module));
    if (!existsSync(abs)) return { declaredBy, reason: "unresolvable" };
    let mod: Record<string, unknown>;
    try {
      mod = (await import(abs)) as Record<string, unknown>;
    } catch {
      return { declaredBy, reason: "unresolvable" };
    }
    const named = mod[ref.exportName];
    const at = { module: relative(repoRoot, abs).split("\\").join("/"), exportName: ref.exportName };
    return isNodeKind(named) ? { kind: named, declaredBy, at } : { declaredBy, at, reason: "zod-schema" };
  };

  // A renderer is resolved to a path, not imported: only the page generator
  // runs it, and an index that executed page code to list kinds would fail on
  // a renderer's bug rather than report the kind.
  const withPages = (entry: NodeKindEntry, typology: string, family?: string): NodeKindEntry => {
    const pages = registry.validatorNodeFor(typology, family)?.node.pages;
    if (!pages || entry.pages) return entry;
    const ref = parseValidatorRef(pages);
    const base = rootOf(ref.instance, instanceRoot);
    if (base !== undefined) entry.pages = { module: relative(repoRoot, resolve(join(base, ref.module))).split("\\").join("/"), exportName: ref.exportName };
    return entry;
  };

  for (const name of registry.names().sort()) {
    const typology = resolveGraphTypology(name).kind;
    if (typology !== name) continue; // an alias: its canonical name is visited on its own
    const def = registry.get(typology);
    if (!def) continue;
    const families = Object.entries((def.nodeSchemas ?? {}) as Record<string, NodeSchemaRef>);
    // A typology with families is judged per family; one without is judged on
    // its kind-level validator, and one with neither holds nothing a node kind
    // could type (markdown, XML, code) and is not counted.
    if (families.length > 0) {
      for (const [family, ref] of families) {
        if (ref.external) continue; // an outside standard, e.g. JSON Schema itself
        const validator = ref.validator;
        if (!validator) {
          unkinded.push({ typology, family, reason: "no-validator" });
          continue;
        }
        const r = await resolveRef(validator);
        if (r.kind) withPages(add(r.kind, { declaredBy: r.declaredBy, ...r.at! }), typology, family).holdings.push({ typology, family });
        else unkinded.push({ typology, family, reason: r.reason ?? "unresolvable", ref: validator });
      }
    } else if (def.validator) {
      const r = await resolveRef(def.validator);
      if (r.kind) withPages(add(r.kind, { declaredBy: r.declaredBy, ...r.at! }), typology).holdings.push({ typology });
      else unkinded.push({ typology, reason: r.reason ?? "unresolvable", ref: def.validator });
    }
  }

  for (const { entry } of byId.values()) {
    for (const p of entry.parents) byId.get(p)?.entry.subclasses.push(entry.id);
  }
  const kinds = [...byId.values()].map(({ entry }) => ({ ...entry, subclasses: entry.subclasses.sort() }));
  kinds.sort((a, b) => a.id.localeCompare(b.id));
  unkinded.sort((a, b) => unkindedKey(a).localeCompare(unkindedKey(b)));
  return { kinds, unkinded, collisions: [...collisions].sort() };
}

/**
 * Families unkinded now that `baseline` does not list — the gate's finding.
 * A baselined family that has since become a kind is simply absent from `now`,
 * so the baseline shrinks without a separate rule.
 */
export function newUnkinded(now: Pick<NodeKindIndex, "unkinded">, baseline: Pick<NodeKindIndex, "unkinded"> | undefined): string[] {
  const known = new Set((baseline?.unkinded ?? []).map(unkindedKey));
  return now.unkinded.map(unkindedKey).filter((k) => !known.has(k));
}

/** Every kind at or below `id` in the subclass tree — what a kind's page lists. */
export function kindAndSubclasses(index: Pick<NodeKindIndex, "kinds">, id: string): string[] {
  const byId = new Map(index.kinds.map((k) => [k.id, k]));
  const out: string[] = [];
  const visit = (k: string): void => {
    if (out.includes(k)) return;
    out.push(k);
    for (const s of byId.get(k)?.subclasses ?? []) visit(s);
  };
  visit(id);
  return out;
}
