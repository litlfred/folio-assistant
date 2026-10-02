/**
 * The block kinds, as a runtime value — in a leaf module so anything can
 * read it.
 *
 * This list used to live in `types.ts`, which is where its consumers
 * mostly are. But `types.ts` imports schemas from `constraints.ts` at
 * module scope, so `constraints.ts` could not import back without a
 * runtime cycle — and its `appliesTo` arrays are built during module
 * initialisation, exactly when a cycle leaves the import undefined.
 *
 * That is why `constraints.ts` spelled its kind lists out by hand, and
 * why several of them ended up narrower than the rule they gated: a
 * kind missing from `appliesTo` is skipped by `validate.ts` without a
 * word. This module imports nothing, so there is no longer a reason for
 * any list of kinds to be written out anywhere.
 *
 * `types.ts` re-exports `BLOCK_KINDS` and `BlockKind`, so existing
 * importers are unaffected, and keeps the compile-time proof that this
 * array and the `Block` union cover each other — that check needs the
 * union, which necessarily lives with the types.
 *
 * @module schemas/block-kinds
 * @graphNode schema
 */

/**
 * Every block kind, as a RUNTIME value.
 *
 * `Block` is a type and is erased at compile time, so anything that has
 * to recognise a block by reading its source — the QA pipeline's block
 * discovery, the propagation sweeps, the viewer registry, the constraint
 * table — needs a list it can actually iterate. Seven such lists existed,
 * hand-maintained and independent, and every one of them was short.
 *
 * The cost was silent. `readBlockManifest` returns `undefined` for an
 * unrecognised builder and `walkBlocks` skips whatever it returns
 * `undefined` for, so on the qou corpus 461 blocks — 445 `table`, 16
 * `algorithm` — were never yielded, never swept, and never audited.
 * Roughly 13% of the corpus, excluded by a stale regex rather than by
 * any decision.
 */
export const BLOCK_KINDS = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "algorithm",
  "conjecture",
  "example",
  "remark",
  "proof",
  "simulator",
  "prose",
  "equation",
  "diagram",
  "table",
  "figure",
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

/**
 * `BLOCK_KINDS` as a regex alternation, for the several places that
 * identify a block by scanning its `.ts` source for the builder call.
 *
 * Those call sites need different surrounding patterns — anchored vs
 * not, `export default` required or optional, followed by `(` or by
 * `({` — so they build their own regex around this rather than sharing
 * one. What they must NOT do is spell out the alternation, which is how
 * five of them came to list 13 of the 15 kinds.
 */
export const BLOCK_KIND_ALT = BLOCK_KINDS.join("|");

// ── Adapter scoping ──────────────────────────────────────────────

/**
 * The content adapters a folio can hold.
 *
 * `harness.config.json` already carries `contentType` and `adapter`, and the
 * platform ships `adapters/paper/`. This names the dimension so that block
 * kinds and QA criteria can be scoped to it instead of living in one global
 * pool.
 *
 * These are the BUILT-IN adapters only. `dak` was listed here until bean
 * `1335`; it is smart-base's now, contributed through
 * `ContributionRegistry` like any adapter a harness adds, and
 * `register` refuses a contribution that names a built-in one — which is what
 * made narrowing this list safe rather than a collision waiting to happen.
 * Where a criterion or a reader needs to name a contributed adapter, it uses
 * a plain string (`QaCriterionDefinition.adapters`), because a content type is
 * data and not an import.
 */
export const CONTENT_ADAPTERS = ["paper"] as const;
export type ContentAdapter = (typeof CONTENT_ADAPTERS)[number];

/**
 * The `paper` adapter's block kinds — the fifteen above.
 *
 * An alias rather than a second list: `BLOCK_KINDS` *is* the paper set, and
 * the compile-time exhaustiveness proof in `types.ts` pins it to the `Block`
 * union. Duplicating it here is precisely the drift this module exists to
 * prevent.
 */
export const PAPER_BLOCK_KINDS = BLOCK_KINDS;

// ── Content profiles ─────────────────────────────────────────────

