/**
 * ig-chrome.ts — a FHIR IG's published CHROME, as data.
 *
 * ## Why this exists
 *
 * The owner asked that our pages mirror the WHO IG's styling. `0818` shipped
 * the navigation and deliberately left this half open — *"the WHO visual
 * styling — blue bar, DRAFT watermark, yellow publish banner. A different
 * question from the menu"* — and it is a different question for a reason worth
 * stating before any of the code below makes sense.
 *
 * **A menu comes from ONE file. Chrome comes from a CHAIN.** An IG's
 * appearance is not declared anywhere in the IG. It is assembled by the IG
 * Publisher from a stack of `fhir.template` packages, each overriding the one
 * beneath it:
 *
 * ```
 *   smart-trust local-template  →  who.template.root 0.5.0  →  fhir.base.template 1.0.0
 * ```
 *
 * Measured 2026-09-23 from `local-template/package/package.json` and
 * `who-ig-template/package/package.json`, not assumed from the names.
 *
 * ## The finding that made a schema necessary rather than a stylesheet
 *
 * Of the three things the owner named, **only two are WHO's.** `who.css`
 * styles no `#publish-box` at all: `--publish-box-bg-color: yellow` and
 * `--publish-box-border: 1px solid #0A0008` are HL7's, at `project.css:64-65`,
 * inherited unchanged. So "mirror the WHO styling" mirrors HL7 for that one
 * item, and a reader of the result is entitled to know which organisation each
 * value came from. {@link IgChromeToken.from} is that answer, per token.
 *
 * ## An overlay is NOT a merge — one name can carry two TYPES
 *
 * `--toc-box-border` is `1px solid navy` in HL7 and **`navy`** in WHO. Both are
 * correct *in their own layer*: WHO's rules read it as a colour
 * (`who.css:499`, `border: 2px solid var(--toc-box-border)`) while HL7's read
 * it as a shorthand (`project.css:575`, `border: var(--toc-box-border)`). Put
 * the two layers together, as the IG Publisher actually does, and that HL7 rule
 * resolves to `border: navy` — which is not valid CSS.
 *
 * So a naive variable merge **ships a broken rule**, and it ships it silently,
 * because every individual layer parses. {@link IgChromeConflict} exists to
 * record that rather than resolve it: this repository is mirroring somebody
 * else's artefact, and quietly correcting their stylesheet would make our copy
 * a thing that renders differently from the original it claims to mirror. The
 * conflict is data; what to do about it is a person's call.
 *
 * ## It is INGESTED, never transcribed
 *
 * The same rule `0818` set for the menu and `wjfu` set for this corpus:
 * *"Generated from the KG, never transcribed."* Every value here is read out
 * of a template checkout at a named commit by `ingest-ig-chrome.ts`, and the
 * provenance is per LAYER because there is no single source to point at.
 *
 * @graphNode schema
 * @module schemas/ig-chrome
 */

import { z } from "zod";

export const IG_CHROME_SCHEMA_TAG = "folio-ig-chrome/v1";

/**
 * One template package in the chain, and where its bytes were read.
 *
 * `ref` is a commit SHA and is PROVENANCE, not a reference a consumer resolves
 * — `instance-versioning.md` §3.3's distinction. It records which bytes this
 * layer was read out of; nobody is being asked to fetch it.
 *
 * `package` is the `fhir.template` package name from the layer's own
 * `package/package.json`, never inferred from the repository name: `who.
 * template.root` lives in a repository called `smart-ig-template`, so the two
 * disagree in the very first case this schema was written for.
 */
export const IgChromeLayerSchema = z.object({
  /** The `fhir.template` package name, e.g. `who.template.root`. */
  package: z.string().min(1),
  /** Its declared version, e.g. `0.5.0`. */
  version: z.string().min(1),
  /** The repository the bytes were read from. */
  of: z.string().url(),
  /** The commit they were read at. Provenance. */
  ref: z.string().min(7),
  /** The stylesheet within that repository. */
  path: z.string().min(1),
  readAt: z.string().min(4),
});

