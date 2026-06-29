---
layout: default
title: /devils-advocate-watcher
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/devils-advocate-watcher.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/devils-advocate-watcher.md) — do not edit here.

{% raw %}
# /devils-advocate-watcher

A concrete instance of [`integration-watcher`](integration-watcher.md).
The parent encodes the shared mechanics; this file fills the nine
domain-specific slots A–I. This watcher's job is **adversarial**: it
does not check style or wiring, it tries to *break* each block — to
surface the objection a referee will make before the referee does.

**Setup:** use `NAME=devils-advocate-watcher` everywhere the parent's §1
references `${NAME}`. Files at `.beans/devils-advocate-watcher-queue.json`
and `.beans/devils-advocate-watcher-ledger.md`.

**Standing authority.** This watcher is the operational arm of the
**Critical-distance license** (AGENTS.md §"Critical-distance license"):
agents have standing permission — and an affirmative duty when asked for
assessment — to challenge the project's claims on the merits, flag
suspected numerology / overfitting / hidden degrees of freedom /
post-hoc rationalization, and give outside-view reception forecasts
without softening. Read the project's *claims* adversarially; read the
author's *messages* charitably.

**Discipline guardrails (read before recording any durable finding).** A
devil's-advocate finding is an *adversarial hypothesis*, not a
corpus-status fact. Two AGENTS.md rules gate what may be written into a
durable artifact (sidecar `verdict`, audit doc, ledger, PR):

1. **(a)/(b) refutation-scope rule** (§"Before declaring 'refuted'").
   Every finding that asserts something is wrong/excluded carries a
   `scope`:
   - `scope: limited` — "this construction, *alone*, does not work as
     stated." The default. Constrains magnitudes/combinations, not
     ingredients.
   - `scope: structural` — "this cannot hold in any closure." Permitted
     **only** when a *proved invariant* forbids it (a parity/sign,
     dimension/degree/count bound, a formally-proved impossibility, an
     entropy/precision bound). **Must cite the invariant** in
     `evidence`. Without one, downgrade to `limited`.
2. **corpus-grep checklist** (§"Before declaring 'open'"). Before a
   finding asserts an item is *unresolved/open in the corpus*, run the
   four greps (`docs/audits/`, `content/`, `computations/`,
   `docs/coordination/`). A "this is an unproved gap" objection that the
   corpus already closes is a false finding — record it as `verdict:
   rebutted` with the closing artifact cited.

These guardrails are what separate a *useful* devil's advocate (finds
the real objection early) from a *noisy* one (cries wolf on settled
items). The adjudicator (Slot C) enforces both before a finding is
written `surviving`.

## Slot A — Goal statement

For every block `B` with statement `S(B)` and (optional) formal layer
`F(B)`, produce the **strongest surviving objection**

> `obj*(B) = argmax_{obj ∈ Objections(B)} survival(obj | rebuttal)`

where `Objections(B)` ranges over the finding taxonomy (Slot D) and
`survival` is the adjudicator's verdict after the block's own text,
formal layer, cited references, and the corpus-grep checklist are given
the chance to rebut. A block **passes** the devil's-advocate axis iff
its strongest objection is `rebutted` (the block's own materials defeat
it) — i.e. there is no surviving referee argument that `S(B)` is false,
vacuous, circular, overclaimed, or unsupported.

The deliverable per block is not "is it wrong" (we rarely *prove* wrong)
but **"here is exactly what a referee will argue, and here is whether
the block already answers it."** Surviving objections become queue items
+ author asks; rebutted objections are recorded so the next reviewer
(human or agent) does not re-litigate them.

This is the **review-tier-0 adversary**: it front-runs the Tier-1
`peer-review` and Tier-2 `academic-paper-reviewer` skills by predicting
their objections at the block granularity, with a durable sidecar so the
prediction is cached and hash-invalidated like every other QA axis.

## Slot B — §3 trigger filter