/**
 * The **profiles** of the `paper` adapter's vocabulary.
 *
 * A profile is a *restriction* of one adapter's kind set, and is a different
 * axis from {@link CONTENT_ADAPTERS} — which is a disjoint partition of
 * namespaces. Getting those two confused is easy and costly, so the
 * distinction is worth stating plainly:
 *
 * | | adapter | profile |
 * |---|---|---|
 * | relation between members | disjoint | nested |
 * | a kind belongs to | exactly one | one or more |
 * | answers | "whose vocabulary is this word from?" | "may *this* folio use it?" |
 * | consumed by | QA criterion scoping ({@link adapterForKind}) | folio validation ({@link kindsOutsideProfile}) |
 *
 * `adapterForKind` therefore stays total and unambiguous: every kind below is
 * still a `paper` kind, and no QA criterion's scope changes because a profile
 * exists. A DAK kind is in no profile at all — it is a different adapter, not
 * a narrower paper.
 *
 * ## Why the split is where it is
 *
 * A *document* is the general case: policy guidance, a report, a standard, a
 * chapter of prose with tables and figures. A *paper* is that plus blocks
 * whose assertion is a formal mathematical claim, carried by a `.lean`
 * sibling. That is the whole difference — the tree of chapters and sections,
 * the `uses[]` editorial graph, QA sidecars, the HCI validation gate and the
 * publication pipeline are common to both, which is why they are one adapter
 * with two profiles rather than two adapters.
 *
 * The dividing line is machine-checkable at its sharpest point: `definition`
 * is the one kind whose `lean` field is **required** rather than optional
 * (`DefinitionBlock.lean: LeanRef` in `types.ts`), so a document folio cannot
 * contain one without failing schema validation. A test pins that, so the
 * partition cannot drift away from the type that motivates it.
 *
 * The theorem-like kinds join it for a reason that is editorial rather than
 * structural: their `lean` is optional, so a document *could* hold a
 * `theorem` with no formalization — but a theorem whose proof nothing checks
 * is the failure mode the paper profile exists to prevent, and offering the
 * kind in a folio with no Lean toolchain invites exactly that. `example`,
 * `remark`, `algorithm` and `proof`-free prose keep their optional `lean` and
 * stay in the document profile; a document folio simply never populates it,
 * which {@link DOCUMENT_FORBIDS_LEAN} states and validation enforces.
 */
export const CONTENT_PROFILES = ["document", "paper"] as const;
export type ContentProfile = (typeof CONTENT_PROFILES)[number];

// ── The third and fourth axes ────────────────────────────────────
//
// Issue #764 §1 tabulates THREE axes and warns that conflating any two is the
// defect; the owner then settled a fourth on 2026-09-22 (O1). All four are
// declared here, together, because the thing a reader most needs is to see
// that they ARE different questions:
//
//   adapter        whose vocabulary is this word from?      DISJOINT
//   profile        may THIS folio use that word?            NESTED
//   visualiser     how is it shown, and what can be done?   NOT HERE
//   interactivity  is the content static or interactive?    CROSS-CUTTING
//
// THREE OF THE FOUR LIVE HERE, and the fourth's absence is the point rather
// than an oversight. `VISUALISER_KINDS` is declared in `cat-harness.ts`,
// because the owner's sentence is *"folio is the only visualizer provided by
// CAT-HARNESS"* — a visualiser is something the HARNESS provides, while an
// adapter, a profile and an interactivity are facts about CONTENT.
//
// `check:partition` is what settled it: this module is folio-assist-core and
// `cat-harness.ts` is agentic-harness, so the harness may not import the
// content vocabulary. The first draft put all four here and the gate refused
// the edge. Reading the refusal as a classification error rather than an
// obstacle is what produced the better placement.
//
// `where-does-this-go` rows 6 and 7 exist because the middle two read as one
// question and are not. Splitting these four across four files would make
// that confusion cheaper rather than dearer.

/**
 * Is this content static, or does it carry interfaces?
 *
 * Owner, 2026-09-21: *"webpages not necc static contnet, content with
 * interfaces"*, and *"not a 'pure' distinction. judgement"*. Settled as a
 * FOURTH AXIS on 2026-09-22 (issue #764, O1).
 *
 * ## Why not a profile, which is what it looks like
 *
 * Profiles NEST and only ever narrow — `document` ⊃ `paper`, and
 * `profile-check.ts` rests on that. "A document plus interfaces" is a
 * WIDENING, so expressing it as a profile would mean breaking the invariant
 * every profile check is written against. It is not an adapter either:
 * adapters partition by VOCABULARY, and a webpage's words come from the same
 * vocabulary as a document's.
 *
 * ## `undetermined` is a VALUE, and that is the whole point
 *
 * The owner ruled in advance that the boundary is judgement. So the axis has
 * to be able to say **could not determine** — reported, never resolved to a
 * default — and a profile has nowhere to put that.
 *
 * It is a value rather than merely an absent field because ABSENT and
 * UNDETERMINED are different answers, the same distinction
 * {@link CatHarnessDeclaration.needs} already draws:
 *
 *   absent          nobody has said
 *   "undetermined"  somebody looked and could not decide
 *
 * Folding the second into the first loses exactly the fact the owner asked
 * to be kept. A consumer that treats either as `static` is reading a
 * could-not-determine as clean, which this repository forbids everywhere
 * else and forbids here for the same reason.
 */