/**
 * One resolved CSS custom property, and which layer won it.
 *
 * `overrides` is REQUIRED and may be empty, and the two are different facts:
 * `[]` means exactly one layer declared this token, while a non-empty list
 * means a lower layer's value is being shadowed. That distinction is the whole
 * value of this file over a flat stylesheet — `--navbar-bg-color: #00477d`
 * tells you the colour, and only `overrides` tells you WHO chose it, over what.
 */
export const IgChromeTokenSchema = z.object({
  /** The custom property, including its leading `--`. */
  name: z.string().regex(/^--[\w-]+$/),
  /** The winning value, verbatim. */
  value: z.string().min(1),
  /** The package whose declaration wins. */
  from: z.string().min(1),
  /** Lower layers this shadows, nearest first. Empty when only one declared it. */
  overrides: z.array(z.object({ package: z.string().min(1), value: z.string().min(1) })),
});

/**
 * A named rule mirrored whole, because it is not expressible as a token.
 *
 * The DRAFT watermark is the case that forced this: it is a tiled
 * `background-image` carrying an inline SVG, not a colour somebody could put
 * in a variable. Carrying only tokens would have silently dropped the one item
 * of the three that a reader actually recognises as "the WHO IG".
 */
export const IgChromeRuleSchema = z.object({
  /** The selector, verbatim, e.g. `#ig-status.ig-status-draft`. */
  selector: z.string().min(1),
  /** The package the rule was read from. */
  from: z.string().min(1),
  declarations: z.array(z.object({ property: z.string().min(1), value: z.string().min(1) })).min(1),
});

/**
 * A defect in the mirrored source, RECORDED rather than resolved.
 *
 * There is deliberately no `resolution` field: adding one would invite the
 * ingest to pick, and an ingest that picks is an ingest with an opinion about
 * somebody else's stylesheet.
 *
 * ## Two kinds, and the second was found by this file's own author
 *
 * `shape` is the `--toc-box-border` case described at the top of this file:
 * two layers, two different KINDS of value, one invalid substitution.
 *
 * `malformed` is a single layer's value that is not valid CSS at all. The
 * worked example is `--breadcrumb-text-color: ##555555` at `project.css:82` —
 * a doubled `#` in HL7's own source. It matters because of how it presents
 * downstream: it appears in our generated page as `##555555`, looking exactly
 * like a bug in the ingest that copied it. **It cost the author of this ingest
 * about thirty seconds of believing they had written it**, with the source
 * open in the next terminal. A reader who does not have the source open has no
 * way to tell at all.
 *
 * So the mirror still carries the value — a mirror that silently corrects its
 * subject is not a mirror — and the record says whose defect it is.
 */
export const IgChromeConflictSchema = z.object({
  token: z.string().min(1),
  /**
   * `shape` — the layers agree the token exists and disagree about what KIND
   * of value it holds, so a consumer substituting one into the other's rule
   * emits something invalid.
   *
   * `malformed` — one layer's value is not a valid CSS value on its own terms.
   */
  kind: z.enum(["shape", "malformed"]),
  detail: z.string().min(1),
  /**
   * Where it was seen. `min(1)` rather than `min(2)`: a `shape` conflict needs
   * two layers by definition, but a `malformed` value needs only one, and
   * requiring two would have made the second kind unrepresentable in the
   * schema written to hold it.
   */
  sites: z.array(z.object({ package: z.string().min(1), value: z.string().min(1) })).min(1),
});

export const IgChromeSchema = z.object({
  $schema: z.literal(IG_CHROME_SCHEMA_TAG),
  /** The IG's `id` from `sushi-config.yaml`, e.g. `smart.who.int.trust`. */
  id: z.string().min(1),
  /** Its `canonical`. */
  canonical: z.string().url(),
  /** Its `status` — what selects the watermark. `draft` here. */
  status: z.string().min(1),
  version: z.string().min(1).optional(),
  /** The chain, BASE FIRST, so index order is override order. */
  layers: z.array(IgChromeLayerSchema).min(1),
  tokens: z.array(IgChromeTokenSchema),
  rules: z.array(IgChromeRuleSchema),
  conflicts: z.array(IgChromeConflictSchema),
});

export type IgChrome = z.infer<typeof IgChromeSchema>;
export type IgChromeToken = z.infer<typeof IgChromeTokenSchema>;
export type IgChromeRule = z.infer<typeof IgChromeRuleSchema>;
export type IgChromeLayer = z.infer<typeof IgChromeLayerSchema>;
export type IgChromeConflict = z.infer<typeof IgChromeConflictSchema>;