```bash
SHA=<event sha>
changed=$(git diff-tree --no-commit-id --name-only -r "$SHA")

is_da_event=false

# (i) Any provable / definitional / conjecture content block touched.
for f in $(echo "$changed" | grep -E 'content/.*\.(md|ts)$'); do
  ts="${f%.*}.ts"
  [ -f "$ts" ] && grep -qE '^export default (theorem|lemma|proposition|corollary|conjecture|definition|remark|example)\(' "$ts" \
    && is_da_event=true
done

# (ii) Any formal-layer sibling under a paper's formal tree.
echo "$changed" | grep -qE 'content/.*/(lean|formal)/.*\.(lean|v|thy)$' && is_da_event=true

# (iii) Any witness / derivation JSON that a block's number is pinned to
#       (the empirical-fragility + reproducibility lenses consume these).
echo "$changed" | grep -qE '\.witness\.json$|\.derivation\.json$' && is_da_event=true
```

For PR review-comment events, pass through if the comment body mentions
any referee-objection keyword: `wrong`, `false`, `counterexample`,
`circular`, `assumes`, `vacuous`, `trivial`, `overclaim`, `doesn't
follow`, `non sequitur`, `gap`, `fitted`, `overfit`, `numerology`,
`cherry`, `reproduce`, `unsupported`, `where does this come from`, `how
do you know`.

## Slot C — §4b dispatch table

Per changed block, launch the adversarial lenses **in parallel** (one
`Agent` each), then a single adjudicator after they return. Each lens is
prompted to *try to break the block* from its angle — it returns
findings, NOT a clean bill of health. The adjudicator is prompted to
*defend* the block and rule each objection `surviving | rebutted |
partial`.

| Lens (agent) | When to run | What it attacks | Primary taxonomy (Slot D) |
|--------------|-------------|-----------------|---------------------------|
| **L1 Formalist** | always | Logical structure: is `S(B)` actually entailed by its `uses[]`? missing lemma? quantifier slip? Does `F(B)` prove `S(B)` or something weaker/vacuous (`: True`, self-assuming projection, decision-procedure mask)? | `da-false-claim`, `da-non-sequitur`, `da-vacuous`, `da-formal-narrative-divergence` |
| **L2 Skeptical domain expert** | block states a numerical/empirical/domain claim, or `uses[]` touches a calibration / measured-quantity block | Numerology, overfitting, hidden degrees of freedom, an undisclosed swing the prose hides, unit/conservation errors, contradiction with a known measurement | `da-hidden-dof`, `da-overclaim`, `da-empirical-fragility`, `da-domain-implausibility`, `da-circular` |
| **L3 Structural / theory critic** | provable or definitional kind | Counterexample hunt; is the construction well-defined (the "unique X" without uniqueness)? domain/regime error? is a claim secretly about a different regime than it says? | `da-false-claim`, `da-definitional-ambiguity`, `da-overclaim` |
| **L4 Reproducibility / citation auditor** | block has `cites[]`, a `-- Ref:` in `F(B)`, or a pinned witness number | Does the cited reference actually contain the result? Is the witness reproducible, fresh (not stale), and does its number match the prose `≈`? | `da-citation-misuse`, `da-reproducibility`, `da-empirical-fragility` |
| **ADJ Adjudicator** | after L1–L4 | Defends the block: applies the block's own text + formal layer + the corpus-grep checklist + the (a)/(b) scope rule; rules each objection `surviving | rebutted | partial`; assigns the block `da-referee-verdict` | (verdict only) |

Dispatch rules (inherit parent §4b sidecar-aware dispatch):

- **Sidecar skip.** Before dispatching, read `<block>.qa.json`. If a
  `da-referee-verdict` entry exists with a `field_hash` matching the
  current `.md`/`.ts`/formal hashes → skip (already adjudicated at this
  content). Re-audit on hash drift or a prior `surviving` verdict.
- **Lens selection.** Always run L1. Run L2/L3/L4 only when their "When
  to run" column matches — most remark/prose blocks get L1+L3 only;
  empirical/measured blocks get all four.
