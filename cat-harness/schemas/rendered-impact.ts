/**
 * What a change does to a RENDERED site: the contract every renderer answers
 * (bean `bnjs`, issue #971).
 *
 * Owner, 2026-10-06: *"each renderer should be able to give you from list of
 * input changed files, the list of output changed rendered files ... from the
 * dependency cone"*, and a Change Set's PR is reviewed against that list.
 *
 * ## The contract
 *
 * A renderer takes the input files a change touched and returns a
 * `rendered-impact/v1`: every rendered file the change alters, each with the
 * chain that reached it (`via`) and a `role`, plus every input it could NOT
 * place. Two methods produce one:
 *
 * - `cone`: predicted from the renderer's dependency cone, BEFORE a build.
 *   What a reviewer is shown while the build runs, and what an incremental
 *   build re-renders.
 * - `build-diff`: measured by comparing two built sites (`diffBuiltSites`).
 *   The check on a prediction: a file in the build diff that the cone did not
 *   name is a cone defect, and is reported as one (`comparePrediction`).
 *
 * ## Three rules
 *
 * 1. **Could-not-determine is never "no change".** An input the renderer cannot
 *    place goes in `undetermined` with its reason; an empty `files` with a
 *    non-empty `undetermined` means "not known", and a consumer must say so.
 * 2. **Index files are listed, and marked, not dropped.** The owner reviews
 *    content pages, not search indexes, so a list for review filters on
 *    `role !== "index"`; but a page that is an index for one renderer is
 *    content for another, so the renderer marks the role and the reader
 *    filters, never the other way round.
 * 3. **A page whose BYTES do not change can still change.** An AST artefact
 *    page loads its resource in the browser, so a changed resource changes
 *    what the page shows while its HTML stays identical. The cone names the
 *    page (`role: "content"`) AND the data file (`role: "data"`); a build diff
 *    sees only the data file. `comparePrediction` therefore never counts a
 *    predicted content page that is missing from the build diff as a defect.
 *
 * @graphNode schema
 * @module cat-harness/schemas/rendered-impact
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { z } from "zod";

export const RENDERED_IMPACT_TAG = "rendered-impact/v1" as const;

/** What a rendered file is FOR, so a review list can filter without knowing the renderer. */
export const RENDERED_ROLES = ["content", "data", "index"] as const;
export type RenderedRole = (typeof RENDERED_ROLES)[number];

export const RenderedFileSchema = z.object({
  /** Path in the BUILT site, relative to its root, e.g. `ast/artifact/PlanDefinition-X.html`. */
  path: z.string().min(1),
  change: z.enum(["changed", "added", "removed"]),
  role: z.enum(RENDERED_ROLES),
  /**
   * How the change reached this file: the changed input first, then each
   * node the cone went through, e.g. `["input/fsh/x.fsh", "IMMZD18SBCG",
   * "PlanDefinition/IMMZD18SBCG"]`. Empty for a build diff, which measures
   * that a file changed and cannot say why.
   */
  via: z.array(z.string()).default([]),
  /**
   * The fragment ids within `path` the change alters, for a page that
   * assembles many units (a document page with an anchor per block). A review
   * list links `path#anchor` for each. Absent when the whole file is the unit,
   * or when a build diff cannot say which part changed.
   */
  anchors: z.array(z.string().min(1)).optional(),
});
export type RenderedFile = z.infer<typeof RenderedFileSchema>;

export const UndeterminedSchema = z.object({
  input: z.string().min(1),
  reason: z.string().min(1),
  /** `all`: the input can re-render anything (a site config, a shared include). */
  scope: z.enum(["unknown", "all"]).default("unknown"),
});