/** One token by name, or `undefined`. The lookup written once. */
export function tokenOf(chrome: Pick<IgChrome, "tokens">, name: string): IgChromeToken | undefined {
  return chrome.tokens.find((t) => t.name === name);
}

/**
 * How many tokens each package actually won — the census a report should quote.
 *
 * Returned as a map rather than printed, because a count in prose is a claim
 * the next ingest falsifies. `directory-conventions` and `ylj7` have both
 * already paid for a number written into a sentence.
 */
export function tokensByPackage(chrome: Pick<IgChrome, "tokens">): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of chrome.tokens) out[t.from] = (out[t.from] ?? 0) + 1;
  return out;
}

/**
 * The stylesheet, emitted from the data.
 *
 * Scoped under `scope` rather than `:root` because these pages are OURS — a
 * bare `:root` block would repaint the whole folio site with WHO's palette on
 * any page that happened to load the file. The IG Publisher can use `:root`
 * because the document it builds is entirely the IG's; ours is not.
 *
 * A token named in `conflicts` is emitted with its winning value and a comment
 * naming the conflict, never dropped: dropping it would make our page differ
 * from the IG in a way no reader could see, which is worse than reproducing a
 * rule the upstream also gets wrong.
 */
export function chromeCss(chrome: IgChrome, scope: string): string {
  const conflicted = new Set(chrome.conflicts.map((c) => c.token));
  const decls = chrome.tokens.map((t) => {
    const note = conflicted.has(t.name) ? ` /* shape conflict — see chrome.json */` : "";
    return `  ${t.name}: ${t.value};${note}`;
  });
  const rules = chrome.rules.map(
    (r) =>
      `${scope} ${r.selector} {\n` +
      r.declarations.map((d) => `  ${d.property}: ${d.value};`).join("\n") +
      `\n}`,
  );
  return [`${scope} {\n${decls.join("\n")}\n}`, ...rules].join("\n\n") + "\n";
}

/** The filename an ingested chrome document is written under. */
export const CHROME_FILENAME = "chrome.json";

/**
 * Where a named instance's ingested chrome sits — **asked, not composed.**
 *
 * Resolved through the declaration (`directoriesForGraph`) rather than by
 * joining a path literal, which is the `ylj7` lesson from four days ago: a
 * hardcoded `join(root, "tools", "index.ts")` silently missed six Tool nodes,
 * and `check:declared-paths` refused it. A directory that moves must move for
 * every reader at once.
 *
 * ## Why the instance is NAMED rather than walked to
 *
 * The owner placed the chrome at `smart-base` so `smart-l1`, `smart-dak` and
 * `smart-ig` inherit it instead of each re-copying it. The obvious
 * implementation is to walk `needs` from the consumer upward — and it does not
 * work: `smart-trust` needs `smart-ig`, while `smart-base` needs
 * `fhir-harness`, so **there is no `needs` path from smart-trust to
 * smart-base.** Measured, not assumed, from the two declarations.
 *
 * That is a real gap in the stack's layering and it belongs to `nsbb`, which
 * already owns the question of how the IG pipeline layers. Resolving it here,
 * by inventing an edge or by widening the walk until something matched, would
 * settle a layering question inside a stylesheet loader. So the instance is
 * named, the reason is written down, and the gap stays visible.
 */
export function chromeFileFor(
  repoRoot: string,
  instanceName: string,
  deps: {
    instanceRootsIn: (repo: string) => string[];
    declarationNameOf: (root: string) => string | undefined;
    directoriesForGraph: (root: string, graph: string) => string[];
    exists: (p: string) => boolean;
    join: (...parts: string[]) => string;
  },
): string | undefined {
  for (const root of deps.instanceRootsIn(repoRoot)) {
    if (deps.declarationNameOf(root) !== instanceName) continue;
    for (const dir of deps.directoriesForGraph(root, "fhir-artifact-index")) {
      const p = deps.join(dir, CHROME_FILENAME);
      if (deps.exists(p)) return p;
    }
  }
  return undefined;
}