- **One adversarial agent per lens per block** (parent §5m parallelism
  cap applies; default 4 in flight). The four lenses on one block are
  independent → batch them in a single response.
- Cap each lens report at ~350 words; the adjudicator at ~250.

**Adversarial-lens prompt skeleton** (every lens agent):

> You are a hostile but competent referee for a formal + domain
> manuscript. Your job is to find the strongest reason block `<label>`
> is WRONG from the `<lens>` angle — do not be charitable, do not
> summarize, do not approve. Read `<md>`, `<ts>`, `<formal>`. Return up
> to 3 objections, each: `{kind (da-*), scope (limited|structural),
> evidence (file:line + verbatim quote; for structural scope, the
> invariant that forbids it), referee_argument (1–3 sentences in the
> referee's voice)}`. If you cannot find a real objection from your
> angle after genuine effort, return `[]` — an empty list is an honest
> result, a fabricated objection is not.

**Adjudicator prompt skeleton:**

> You are defending block `<label>` against the attached referee
> objections. For each: (1) does the block's own text / formal layer /
> cited refs already answer it? (2) run the corpus-grep checklist if it
> claims an item is "open"; (3) enforce the (a)/(b) scope rule — a
> `structural` objection without a cited proved invariant is downgraded
> to `limited`. Rule each `surviving | rebutted | partial` with one
> sentence of reasoning + the rebutting artifact (if any). Then assign
> the block a `da-referee-verdict`: `clean` (all rebutted),
> `survivable-objection` (≥1 partial, none surviving), or
> `open-objection` (≥1 surviving). Be fair: a surviving objection must
> be one you genuinely could not rebut, not one you declined to.

## Slot D — §4c finding taxonomy (the `da-*` criteria family)

These are the sidecar criteria. Each block accrues one entry per
criterion that fired; the `da-referee-verdict` is the rollup.

| Criterion id | "Why a referee says it's wrong" |
|--------------|---------------------------------|
| `da-false-claim` | The stated proposition is false — a counterexample exists, a quantifier is wrong, or a special case fails. |
| `da-vacuous` | True but content-free: `: True := trivial`, a self-assuming projection (`:= ctx.claim`), a tautology (`x = x`), or a hypothesis so strong the conclusion is immediate. Proves nothing of interest. |
| `da-circular` | The derivation assumes its conclusion: the target value is back-fitted, a calibration is smuggled in, or `S(B)` is used (directly/transitively) in its own justification. |
| `da-overclaim` | Conclusion stronger than the argument supports: a scope-limited negative written as a structural exclusion, "derived" where it is "fitted", "proved" where it is "conditional", absolute where it is approximate. |
| `da-hidden-dof` | An undisclosed free parameter — an off-menu coefficient, a constant with no derivation-chain origin, a tuned exponent whose source is unstated (numerology). |
| `da-non-sequitur` | A logical gap: step B does not follow from step A; a "therefore" with a missing lemma; an induction whose step is unproved. |
| `da-formal-narrative-divergence` | `F(B)` proves something weaker than, different from, or vacuously implied by the `.md` claim `S(B)` (statement-integrity failure). |
| `da-citation-misuse` | A cited reference (`cites[]` or `-- Ref:`) does not contain the invoked result, is mis-attributed, or is used for a claim it does not make. |
| `da-definitional-ambiguity` | A key term is undefined, admits multiple incompatible readings, or names a construction not shown well-defined ("the unique X" without uniqueness; a regime left implicit). |
| `da-empirical-fragility` | A numerical match lives inside fit noise, relies on cherry-picked precision, hides a swing, or is stale against the current pinned input. |
| `da-domain-implausibility` | A domain claim an expert rejects: wrong units, a broken conservation/consistency law, or contradiction with an established measurement. |
| `da-reproducibility` | The compute/witness backing a number is irreproducible, stale (`scriptHash`/`scriptCommitSha` drift), or its value contradicts the prose `≈`. |
| `da-referee-verdict` | Rollup: `clean` / `survivable-objection` / `open-objection` + the strongest objection's one-line referee argument. |