export const RenderedImpactSchema = z.object({
  $schema: z.literal(RENDERED_IMPACT_TAG),
  /** The renderer, by its Tool id or script, e.g. `fhir-ig-ast-pages`. */
  renderer: z.string().min(1),
  method: z.enum(["cone", "build-diff"]),
  /** The site the paths are relative to, as a reader finds it (an instance, a URL path). */
  site: z.string().optional(),
  base: z.string().optional(),
  head: z.string().optional(),
  /** The changed input files the renderer was given, relative to its source root. */
  inputs: z.array(z.string()).default([]),
  files: z.array(RenderedFileSchema),
  undetermined: z.array(UndeterminedSchema).default([]),
});
export type RenderedImpact = z.infer<typeof RenderedImpactSchema>;

/** The files a reviewer should open: everything but indexes, in path order. */
export function reviewList(impact: RenderedImpact): RenderedFile[] {
  return impact.files.filter((f) => f.role !== "index").sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Files a static-site build writes for search and navigation rather than for
 * a reader: the default `isIndex` for a build diff, which cannot ask the
 * renderer. Matched on the path's tail, so a site under a baseurl matches too.
 */
const GENERIC_INDEX = [/(^|\/)assets\/js\/search-data\.json$/, /(^|\/)sitemap\.xml$/, /(^|\/)feed\.xml$/, /(^|\/)robots\.txt$/, /\.map$/];
export const isGenericIndex = (path: string): boolean => GENERIC_INDEX.some((re) => re.test(path));

function walk(root: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) stack.push(p);
      else out.set(relative(root, p), createHash("sha256").update(readFileSync(p)).digest("hex"));
    }
  }
  return out;
}

/**
 * The measured half: every file that differs between two built sites, by
 * content hash. `isIndex` decides the role of each (default `isGenericIndex`);
 * anything else is `content` for `.html` and `data` otherwise.
 */
export function diffBuiltSites(
  before: string,
  after: string,
  opts: { renderer: string; site?: string; base?: string; head?: string; isIndex?: (path: string) => boolean } = { renderer: "build-diff" },
): RenderedImpact {
  const a = walk(before);
  const b = walk(after);
  const isIndex = opts.isIndex ?? isGenericIndex;
  const role = (p: string): RenderedRole => (isIndex(p) ? "index" : p.endsWith(".html") ? "content" : "data");
  const files: RenderedFile[] = [];
  for (const [p, h] of b) {
    const old = a.get(p);
    if (old === undefined) files.push({ path: p, change: "added", role: role(p), via: [] });
    else if (old !== h) files.push({ path: p, change: "changed", role: role(p), via: [] });
  }
  for (const p of a.keys()) if (!b.has(p)) files.push({ path: p, change: "removed", role: role(p), via: [] });
  files.sort((x, y) => x.path.localeCompare(y.path));
  return RenderedImpactSchema.parse({
    $schema: RENDERED_IMPACT_TAG,
    renderer: opts.renderer,
    method: "build-diff",
    ...(opts.site ? { site: opts.site } : {}),
    ...(opts.base ? { base: opts.base } : {}),
    ...(opts.head ? { head: opts.head } : {}),
    files,
  });
}

export interface PredictionCheck {
  /** Measured to change but not predicted: a cone defect, never a pass. */
  missed: string[];
  /** Predicted and measured. */
  confirmed: string[];
  /** Predicted, not measured: expected for content pages that load their data (rule 3), suspicious otherwise. */
  unconfirmed: { path: string; role: RenderedRole }[];
}

/** Check a `cone` prediction against a `build-diff` measurement. Index files are compared too. */
export function comparePrediction(predicted: RenderedImpact, measured: RenderedImpact): PredictionCheck {
  const want = new Map(predicted.files.map((f) => [f.path, f]));
  const got = new Set(measured.files.map((f) => f.path));
  return {
    missed: [...got].filter((p) => !want.has(p)).sort(),
    confirmed: [...got].filter((p) => want.has(p)).sort(),
    unconfirmed: [...want.values()].filter((f) => !got.has(f.path)).map((f) => ({ path: f.path, role: f.role })).sort((a, b) => a.path.localeCompare(b.path)),
  };
}
