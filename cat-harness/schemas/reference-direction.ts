/**
 * reference-direction.ts — does this PROSE reference follow the dependency arrow?
 *
 * The owner's rule, 2026-09-23:
 *
 * > if sub1 depends (directly or through chain) stub0, no references/context
 * > etc points stub0 → sub1.
 *
 * If A depends on B, nothing in B may reference A. B is lower; it must not
 * know about what sits on top of it. `bootstrap-tools/schemas/graph.test.ts`
 * enforces exactly this for ONE instance (`bootstrap/`, bean `iwtn`). This
 * module is the same invariant over every declared instance.
 *
 * ## One arrow, two axes — this does NOT recompute direction
 *
 * An import and a sentence are the SAME arrow, so this module decides no part
 * of it. Direction is {@link directionOf} in `layer-direction.ts`, already
 * shared by `check:partition` (import edges between proposed repos) and
 * `kg-detangle` (KG edges between instances). This is its third consumer and
 * it asks the identical question of a NAME OCCURRENCE in a file.
 *
 * That is the whole point of absorbing `check:partition` into this rule
 * rather than writing a second checker: two computations of "does A depend on
 * B" are two answers free to drift, and `zlmp`'s history is what drift costs
 * — a count that ROSE from 43 to 49 because the measurement improved, which
 * is only legible because ONE tool owned the number.
 *
 * ## Four verdicts, because three of them are not "clean"
 *
 * `allowed`, `exempt`, `wrong-direction` and `undetermined` — mirroring
 * `layer-direction.ts` deliberately, so a reader who knows one knows both.
 *
 * `undetermined` is the load-bearing one and it carries `zlmp`'s discipline
 * verbatim: *"these are not cross-edges — they are edges this tool declined
 * to judge. Do not read them as clean."* Two distinct things land there, and
 * neither may be silently bucketed:
 *
 *   - an instance that declares no `needs` (absent is nobody-has-said, never
 *     "may reach nothing" and never "may reach anything"), which
 *     `allowedFromNeeds` already reports; and
 *   - a target whose name is ALSO the repository's name — see below, because
 *     it is 59 % of every occurrence in this repository and getting it wrong
 *     is the difference between a report somebody acts on and one they switch
 *     off on the first run.
 *
 * ## The repository-name rule, which is structural rather than a heuristic
 *
 * An instance rooted AT the repository root shares its name with the
 * repository. Here that is `folio-assistant`: the repository, the published
 * product, and the root instance all carry that string, and no name match can
 * tell the three apart. Worse, every relative path in the tree resolves inside
 * that instance's root, so even "does the reference resolve into its files?"
 * — the test that would settle any other instance — answers yes for all of
 * them.
 *
 * So the question is not hard, it is **undecidable by name**, and the honest
 * verdict is `undetermined` rather than a guess in either direction. Measured
 * 2026-09-23: 2,137 of 3,651 occurrences. Calling them violations would put a
 * four-figure backlog in front of a reader on day one; calling them clean
 * would assert something nothing checked.
 *
 * `sharesNameWithRepository` is passed IN rather than derived here, so this
 * module stays free of paths and its tests need no tree on disk.
 *
 * @module schemas/reference-direction
 * @graphNode none — a classification function: it defines no schema
 */

import { directionOf, type LayerRule } from "./layer-direction.js";

/**
 * An exception to the rule. `reason` is required and `iwtn`'s `ALLOW` is why:
 * a permit with no reason is a hole, and a list of bare regexes is a list
 * nobody can audit a year later.
 */
export interface ReferenceExemption {
  /** Matches the LINE the occurrence sits on. Omitted means any line, and then `file` must be set. */
  pattern?: RegExp;
  /** Matches the FILE the occurrence sits in, repo-relative. Omitted means any file. */
  file?: RegExp;
  /** Why this is not a reference to the instance. Required. */
  reason: string;
  /** Limit to one target instance; omitted means any. */
  to?: string;
}

/** One bounded occurrence of an instance's name in a file. */
export interface Occurrence {
  file: string;
  line: number;
  /** The whole line, which is what an exemption matches against. */
  text: string;
  /** The instance the FILE belongs to. */
  from: string;
  /** The instance whose NAME was found. */
  to: string;
}

export type ReferenceVerdict =
  | { verdict: "allowed"; basis: string }
  | { verdict: "exempt"; basis: string; exemption: ReferenceExemption }
  | { verdict: "wrong-direction"; basis: string }
  | { verdict: "undetermined"; basis: string };

/**
 * Every bounded occurrence of `name` in `text`, as 1-based line numbers.
 *
 * **Bounded, which is not a detail.** A name may be a prefix of another
 * instance's name — `folio-assistant` of `folio-assistant-core` — so a
 * substring scan counts one occurrence twice and attributes the second to an
 * instance that was never named. That is not hypothetical: the 2026-09-23
 * measurement that opened this work reported 6,778 occurrences by substring
 * where the bounded count is 3,651, and the inflation was entirely this.
 *
 * A character adjacent to the name that could continue an identifier
 * (`[A-Za-z0-9_-]`) therefore disqualifies the match.
 */
export function occurrencesOf(text: string, name: string): { line: number; text: string }[] {
  const re = new RegExp(
    `(?<![A-Za-z0-9_-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_-])`,
  );
  const out: { line: number; text: string }[] = [];
  text.split("\n").forEach((line, i) => {
    if (re.test(line)) out.push({ line: i + 1, text: line });
  });
  return out;
}

/**
 * Classify one occurrence.
 *
 * `sharesNameWithRepository` asks of the TARGET, not the source: an
 * occurrence is undecidable when the string found could be the repository's
 * own name. Checked BEFORE the direction rule, because an undecidable target
 * makes the direction question moot rather than answerable-then-excused —
 * which is also why it is `undetermined` and not an exemption.
 *
 * An exemption is consulted only for an occurrence the rule would refuse, so
 * one sitting on an allowed line is never "honoured". That is what lets a
 * caller report an exemption nothing needs as stale, exactly as
 * `layer-direction.ts` does with its permits.
 */
export function classifyReference(
  occ: Occurrence,
  rule: LayerRule,
  sharesNameWithRepository: (instance: string) => boolean,
  exemptions: readonly ReferenceExemption[] = [],
): ReferenceVerdict {
  if (sharesNameWithRepository(occ.to)) {
    return {
      verdict: "undetermined",
      basis: `'${occ.to}' is also the repository's name — a name match cannot tell the instance from the repository`,
    };
  }
  const d = directionOf({ from: occ.from, to: occ.to }, occ.from, occ.to, rule);
  if (d.verdict !== "wrong-direction") {
    // `permitted` is `layer-direction`'s word for an import permit, which
    // this axis does not issue; it cannot arise from a rule built by
    // `allowedFromNeeds`, and mapping it to `allowed` keeps the two verdict
    // sets aligned without inventing a fifth state.
    return d.verdict === "permitted"
      ? { verdict: "allowed", basis: d.basis }
      : (d as ReferenceVerdict);
  }
  const ex = exemptions.find(
    (e) =>
      (e.to === undefined || e.to === occ.to) &&
      (e.file === undefined || e.file.test(occ.file)) &&
      (e.pattern === undefined || e.pattern.test(occ.text)),
  );
  if (ex) return { verdict: "exempt", basis: `exempt: ${ex.reason}`, exemption: ex };
  return {
    verdict: "wrong-direction",
    basis: `'${occ.from}' is depended on by '${occ.to}', so it may not name it`,
  };
}