### Sidecar schema (pre-adopted)

Each `da-*` entry is a standard `block-qa/v1` `QaCriterionEntry`
(`field_hash`, `result`, `severity`, `evidence`, `reviewer.kind =
"agent"`, `reviewed_at`, `reviewed_sha`) **plus** the da-axis extension
fields: `scope` (`limited`|`structural`), `ruling`
(`surviving`|`rebutted`|`partial`), `referee_argument`, `rebuttal`, and
— on the `da-referee-verdict` rollup only — `verdict`
(`clean`|`survivable-objection`|`open-objection`). `result` is derived
from `ruling`/`verdict` (surviving/open→`fail`, partial/survivable→`warn`,
rebutted/clean→`pass`); a `structural` scope requires a non-empty
`rebuttal` + `referee_argument` naming the proved invariant.

The producing types are owned by the folio-assistant platform's
`schemas/block-qa.ts`; the watcher emits the structured fields now so
the sidecars conform once the platform validator adopts them.

## Slot E — §4d discharge bands

| Band | Devil's-advocate shape | Action |
|------|------------------------|--------|
| **Auto-discharge** | The objection has a mechanical fix the watcher may apply without author judgement: a `da-vacuous` `: True` stub that should resolve to a real library decl; a `da-overclaim` durable "REFUTED" missing the (a)/(b) scope (re-scope to `limited`, cite the supporting note); a `da-citation-misuse` where the correct ref exists in `references.ts`; a `da-reproducibility` stale-witness refresh; a stale-`≈`-vs-`=` notation fix. Apply, re-run the relevant checker, commit. |
| **Author-assist** | The objection is *substantive* and needs the author's judgement: a `da-false-claim` / `da-non-sequitur` / `da-circular` that, if real, changes the math; a `da-hidden-dof` candidate undisclosed parameter; a `da-empirical-fragility` that questions a headline number; a `da-formal-narrative-divergence` requiring a re-statement. Open one author ask per stuck block (§4e) with the referee argument verbatim. |
| **Defer** | The objection is `rebutted` by the block's own materials or the corpus-grep checklist, OR is a known/acknowledged open item already tracked (a `conj:` kind, an acknowledged-stub, a documented gate blocker). Record `verdict: rebutted` (or `wontfix` with the tracking artifact) so it is not re-raised. |

**Critical do-not.** This watcher **never edits the math to make an
objection go away.** Auto-discharge is limited to scope/notation/
citation/witness *hygiene*; any change to a statement, a proof, or a
number is Author-assist. A devil's advocate that "fixes" the claim it
attacked has destroyed its own evidence.

## Slot F — §4e author-ask templates

```markdown
**devils-advocate ask — `<label>`** (from <source-pr-or-commit>)

- Objection (`<da-kind>`, severity <critical|major|minor>, scope <limited|structural>):
  <one sentence>
- Referee argument (verbatim, the voice the real referee will use):
  "<1–3 sentences>"
- File: <github blob URL to `.md`>  (formal: <blob URL> if relevant)
- Evidence: `<file:line>` — `<verbatim quote of the offending text>`
- Already attempted to rebut: <corpus-grep paths walked / formal layer checked / refs read> → <why it survived>
- Question: <numbered choice, e.g.:>
  1. The objection is real — restate/weaken the claim (I'll draft the edit).
  2. The objection is rebutted by <X> — point me at it and I'll record `rebutted`.
  3. Known open item — track as `conj:`/acknowledged-stub and move on.
```

Lead with the full context in chat (per parent §4e), then mirror a tight
`AskUserQuestion` (🟡 prefix, `multiSelect: true` per §0d). The referee
argument goes in the chat prose, not the structured option `description`
(math legibility, AGENTS.md §User accessibility).

## Slot G — §5a backlog discovery

The backlog is **every provable, definitional, and conjecture block in
the corpus that has no current `da-referee-verdict` entry**, plus every
block whose verdict is stale (hash drift) or `open-objection`.

