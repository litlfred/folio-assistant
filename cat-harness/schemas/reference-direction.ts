/**
 * reference-direction.ts — does this PROSE reference follow the dependency arrow?
 *
 * The owner's rule, 2026-09-23:
 *
 * > if sub1 depends (directly or through chain) stub0, no references/context
 * > etc points stub0 → sub1.
 *
 * If A depends on B, nothing in B may reference A. B is lower; it must not
 * know about what sits on top of it. `schemas/graph.test.ts`
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
 * ## Five verdicts, because four of them are not "clean"
 *
 * `allowed`, `exempt`, `wrong-direction`, `names-repository` and
 * `undetermined` — the first four mirroring `layer-direction.ts`
 * deliberately, so a reader who knows one knows both, plus the one this axis
 * needs that the import axis cannot: a NAME can name a repository, an import
 * path cannot.
 *
 * `undetermined` is the load-bearing one and it carries `zlmp`'s discipline
 * verbatim: *"these are not cross-edges — they are edges this tool declined
 * to judge. Do not read them as clean."* Two distinct things land there, and
 * neither may be silently bucketed:
 *
 *   - an instance that declares no `needs` (absent is nobody-has-said, never
 *     "may reach nothing" and never "may reach anything"), which
 *     `allowedFromNeeds` already reports; and
 *   - a target whose name is ALSO the repository's name AND whose occurrence
 *     gives nothing to tell the two apart — see below, because the blanket
 *     version of this test was 78 % of every occurrence in this repository
 *     and getting it wrong is the difference between a report somebody acts
 *     on and one they switch off on the first run.
 *
 * ## The repository-name collision, and why it is no longer a blanket
 *
 * An instance rooted AT the repository root shares its name with the
 * repository. Here that is `folio-assistant`: the repository, the published
 * product, and the root instance all carry that string, so the STRING alone
 * cannot tell the three apart. Every relative path in the tree resolves
 * inside that instance's root too, so even "does the reference resolve into
 * its files?" — the test that would settle any other instance — answers yes
 * for all of them.
 *
 * Until 2026-09-29 the conclusion drawn from that was that the whole question
 * was undecidable, and every occurrence of a colliding name returned
 * `undetermined` in one move. Measured on main that day: **11,090 of 14,299
 * occurrences**, 78 % of everything the checker read. And it was measurably
 * wrong about nearly all of them, because the occurrence carries more than
 * the name. Of 13,160 word-bounded occurrences of `folio-assistant` under
 * `cat-harness/`, 11,419 sit inside an `http(s)` URL, 11,831 appear as the
 * path prefix `folio-assistant/`, 4,909 as `litlfred/folio-assistant` — and
 * **14** as a path into a directory the root instance actually declares. A
 * URL is an address and `<owner>/<name>` is a repository slug; the repository
 * is not a layer, so it owes no direction, and saying so is not a guess.
 *
 * Hence {@link NameCollision}, decided per OCCURRENCE rather than per name:
 *
 *   - `"instance"` — the occurrence points INTO a directory the colliding
 *     instance declares, so it is a reference to the instance and is judged
 *     by the arrow like any other, `wrong-direction` included;
 *   - `"repository"` — it names the repository or the product address, and
 *     {@link ReferenceVerdict}'s `names-repository` says exactly that;
 *   - `"unknown"` — a bare prose mention, with no path and no URL. **This is
 *     the honest residue and it stays `undetermined`.** It is not dead code
 *     and must not be optimised away: the ambiguity was real, it was just
 *     never 78 % of the corpus.
 *
 * The resolver is passed IN rather than derived here, so this module stays
 * free of paths and its tests need no tree on disk. Which occurrence shapes
 * map to which collision is the CALLER's question, because it is the caller
 * that read the declaration.
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
  /**
   * The string found names the REPOSITORY (or its published address), not the
   * instance that shares its name. A repository is not a layer, so no
   * direction is owed — which is a different statement from `allowed` (a
   * reference that follows the arrow), from `exempt` (a reference the arrow
   * refuses, excused) and from `undetermined` (a question declined). It gets
   * its own line in the report for that reason and is never folded into any
   * of the three.
   */
  | { verdict: "names-repository"; basis: string }
  | { verdict: "undetermined"; basis: string };

/**
 * What a target name colliding with the repository's name turned out to BE,
 * at one occurrence.
 *
 * Three values because there are three answers and collapsing any two loses
 * the distinction the collision was blocking. `undefined` from the resolver
 * is a fourth thing entirely — no collision at all — and not a member here,
 * so "the name does not collide" cannot be confused with "it collides and we
 * could not tell".
 */
export type NameCollision = "instance" | "repository" | "unknown";

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
 * `collision` asks about THIS OCCURRENCE of the target's name, not about the
 * name: `undefined` when the target's name does not collide with the
 * repository's, and otherwise which of the three things the occurrence turned
 * out to be ({@link NameCollision}).
 *
 * It is consulted BEFORE the direction rule for the two answers that make the
 * direction question moot rather than answerable-then-excused — which is also
 * why neither is an exemption. `"instance"` falls THROUGH, so a genuine
 * reference to an instance whose name collides is judged by the arrow like
 * every other: it can be `wrong-direction`, `allowed` or `exempt`. The blanket
 * that preceded this could reach none of those three.
 *
 * An exemption is consulted only for an occurrence the rule would refuse, so
 * one sitting on an allowed line is never "honoured". That is what lets a
 * caller report an exemption nothing needs as stale, exactly as
 * `layer-direction.ts` does with its permits.
 */
export function classifyReference(
  occ: Occurrence,
  rule: LayerRule,
  collision: (occ: Occurrence) => NameCollision | undefined,
  exemptions: readonly ReferenceExemption[] = [],
): ReferenceVerdict {
  const collides = collision(occ);
  if (collides === "repository") {
    return {
      verdict: "names-repository",
      basis: `the occurrence names the repository '${occ.to}' (or its published address) rather than the instance that shares its name, and a repository is not a layer, so no direction is owed`,
    };
  }
  if (collides === "unknown") {
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