export const CONTENT_INTERACTIVITY = ["static", "interactive", "undetermined"] as const;
export type ContentInteractivity = (typeof CONTENT_INTERACTIVITY)[number];


/**
 * The kinds whose assertion *is* a formal mathematical claim.
 *
 * Written out rather than derived, because the criterion ("the block asserts
 * mathematics") is a judgement about meaning that no field on the type
 * exposes. What *is* derived is its complement — see
 * {@link DOCUMENT_BLOCK_KINDS} — so the two can never overlap or leave a kind
 * unclassified, which is the failure a second hand-written list would invite.
 */
export const MATH_BLOCK_KINDS = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "conjecture",
  "proof",
] as const satisfies readonly BlockKind[];

export type MathBlockKind = (typeof MATH_BLOCK_KINDS)[number];

/**
 * Everything a document folio may contain: the paper vocabulary minus
 * {@link MATH_BLOCK_KINDS}.
 *
 * Derived, so a kind added to `BLOCK_KINDS` lands here automatically. That
 * default is the permissive one, which is the opposite of the choice made for
 * QA criterion scoping — deliberately. A criterion misfiring on a kind it was
 * never written for reads as a real finding and wastes a reviewer; a new kind
 * being *offerable* in a document folio at worst offers something nobody
 * wants, and the profile test names every member so the classification is
 * reviewed rather than inherited silently.
 */
export const DOCUMENT_BLOCK_KINDS = BLOCK_KINDS.filter(
  (k): k is Exclude<BlockKind, MathBlockKind> =>
    !(MATH_BLOCK_KINDS as readonly string[]).includes(k),
);

export type DocumentBlockKind = (typeof DOCUMENT_BLOCK_KINDS)[number];

/** Which kinds each profile admits. */
export const PROFILE_BLOCK_KINDS: Record<ContentProfile, readonly BlockKind[]> = {
  document: DOCUMENT_BLOCK_KINDS,
  paper: PAPER_BLOCK_KINDS,
};

/**
 * Whether a document folio may carry a `lean` field on a block at all.
 *
 * `false`, and stated as a named constant rather than left implicit, because
 * the kinds a document keeps (`example`, `remark`, `algorithm`, `simulator`)
 * still *declare* an optional `lean` — the type permits what the profile
 * forbids. Validation reads this; without it the rule would live only in
 * whichever checker happened to implement it.
 */
export const DOCUMENT_FORBIDS_LEAN = true;

/** Does `profile` admit blocks of `kind`? Unknown kinds are never admitted. */
export function profileAcceptsKind(profile: ContentProfile, kind: string): boolean {
  return (PROFILE_BLOCK_KINDS[profile] as readonly string[]).includes(kind);
}

/**
 * The kinds in `kinds` that `profile` does not admit, de-duplicated and in
 * the profile-independent order of `BLOCK_KINDS`.
 *
 * Returns unknown kinds too: a folio holding a kind no adapter recognises is
 * a finding whichever profile it declares, and swallowing it here is how it
 * would reach a renderer instead of a validator.
 */
export function kindsOutsideProfile(
  profile: ContentProfile,
  kinds: readonly string[],
): string[] {
  const seen = new Set(kinds.filter((k) => !profileAcceptsKind(profile, k)));
  const known = (BLOCK_KINDS as readonly string[]).filter((k) => seen.has(k));
  const unknown = [...seen].filter((k) => !(BLOCK_KINDS as readonly string[]).includes(k)).sort();
  return [...known, ...unknown];
}

/**
 * The profile a folio declares, from its `harness.config.json` `contentType`.
 *
 * `paper` is the fallback for an unrecognised or absent value, which is the
 * safe direction here and only here: the paper profile is the *wider* set, so
 * a misconfigured folio is never told a block it legitimately contains is
 * forbidden. The narrower default would reject real content on a typo.
 */
export function profileForContentType(contentType: string | undefined): ContentProfile {
  return contentType === "document" ? "document" : "paper";
}

