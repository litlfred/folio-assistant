/**
 * Resolving a graph kind's **validator** — the one parameter that turns
 * "validate a node" from one case per schema into a lookup.
 *
 * Bean `folio-assistant-i31r`, route A of `folio-assistant-3lbz`, issue #223
 * (*"must constrain Skills i/o with schemas (json,.ts)"*).
 *
 * ## Why a lookup at all
 *
 * 199 exported Zod schemas, and a Tool per schema would be 199 nodes nobody
 * invokes. The owner, 2026-09-20: *"a Tool per Zod schema... no, but there
 * should be common patterns (single pattern?) with some parameters more or
 * less"*. The parameter is the **graph kind**: `harness.json` already says
 * which directory holds which kind, so "what is this file" is already
 * answerable, and {@link GraphKindDef.validator} supplies the other half.
 *
 * ## The business case, since it is not this repository's
 *
 * `tools/` is a declared graph with INHERITED scope; `.github/workflows/` is
 * declared nowhere. So a downstream instance inherits the platform's Tool
 * nodes and inherits none of its 41 gates. Today folio-assistant validates
 * its own graph in CI and a folio built on it validates nothing — and #363's
 * self-sovereign topology (*"no github, local git only"*) has no CI to
 * inherit from in the first place.
 *
 * ## Three states, and the middle one is the point
 *
 * | | |
 * |---|---|
 * | **resolved** | the kind declares a validator and it loaded |
 * | **undeclared** | the kind declares none — *could not determine*, never "valid" |
 * | **unresolvable** | it declares one that does not load — a defect, and loud |
 *
 * 13 of the 16 base kinds are `undeclared`, and one of them is `qa`, the
 * largest generated graph here. A resolver that collapsed `undeclared` into
 * success would report a clean sweep over the majority of the corpus. That
 * is the `dh4f` shape and this module refuses it structurally: the result is
 * a union, so a caller cannot read a verdict without handling the middle.
 *
 * @graphNode schema
 * @module folio-assistant/schemas/kind-validator
 */

import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { z } from "zod";
import ts from "typescript";

import {
  defaultGraphKinds,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
  resolveGraphKind,
  type GraphKindRegistry,
} from "./cat-harness.js";
import type { NodeSchemaRef } from "./graph-kind-registry.js";

/** A validator reference, split from its `module#Export` form. */
export interface ValidatorRef {
  /**
   * The instance the module belongs to, by its DECLARED NAME, when that is not
   * the instance resolving the reference: `folio-assistant-core:schemas/x.ts#X`.
   *
   * By name rather than by a `../` path, because a relative path resolves into
   * whatever checkout sits next door, and a name resolves only to the instance
   * that declares it. Bean `quda`: a harness kind whose node shapes live in
   * core (`catalogue`, `uploads`) had no honest way to say so.
   */
  instance?: string;
  /** Module path, relative to {@link ValidatorRef.instance}'s root, or to the resolving one. */
  module: string;
  /** The exported symbol — required; see §"`module#Export`". */
  exportName: string;
}

export type KindValidator =
  | { state: "resolved"; ref: ValidatorRef; schema: z.ZodTypeAny }
  | { state: "undeclared"; kind: string; reason: string }
  | { state: "unresolvable"; kind: string; ref?: ValidatorRef; reason: string };

export class ValidatorRefError extends Error {}

/**
 * Split `module#Export`.
 *
 * The `#` half is REQUIRED rather than defaulting to a conventional name. A
 * module exports many schemas — `schemas/health-report.ts` exports five — and
 * a default would pick one silently, which is how a validator ends up
 * checking the wrong shape and passing.
 */
export function parseValidatorRef(ref: string): ValidatorRef {
  const hash = ref.indexOf("#");
  if (hash < 0) {
    throw new ValidatorRefError(
      `validator ${JSON.stringify(ref)} has no "#Export". A module exports many ` +
        `schemas; naming one is the difference between validating this kind and ` +
        `validating whichever export came first.`,
    );
  }
  let module = ref.slice(0, hash).trim();
  const exportName = ref.slice(hash + 1).trim();
  const qualified = /^([a-z][a-z0-9-]*):(.+)$/.exec(module);
  const instance = qualified?.[1];
  if (qualified) module = qualified[2];
  if (!module || !exportName) {
    throw new ValidatorRefError(`validator ${JSON.stringify(ref)} is not "module#Export".`);
  }
  if (isAbsolute(module) || module.startsWith("..")) {
    throw new ValidatorRefError(
      `validator module ${JSON.stringify(module)} must be instance-relative. An absolute ` +
        `or escaping path resolves into whatever checkout happens to be next door.`,
    );
  }
  return instance ? { instance, module, exportName } : { module, exportName };
}

