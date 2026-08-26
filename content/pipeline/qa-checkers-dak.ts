/**
 * QA checkers for the `dak` adapter — WHO SMART Guidelines L2/L3 blocks.
 *
 * The adapter-scoping machinery landed before anything was registered in it,
 * which meant `dak` blocks would sweep clean by default: every paper criterion
 * correctly `n/a`, and no DAK criterion to take its place. A corpus that
 * reports no findings because nothing was asked is the exact false pass the
 * §5 integration contract exists to prevent, so these are the first axes that
 * actually ask something.
 *
 * ## What these check, and what they deliberately leave alone
 *
 * Structural presence and well-formedness — does the manifest have the
 * artefact its kind promises, does the artefact parse, does it declare the
 * thing its kind says it declares. **Not** semantic conformance: whether a
 * profile is valid against its base, whether a CQL library compiles, whether
 * a DMN table is complete over its inputs. Those need the real validators
 * (`fhir-validation`, SUSHI, a DMN engine) and belong to the L3 pipeline in
 * `docs/workflows/l3-fhir-pipeline.bpmn`, not to a grep.
 *
 * Reimplementing them here would produce a second, weaker verdict that
 * disagrees with the authoritative one — the argument §2c of the ingestion
 * proposal makes against a second copy of the corpus, applied to validation.
 *
 * ## The `depends_on` trap, deliberately walked around
 *
 * `dak-companion-present` exists to catch a manifest whose artefact is
 * missing. It therefore must NOT declare that artefact in `depends_on`, which
 * gates applicability: doing so would `n/a` exactly the blocks it exists to
 * flag. It depends on `ts` (always present) and looks for the companion
 * itself. That is what `also_invalidated_by` is for, and it is the case
 * `schemas/block-qa.ts` documents.
 *
 * @module content/pipeline/qa-checkers-dak
 */

import { existsSync, readFileSync } from "fs";
import type { CheckerPaths } from "../../schemas/block-qa";
import type { CheckerResult } from "./qa-checkers-extended";
import { DAK_LABEL_PREFIXES, type DakBlockKind } from "../../schemas/block-kinds";

/** The companion each DAK kind must carry to be more than a stub. */
export const REQUIRED_COMPANION: Partial<Record<DakBlockKind, "bpmn" | "dmn" | "fsh" | "cql">> = {
  "business-process": "bpmn",
  "decision-table": "dmn",
  "scheduling-logic": "dmn",
  "cql-library": "cql",
  "logical-model": "fsh",
  profile: "fsh",
  "value-set": "fsh",
  questionnaire: "fsh",
  "structure-map": "fsh",
  "plan-definition": "fsh",
  measure: "fsh",
  "actor-definition": "fsh",
};

const pass = (): CheckerResult => ({ result: "pass", hits: [] });

function fail(file: string, line: number, text: string): CheckerResult {
  return { result: "fail", hits: [{ file, line, text }] };
}

function read(path: string | undefined): string | undefined {
  if (!path || !existsSync(path)) return undefined;
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return undefined;
  }
}