// ── Every kind: built in, and contributed ────────────────────────
//
// The `dak` adapter's 21 kinds, their builder names and label prefixes, and
// the WHO DAK component tables were declared HERE until bean `1335`. They live
// in `smart-base/schemas/dak-kinds.ts` now and reach core by registration:
// smart-base's `contributions.ts` contributes the adapter and its kinds, and
// `loadContributions` hands them to a `ContributionRegistry`.
//
// So everything below answers for the BUILT-IN vocabulary — what core owns —
// and a question about "every kind, including contributed ones" is a runtime
// question asked of a registry. A runtime contribution cannot feed a
// compile-time union, which is why `AnyBlockKind` and `DakBlockKind` are gone
// rather than widened: the compile-time types narrow to what core owns.

/**
 * Every BUILT-IN kind. Contributed kinds are not here — ask the registry
 * (`ContributionRegistry.contributedKinds()`).
 *
 * The paper vocabulary today, because `paper` is the one built-in adapter.
 * Kept as its own name so a reader looking for "every kind core knows" finds
 * it, and so it widens without its callers changing if a second adapter is
 * ever built in again.
 */
export const ALL_BLOCK_KINDS = [...PAPER_BLOCK_KINDS] as const;

/** Which kinds belong to which BUILT-IN adapter. */
export const ADAPTER_BLOCK_KINDS: Record<ContentAdapter, readonly string[]> = {
  paper: PAPER_BLOCK_KINDS,
};

const KIND_TO_ADAPTER: ReadonlyMap<string, ContentAdapter> = new Map(
  CONTENT_ADAPTERS.flatMap((a) =>
    ADAPTER_BLOCK_KINDS[a].map((k) => [k, a] as [string, ContentAdapter]),
  ),
);

/**
 * The BUILT-IN adapter a block kind belongs to, or `undefined` for a kind core
 * does not own.
 *
 * `undefined` is deliberately not defaulted to `"paper"`. A criterion that
 * silently treats an unrecognised kind as a paper block is how a math axis
 * would come to run against a ValueSet — the caller must decide what an
 * unknown kind means rather than inherit a guess.
 *
 * A CONTRIBUTED kind is also `undefined` here. A caller holding a registry
 * asks `composedKindOwner(kind, registry, adapterForKind)` in
 * `schemas/contributions.ts`, which consults this first and the registry
 * second.
 */
export function adapterForKind(kind: string): ContentAdapter | undefined {
  return KIND_TO_ADAPTER.get(kind);
}

/**
 * Builder name → kind, for the BUILT-IN kinds.
 *
 * Paper kinds are single lowercase words, so builder name and kind string are
 * the same token. A contributed kind may differ — a DAK kind is multi-word
 * (`decision-table`), a hyphen is not a valid identifier, so its builder is
 * `decisionTable` — which is why a contribution carries its builder name and
 * this map is never derived by string munging.
 */
const BUILDER_TO_KIND: ReadonlyMap<string, string> = new Map(
  PAPER_BLOCK_KINDS.map((k) => [k, k] as [string, string]),
);

/** Is `builder` the name of a BUILT-IN kind's builder? */
export function isBuiltInBuilder(builder: string): boolean {
  return BUILDER_TO_KIND.has(builder);
}

/**
 * The block kind a builder name introduces, or `undefined` if it is not one.
 *
 * `contributed` maps a CONTRIBUTED builder to its kind —
 * `ContributionRegistry.contributedBuilders()`. Built-ins are consulted first,
 * so a contributed builder can never shadow one; `register` refuses that
 * collision outright as well.
 */
export function kindForBuilder(
  builder: string,
  contributed?: ReadonlyMap<string, string>,
): string | undefined {
  return BUILDER_TO_KIND.get(builder) ?? contributed?.get(builder);
}

/**
 * Builder names as a regex alternation, for the places that recognise a block
 * manifest by scanning its source. Longest first, so a longer builder is not
 * shadowed by a shorter prefix of it.
 *
 * `contributed` adds a registry's builders (the keys of
 * `ContributionRegistry.contributedBuilders()`); without it the alternation is
 * the built-in builders only, which is {@link ALL_BLOCK_BUILDER_ALT}.
 */
export function blockBuilderAlt(contributed?: Iterable<string>): string {
  return [...new Set([...BUILDER_TO_KIND.keys(), ...(contributed ?? [])])]
    .sort((a, b) => b.length - a.length)
    .join("|");
}

/** {@link blockBuilderAlt} over the BUILT-IN builders. */
export const ALL_BLOCK_BUILDER_ALT = blockBuilderAlt();