/** Is this object a Zod schema — i.e. can a caller actually run it? */
export function isZodSchema(v: unknown): v is z.ZodTypeAny {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { safeParse?: unknown }).safeParse === "function"
  );
}

/**
 * The validator for a graph kind, or a stated reason there is none.
 *
 * `instanceRoot` is the INSTANCE root, not the repository root — the two
 * parted company when `#437` moved this instance under `cat-harness/`, and
 * nothing noticed because nothing read these paths.
 */
export async function resolveKindValidator(
  kind: string,
  instanceRoot: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): Promise<KindValidator> {
  const canonical = resolveGraphKind(kind).kind;
  const def = registry.get(canonical);
  if (!def) {
    return { state: "unresolvable", kind: canonical, reason: `no such graph kind` };
  }
  if (!def.validator) {
    return {
      state: "undeclared",
      kind: canonical,
      reason:
        `graph kind "${canonical}" declares no validator, so a node of this kind ` +
        `cannot be checked. Not a failure and not a pass.`,
    };
  }

  return loadValidator(def.validator, canonical, instanceRoot);
}

/**
 * Load one `module#Export` as a Zod schema. Shared by the kind-level
 * {@link resolveKindValidator} and the per-family {@link resolveNodeSchemas},
 * so the two cannot disagree about what "resolves" means.
 */
async function loadValidator(
  validator: string,
  canonical: string,
  instanceRoot: string,
): Promise<KindValidator> {
  let ref: ValidatorRef;
  try {
    ref = parseValidatorRef(validator);
  } catch (e) {
    return {
      state: "unresolvable",
      kind: canonical,
      reason: e instanceof Error ? e.message : String(e),
    };
  }

  const base = rootOf(ref.instance, instanceRoot);
  if (base === undefined) {
    return { state: "unresolvable", kind: canonical, ref, reason: `no instance declares the name ${ref.instance}` };
  }
  const abs = resolve(join(base, ref.module));
  if (!existsSync(abs)) {
    return {
      state: "unresolvable",
      kind: canonical,
      ref,
      reason: `${ref.module} does not exist under the instance root ${instanceRoot}`,
    };
  }

  let mod: Record<string, unknown>;
  try {
    mod = (await import(abs)) as Record<string, unknown>;
  } catch (e) {
    return {
      state: "unresolvable",
      kind: canonical,
      ref,
      reason: `${ref.module} could not be imported: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const exported = mod[ref.exportName];
  if (exported === undefined) {
    return {
      state: "unresolvable",
      kind: canonical,
      ref,
      reason: `${ref.module} exports no ${ref.exportName}`,
    };
  }
  if (!isZodSchema(exported)) {
    return {
      state: "unresolvable",
      kind: canonical,
      ref,
      reason:
        `${ref.module}#${ref.exportName} is not a Zod schema — it has no safeParse. ` +
        `A TypeScript interface documents a shape and cannot check one; that is the ` +
        `distinction GraphKindDef.schema and .validator exist to keep apart.`,
    };
  }
  return { state: "resolved", ref, schema: exported };
}

// ── Annotations ───────────────────────────────────────────────────────────

/**
 * A node with its top-level `_`-prefixed keys removed — `_comment`, `_note`.
 *
 * The corpus annotates JSON with them everywhere, and every loader already
 * drops them before parsing (`check-catalogue.ts` does it inline). A sweep
 * that did not would fail strict schemas on a comment, and teach nothing.
 */
export function stripAnnotations(node: unknown): unknown {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return node;
  return Object.fromEntries(Object.entries(node as Record<string, unknown>).filter(([k]) => !k.startsWith("_")));
}

// ── Instance-qualified references (bean `quda`) ──────────────────────────

const rootsByName = new Map<string, Map<string, string>>();

/**
 * The root a reference resolves against: the named instance's, or the
 * resolving instance's own when the reference names none. `undefined` when
 * no instance in the checkout declares that name.
 */