```bash
# All blocks of an adversarially-auditable kind.
for ts in $(git ls-files 'content/**/*.ts'); do
  grep -qE '^export default (theorem|lemma|proposition|corollary|conjecture|definition)\(' "$ts" || continue
  qa="${ts%.ts}.qa.json"
  # Needs audit if no sidecar, no da-referee-verdict, stale hash, or open verdict.
  if [ ! -f "$qa" ] || ! grep -q '"da-referee-verdict"' "$qa"; then
    echo "AUDIT $ts"
  fi
done
```

Refresh discovery every 50 items (parent §5a cadence). Prefer the
content-pipeline TypeScript loader over grep when parsing `kind`.

**Mechanical pre-filters (cheap, corpus-wide).** Two stdlib checkers
sweep the recurring failure classes before the per-block lens fan-out,
so the expensive agent audits target what they surface. Both are
report-only (`--strict` to gate), agent-free, and do **not** write
`da-*` sidecars (they feed this backlog):

- **Witness hollowness:** a witness-hollowness audit — `null-dual`
  (a structured dual emitted with null values) + the high-recall
  `hollow-verification` (empty-`assertions` success claims).
- **Status-label overclaim:** a status-label-overclaim audit — a closure
  label (`proved`/`closed-form`/`no-fit`/`RESOLVED`/`gap-free`) over a
  non-closure signal (a formal-layer gap/`:True`/`:=trivial`,
  `validation:not_checked|stub`, `kind:conjecture`). The *sharp* subset
  (label over a vacuous formal layer) is the actionable backlog.

A block flagged by either checker jumps the §5b priority queue (a
mechanical signal of a likely surviving objection); the lens fan-out
then confirms or rebuts it per block.

## Slot H — §5b prioritisation

Rank the backlog by *blast radius × headline-proximity × novelty*:

1. **On the project's main derivation/argument chain.** Blocks on the
   central chain and the headline results first — these are what a
   referee attacks first and where a surviving objection is most
   damaging.
2. **Most downstream dependents** (via `uses[]`) — a false upstream
   claim poisons everything that uses it.
3. **Provable kinds before definitions before conjectures** — a
   `theorem` carries a truth claim a referee can falsify; a `conjecture`
   already admits it is unproved (lower adversarial yield).
4. **Never-audited before stale before previously-clean.**
5. Alphabetical tie-break.

High-yield seed targets are the project's load-bearing, most-attackable
claims — audit these first in any "full audit": the central result(s),
the calibration/parameter-fixing steps, any near-miss numerical match,
and the project's own discipline statement(s). A project can record its
concrete seed list in a side doc; this slot only fixes the ranking
heuristic.

## Slot I — §6 invariants (per-commit, on this watcher's own branch)

1. **No math edits in a finding commit.** A commit that records findings
   (sidecar entries, audit doc, ledger) must not also change a
   statement/proof/number. Hygiene auto-discharges (scope re-label,
   citation fix, witness refresh, `≈` fix) ride separate `chore`/`fix`
   commits, each naming the block + criterion.
2. **Every `surviving` finding carries its rebuttal attempt.** A sidecar
   entry with `verdict: surviving` must record, in `notes` or
   `evidence`, which rebuttal paths were tried (corpus-grep, formal
   layer, refs) and why they failed. A bare "surviving" with no
   attempted rebuttal is an audit flag (it may be a noisy false
   positive).
3. **(a)/(b) scope on every durable refutation** (§Discipline
   guardrails). No `structural`-scope finding without a cited proved
   invariant.
4. **corpus-grep before any "open/gap" finding** is written `surviving`.
5. **Verdict ≠ truth.** A `da-referee-verdict: open-objection` means "a
   referee argument survived rebuttal in this audit", **not** "the block
   is proven false." Phrase ledger/PR text accordingly (the objection is
   open, not the disproof closed).

## Running a "full audit" (multi-agent fan-out)

