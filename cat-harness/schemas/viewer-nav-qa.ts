/**
 * The viewer-navbar audit — **what the owner's rule looks like as data**.
 *
 * Owner, 2026-09-23: *"common fixture unless explicty removed in harness
 * visualtion."* Two clauses, and the second is why this file exists. A page
 * with no rail is not automatically a defect — it may be one a visualisation
 * deliberately removed — and a checker that could not tell those apart would
 * either block a legitimate page or pass all of them.
 *
 * So the audit records a VERDICT PER PAGE rather than a count, and the count
 * is derived from the verdicts. A count alone is the `1xhc` shape: it cannot
 * say which page regressed, and "45 of 46" reads identically whether the
 * missing one is a deliberate removal or a generator nobody wired.
 *
 * ## A sidecar rather than a console report
 *
 * Same reason `kg:audit` writes one: a printed verdict is gone when the job
 * ends, which makes "unrailed since it was drawn" and "lost its rail in the
 * commit under review" indistinguishable. Committed, the diff says which.
 *
 * ## What this does NOT audit
 *
 * **Whether the rail's links resolve.** They cannot be checked from the source
 * tree and it is not close: `/who-iris/` and `/smart-trust/` are mount routes
 * `mount-instance-docs.ts` creates AFTER Jekyll, and `/bootstrap/initialization.html`
 * is a `.md` Jekyll renders. A resolver run against the committed tree calls
 * all three dead. `check:subgraphs` and the site-link tests own that question
 * against the built site; this one owns presence.
 *
 * @graphNode schema
 * @module schemas/viewer-nav-qa
 */
import { z } from "zod";

export const VIEWER_NAV_QA_SCHEMA = "viewer-nav-qa/v1";

/**
 * What a page's state is, and the three are NOT a severity scale.
 *
 * - `railed` — the fixture is on the page.
 * - `declined` — the page declares `<meta name="folio-navbar" content="none">`.
 *   A decision, recorded where a reader of the page can see it.
 * - `missing` — a standalone page with neither. The finding this exists for.
 *
 * There is no `could-not-determine`, and that is a claim rather than an
 * omission: every input is a file this repository committed, read as text, and
 * the three tests are total over it. A file that cannot be read is an error
 * from the audit, not a verdict about a page — the distinction
 * `instantiatedHarnesses` makes with `undefined`, for the same reason.
 */
export const ViewerNavVerdictSchema = z.enum(["railed", "declined", "missing"]);
export type ViewerNavVerdict = z.infer<typeof ViewerNavVerdictSchema>;

export const ViewerNavPageSchema = z.object({
  /** The page's published path, e.g. `/cat-harness/library/who-iris/`. */
  path: z.string().min(1),
  /** Repo-relative source, so a finding names a file somebody can open. */
  source: z.string().min(1),
  verdict: ViewerNavVerdictSchema,
  /**
   * Why, for anything other than `railed`.
   *
   * Required on `declined` and on `missing`, because both are states somebody
   * has to act on or accept, and a bare verdict makes the next reader
   * re-derive what this run already knew. Absent on `railed`: a page that
   * works owes no explanation.
   */
  reason: z.string().min(1).optional(),
});
export type ViewerNavPage = z.infer<typeof ViewerNavPageSchema>;

export const ViewerNavQaSchema = z.object({
  $schema: z.literal(VIEWER_NAV_QA_SCHEMA),
  /** The published docs root the audit walked, repo-relative. */
  root: z.string().min(1),
  totals: z.object({
    pages: z.number().int().nonnegative(),
    railed: z.number().int().nonnegative(),
    declined: z.number().int().nonnegative(),
    missing: z.number().int().nonnegative(),
  }),
  /** Every page, sorted by published path, so the diff is stable. */
  pages: z.array(ViewerNavPageSchema),
});
export type ViewerNavQa = z.infer<typeof ViewerNavQaSchema>;