export function rootOf(instance: string | undefined, instanceRoot: string): string | undefined {
  if (instance === undefined) return instanceRoot;
  const repo = repoRootFor(instanceRoot);
  let byName = rootsByName.get(repo);
  if (!byName) {
    byName = new Map();
    for (const root of instanceRootsIn(repo)) {
      try {
        const name = readDeclaration(root)?.name;
        if (name) byName.set(name, root);
      } catch {
        // an unreadable declaration names nothing
      }
    }
    rootsByName.set(repo, byName);
  }
  if (readDeclarationName(instanceRoot) === instance) return instanceRoot;
  return byName.get(instance);
}

function readDeclarationName(root: string): string | undefined {
  try {
    return readDeclaration(root)?.name;
  } catch {
    return undefined;
  }
}

// ── Per-family node schemas (bean `rdkm`) ────────────────────────────────

/** One field of a TypeScript shape, read from source — never executed. */
export interface ShapeField {
  name: string;
  optional: boolean;
  /** The type as written in the source. */
  type: string;
}

/**
 * One `$schema` family of a kind, resolved. A TypeScript shape is READABLE
 * but not RUNNABLE, and an external one is somebody else's; neither is a load
 * failure. (An `untyped` state existed until #1168 B6b removed the registry
 * form that produced it.)
 */
export type NodeSchemaResolution =
  | { tag: string; state: "resolved"; ref: ValidatorRef; schema: z.ZodTypeAny }
  | { tag: string; state: "shape"; ref: ValidatorRef; fields: ShapeField[] }
  | { tag: string; state: "external"; spec: string }
  | { tag: string; state: "unresolvable"; reason: string };

/**
 * Read an interface's or object type alias's fields from source.
 *
 * With the TypeScript parser rather than by import, because an interface does
 * not exist at runtime — which is exactly why it cannot be a validator.
 * Returns undefined when the module does not declare the name.
 */
export function readShape(instanceRoot: string, shape: string): { ref: ValidatorRef; fields: ShapeField[] } | string {
  let ref: ValidatorRef;
  try {
    ref = parseValidatorRef(shape);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  const base = rootOf(ref.instance, instanceRoot);
  if (base === undefined) return `no instance declares the name ${ref.instance}`;
  const abs = resolve(join(base, ref.module));
  if (!existsSync(abs)) return `${ref.module} does not exist under the instance root ${base}`;
  const src = ts.createSourceFile(abs, readFileSync(abs, "utf8"), ts.ScriptTarget.Latest, true);
  let members: ts.NodeArray<ts.TypeElement> | undefined;
  src.forEachChild((n) => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === ref.exportName) members = n.members;
    if (ts.isTypeAliasDeclaration(n) && n.name.text === ref.exportName && ts.isTypeLiteralNode(n.type)) {
      members = n.type.members;
    }
  });
  if (!members) return `${ref.module} declares no interface or object type ${ref.exportName}`;
  const fields: ShapeField[] = [];
  for (const m of members) {
    if (!ts.isPropertySignature(m) || !m.name) continue;
    fields.push({
      name: m.name.getText(src).replace(/^["']|["']$/g, ""),
      optional: m.questionToken !== undefined,
      type: m.type ? m.type.getText(src).replace(/\s+/g, " ") : "any",
    });
  }
  return { ref, fields };
}

/**
 * Every `$schema` family a kind declares, resolved. Empty when the kind
 * declares none — the caller then falls back to the kind-level validator.
 */
export async function resolveNodeSchemas(
  kind: string,
  instanceRoot: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): Promise<NodeSchemaResolution[]> {
  const canonical = resolveGraphKind(kind).kind;
  const map = (registry.get(canonical)?.nodeSchemas ?? {}) as Record<string, NodeSchemaRef>;
  const out: NodeSchemaResolution[] = [];
  for (const [tag, ref] of Object.entries(map)) {
    if (ref.validator) {
      const v = await loadValidator(ref.validator, canonical, instanceRoot);
      out.push(
        v.state === "resolved"
          ? { tag, state: "resolved", ref: v.ref, schema: v.schema }
          : { tag, state: "unresolvable", reason: v.reason },
      );
    } else if (ref.shape) {
      const r = readShape(instanceRoot, ref.shape);
      out.push(typeof r === "string" ? { tag, state: "unresolvable", reason: r } : { tag, state: "shape", ...r });
    } else if (ref.external) {
      out.push({ tag, state: "external", spec: ref.external });
    }
  }
  return out;
}
