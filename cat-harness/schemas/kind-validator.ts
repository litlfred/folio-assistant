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

import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { z } from "zod";

import { defaultGraphKinds, resolveGraphKind, type GraphKindRegistry } from "./cat-harness.js";

/** A validator reference, split from its `module#Export` form. */
export interface ValidatorRef {
  /** Instance-relative module path. */
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
  const module = ref.slice(0, hash).trim();
  const exportName = ref.slice(hash + 1).trim();
  if (!module || !exportName) {
    throw new ValidatorRefError(`validator ${JSON.stringify(ref)} is not "module#Export".`);
  }
  if (isAbsolute(module) || module.startsWith("..")) {
    throw new ValidatorRefError(
      `validator module ${JSON.stringify(module)} must be instance-relative. An absolute ` +
        `or escaping path resolves into whatever checkout happens to be next door.`,
    );
  }
  return { module, exportName };
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

  let ref: ValidatorRef;
  try {
    ref = parseValidatorRef(def.validator);
  } catch (e) {
    return {
      state: "unresolvable",
      kind: canonical,
      reason: e instanceof Error ? e.message : String(e),
    };
  }

  const abs = resolve(join(instanceRoot, ref.module));
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