When the user asks for a *full* / *exhaustive* devil's-advocate audit
(e.g. "start full audit"), run the backlog sweep as a fan-out, not a
serial walk:

1. **Enumerate + prioritise** (Slots G, H). Produce the ranked block
   list; record the count and the seed targets in the ledger.
2. **Wave the fan-out.** Process in waves of N blocks (N = parent §5m
   parallelism cap, default 4). For each block in a wave, dispatch its
   L1–L4 lenses + adjudicator (Slot C). Within a wave the blocks are
   independent → one response, many `Agent` calls. Honor §0a item 2: if
   the owner has not consented to parallel agent dispatch, fall back to
   sequential foreground lenses (slower, same coverage).
3. **Persist per block.** Write the `da-*` + `da-referee-verdict`
   entries to each `<block>.qa.json` (reviewer.kind = "agent",
   agent_model, agent_date, agent_skill = `devils-advocate-watcher`).
4. **Commit per wave**, not per block — one `audit(devils-advocate):
   wave K — <chapter/scope>, M blocks, P open-objection` commit carrying
   that wave's sidecar writes + the audit-doc append.
5. **Audit doc.** Maintain
   `docs/audits/<date>-devils-advocate-<scope>.md`: one table row per
   block with `verdict`, the strongest objection, and its disposition.
   This is the human-readable face of the sweep; the sidecars are the
   machine-readable cache.
6. **Surviving objections → queue + asks.** Every `open-objection` block
   becomes a queue item (Slot D kind) and, in a foreground session, an
   Author-assist ask (Slot F). Rebutted objections stay in the sidecar
   only (no queue noise).
7. **Stop conditions.** The sweep is "done" for a scope when every block
   in it has a fresh `da-referee-verdict`. A full-corpus sweep is large;
   report progress per wave and let the user steer scope (one chapter,
   one chain, the headline results).

## Relationship to the existing watchers

This watcher is **orthogonal** to its siblings and deliberately
overlapping at the edges — the overlap is the point (a referee does not
respect axis boundaries):

| Sibling | They check | The adversary additionally asks |
|---------|-----------|----------------------------------|
| `proof-integration-watcher` | no bare gaps, no axiom growth, formal layer compiles | *is the thing it proves the thing it claims, and is the claim even true?* |
| `canonical-watcher` | no undisclosed parameters, no numerology (pattern-based) | *where exactly does this constant come from, and would a skeptic buy the derivation?* |
| `compute-integration-watcher` | every statement has a probe + consumer | *does the probe actually support the claim, or just co-vary with it?* |
| `one-voice-integration-watcher` | scholarly voice, AI-slop, fit | *strip the confident voice — does the argument still stand?* |
| `proof-narrative-lean-equivalence` | formal ≟ narrative (equivalence) | *if they diverge, which one is the overclaim?* |

Where a sibling already has a `pass` sidecar entry, the adversary may
*cite* it as a rebuttal — but a `pass` on `framework-canonical` does not
pre-rebut a `da-circular` objection; the axes ask different questions.
The adjudicator decides what counts as a rebuttal.

## Anti-patterns (devil's-advocate-specific)

- **Manufacturing objections.** An empty objection list from a lens is
  an honest result. Inventing a weak objection to look thorough pollutes
  the sidecar and trains the next reader to ignore it.
- **Crying wolf on settled items.** Recording `surviving` on an item the
  corpus already records as a documented gap, or on a `conj:` that
  openly admits it is unproved, without checking the coordination
  ledger. Run the corpus-grep first.
- **Structural overclaim by the adversary itself.** Writing a
  `structural`-scope refutation without a proved invariant — the same
  over-narrowing the (a)/(b) rule forbids in the corpus, now committed
  by the auditor. The adversary is held to the discipline it enforces.
- **Editing the math to win the argument.** See Slot I item 1 / Slot E
  "Critical do-not". Auto-discharge is hygiene only.
- **Treating a verdict as a disproof.** `open-objection` = "a referee
  argument is open", not "the block is false." Keep the modality.
{% endraw %}