/** Kind, read from the manifest source. Cheap and good enough for dispatch. */
function kindOf(tsPath: string | undefined): string | undefined {
  const src = read(tsPath);
  if (!src) return undefined;
  const m = src.match(/export\s+default\s+([A-Za-z][A-Za-z0-9]*)\s*\(/);
  if (!m) return undefined;
  // Builder name → kind. Only the kebab-case DAK kinds differ from their
  // builder, so invert the prefix table's key set via the builder map.
  return m[1];
}

/**
 * The manifest declares a kind whose artefact is missing.
 *
 * A `decision-table` with no `.dmn` is a title and a label — it looks like
 * content in every listing and carries none.
 */
export function checkDakCompanionPresent(paths: CheckerPaths): CheckerResult {
  const builder = kindOf(paths.ts);
  if (!builder || !paths.ts) return pass();
  const kind = BUILDER_TO_DAK_KIND[builder];
  if (!kind) return pass(); // not a DAK block — the adapter gate handles it
  const required = REQUIRED_COMPANION[kind];
  if (!required) return pass();
  if (paths[required]) return pass();
  return fail(
    paths.ts,
    1,
    `${kind} block declares no .${required} companion — the manifest carries a label and no artefact`,
  );
}

/** `.bpmn` parses as XML and declares at least one process. */
export function checkDakBpmnHasProcess(paths: CheckerPaths): CheckerResult {
  const src = read(paths.bpmn);
  if (!src) return pass();
  if (!/<\?xml/.test(src.slice(0, 200))) {
    return fail(paths.bpmn!, 1, ".bpmn does not begin with an XML declaration");
  }
  if (!/<(?:\w+:)?process\b/i.test(src)) {
    return fail(paths.bpmn!, 1, ".bpmn declares no <process> element");
  }
  return pass();
}

/** `.dmn` declares a decision with a decision table, not just a definitions shell. */
export function checkDakDmnHasDecisionTable(paths: CheckerPaths): CheckerResult {
  const src = read(paths.dmn);
  if (!src) return pass();
  if (!/<(?:\w+:)?decision\b/i.test(src)) {
    return fail(paths.dmn!, 1, ".dmn declares no <decision> element");
  }
  if (!/<(?:\w+:)?decisionTable\b/i.test(src)) {
    return fail(
      paths.dmn!,
      1,
      ".dmn has a <decision> but no <decisionTable> — the logic is not expressed",
    );
  }
  return pass();
}

/**
 * `.fsh` declares a resource of the kind the block claims.
 *
 * Catches the copy-paste error that a schema cannot: a block labelled
 * `vs:danger-signs` whose `.fsh` actually declares a `Profile`.
 */
const FSH_DECLARATION: Partial<Record<DakBlockKind, RegExp>> = {
  profile: /^\s*Profile\s*:/m,
  "value-set": /^\s*ValueSet\s*:/m,
  questionnaire: /^\s*Instance\s*:/m,
  "logical-model": /^\s*Logical\s*:/m,
  "structure-map": /^\s*Instance\s*:/m,
  "plan-definition": /^\s*Instance\s*:/m,
  measure: /^\s*Instance\s*:/m,
  "actor-definition": /^\s*Instance\s*:/m,
};

export function checkDakFshDeclaresKind(paths: CheckerPaths): CheckerResult {
  const src = read(paths.fsh);
  if (!src || !paths.ts) return pass();
  const builder = kindOf(paths.ts);
  const kind = builder ? BUILDER_TO_DAK_KIND[builder] : undefined;
  if (!kind) return pass();
  const expected = FSH_DECLARATION[kind];
  if (!expected) return pass();
  if (expected.test(src)) return pass();
  return fail(
    paths.fsh!,
    1,
    `${kind} block's .fsh declares no ${String(expected).replace(/[/^\\s*:m]/g, "")} — kind and artefact disagree`,
  );
}

/**
 * The label prefix matches the kind the builder introduces.
 *
 * The Zod schema enforces this at construction, so this catches the manifest
 * that was hand-edited afterwards — the same reason the paper side re-checks
 * things its builders already validate.
 */
export function checkDakLabelPrefixMatchesKind(paths: CheckerPaths): CheckerResult {
  const src = read(paths.ts);
  if (!src || !paths.ts) return pass();
  const builder = kindOf(paths.ts);
  const kind = builder ? BUILDER_TO_DAK_KIND[builder] : undefined;
  if (!kind) return pass();
  const label = src.match(/label\s*:\s*["']([^"']+)["']/)?.[1];
  if (!label) return pass();
  const expected = `${DAK_LABEL_PREFIXES[kind]}:`;
  if (label.startsWith(expected)) return pass();
  return fail(
    paths.ts,
    1,
    `${kind} block is labelled "${label}" but must start with "${expected}"`,
  );
}

// Builder name → DAK kind, built from the canonical prefix table's keys so a
// new kind cannot be added here and forgotten there.
const BUILDER_TO_DAK_KIND: Record<string, DakBlockKind> = Object.fromEntries(
  (Object.keys(DAK_LABEL_PREFIXES) as DakBlockKind[]).map((kind) => [
    kind.replace(/-(.)/g, (_, c: string) => c.toUpperCase()),
    kind,
  ]),
);

/** Dispatch map, merged into the sweep's checker table. */
export const DAK_AUTOMATED_CHECKERS: Record<
  string,
  (paths: CheckerPaths) => CheckerResult
> = {
  "dak-companion-present": checkDakCompanionPresent,
  "dak-bpmn-has-process": checkDakBpmnHasProcess,
  "dak-dmn-has-decision-table": checkDakDmnHasDecisionTable,
  "dak-fsh-declares-kind": checkDakFshDeclaresKind,
  "dak-label-prefix-matches-kind": checkDakLabelPrefixMatchesKind,
};
