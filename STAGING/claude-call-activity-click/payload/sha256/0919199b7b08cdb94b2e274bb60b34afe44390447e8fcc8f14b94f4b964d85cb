---
name: devils-advocate-watcher
user_invocable: true
inherits: sdlc-core/integration-watcher
watch_arg: devils-advocate
description: >
  Logical devil's-advocate integration watcher — for every content
  block (.ts/.md) and formal sibling, constructs the strongest
  adversarial case that it is WRONG: the objection a hostile-but-
  competent referee would raise (false claim, vacuity, circularity,
  overclaim, hidden degree-of-freedom, logical non-sequitur,
  formal↔narrative divergence, citation misuse, definitional ambiguity,
  empirical fragility, domain implausibility, irreproducible compute).
  Fans out multiple adversarial-lens agents per block, then an
  adjudicator scores whether each objection survives rebuttal.
  Persists per-block <block>.qa.json entries under the `da-*` criteria
  family (reviewer.kind = "agent"). Operationalizes the standing
  Critical-distance red-team license (AGENTS.md). Inherits all shared
  mechanics (Monitor, subscriptions, queue, ledger, idle sweep,
  author-ask, watch-prepared-PRs, witness-drift recovery,
  billing-quick-fail flake) from `integration-watcher`.
allowed-tools: Read Edit Write Bash Grep Glob Agent Monitor Skill
uses-methodology:
  - consensus-grounded-subject-evaluation
---

# /devils-advocate-watcher

A concrete instance of [`integration-watcher`](../../sdlc/sdlc-core/integration-watcher.md).
The parent encodes the shared mechanics; this file fills the nine
domain-specific slots A–I. This watcher's job is **adversarial**: it
does not check style or wiring, it tries to *break* each block — to
surface the objection a referee will make before the referee does.

**Setup:** use `NAME=devils-advocate-watcher` everywhere the parent's §1
references `${NAME}`. Files at `beans/devils-advocate-watcher-queue.json`
and `beans/devils-advocate-watcher-ledger.md`.

**Standing authority.** This watcher is the operational arm of the
**Critical-distance license** (the folio's own `AGENTS.md`,
§"Critical-distance license"):
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
     **only** when a *proved invariant* forbids it (a bound, a
     conservation rule, a formally-proved impossibility, or whatever the
     content type counts as one). **Must cite the invariant** in
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

# The content type supplies two patterns: KINDS, its claim-bearing block
# kinds, and FORMAL, the path of its formal-layer siblings (empty when it
# has none), in its own devil's-advocate refinement skill.

# (i) Any claim-bearing content block touched.
for f in $(echo "$changed" | grep -E 'content/.*\.(md|ts)$'); do
  ts="${f%.*}.ts"
  [ -f "$ts" ] && grep -qE "^export default ($KINDS)\\(" "$ts" \
    && is_da_event=true
done

# (ii) Any formal-layer sibling.
[ -n "$FORMAL" ] && echo "$changed" | grep -qE "$FORMAL" && is_da_event=true

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
| **L1 Formalist** | always | Logical structure: is `S(B)` actually entailed by its `uses[]`? missing lemma? quantifier slip? Does `F(B)` establish `S(B)` or something weaker or vacuous (the content type lists its vacuity shapes)? | `da-false-claim`, `da-non-sequitur`, `da-vacuous`, `da-formal-narrative-divergence` |
| **L2 Skeptical domain expert** | block states a numerical/empirical/domain claim, or `uses[]` touches a calibration / measured-quantity block | Numerology, overfitting, hidden degrees of freedom, an undisclosed swing the prose hides, unit/conservation errors, contradiction with a known measurement | `da-hidden-dof`, `da-overclaim`, `da-empirical-fragility`, `da-domain-implausibility`, `da-circular` |
| **L3 Structural / theory critic** | provable or definitional kind | Counterexample hunt; is the construction well-defined (the "unique X" without uniqueness)? domain/regime error? is a claim secretly about a different regime than it says? | `da-false-claim`, `da-definitional-ambiguity`, `da-overclaim` |
| **L4 Reproducibility / citation auditor** | block has `cites[]`, a `-- Ref:` in `F(B)`, or a pinned witness number | Does the cited reference actually contain the result? Is the witness reproducible, fresh (not stale), and does its number match the prose `≈`? | `da-citation-misuse`, `da-reproducibility`, `da-empirical-fragility` |
| **ADJ Adjudicator** | after L1–L4 | Defends the block: applies the block's own text + formal layer + the corpus-grep checklist + the (a)/(b) scope rule; rules each objection `surviving | rebutted | partial`; assigns the block `da-referee-verdict` | (verdict only) |

Dispatch rules (inherit parent §4b sidecar-aware dispatch):

- **Sidecar skip.** Before dispatching, read `<block>.qa.json`. The skip rule
  honours **only** `clean-rebutted` and `survivable-objection` verdicts where
  the entry's `field_hash` matches current `.md`/`.ts`/formal hashes (and
  legacy `clean` for backward compatibility). A `no-objection-raised` verdict
  (where zero objections were raised by any lens) does **NOT** satisfy the
  sidecar skip; it represents the unknown state ("unattacked") rather than an
  attack that was defeated, so it must not make the absence of audit sticky.
  Re-audit on hash drift, a prior `open-objection` (`surviving`) verdict, or
  a prior `no-objection-raised` verdict.
- **Lens selection.** Always run L1. Run L2/L3/L4 only when their "When
  to run" column matches — most remark/prose blocks get L1+L3 only;
  empirical/measured blocks get all four.
- **One adversarial agent per lens per block** (parent §5m parallelism
  cap applies; default 4 in flight). The four lenses on one block are
  independent → batch them in a single response.
- **Lens independence and model provenance.** Agreement among lenses that
  share the same model family (e.g. all Opus or all DeepSeek) is much weaker
  corroboration than agreement across independent model families, because
  models of the same lineage share blind spots, training biases, and failure
  modes. As established in
  [`cat-harness/methodologies/consensus-grounded-subject-evaluation.md`](../../../methodologies/consensus-grounded-subject-evaluation.md),
  a genuine consensus requires independent evaluators, and same-family agreement
  is not independent corroboration. Every lens and referee entry should record
  `reviewer.agent_model` so model lineage is auditable.
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
> the block a `da-referee-verdict`: `clean-rebutted` (≥1 objection was
> raised and all rebutted with cited artifacts), `no-objection-raised`
> (zero objections were raised by any lens — not a clearance, does not
> satisfy the sidecar skip), `survivable-objection` (≥1 partial, none
> surviving), or `open-objection` (≥1 surviving). Be fair: a surviving
> objection must be one you genuinely could not rebut, not one you
> declined to.

## § Competitive multi-agent debate and structured adjudication (SWE-Debate / 2507.23348v1)

The single-pass fan-out across independent lenses (L1–L4 above) followed by a unilateral adjudicator ruling is the baseline operational mode. However, recent empirical findings in repository-level multi-agent reasoning — specifically **SWE-Debate** (Li et al., arXiv:2507.23348v1, "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution", 2025) — demonstrate that independent exploration and uncoordinated multi-agent systems suffer from a fundamental failure mode: **limited observation scope**.

When multiple candidate locations, definitions, or proof steps appear plausible, independent agents get stuck in local solutions, mistake downstream symptoms for root causes, and fail at disambiguation. Furthermore, purely collaborative consensus frameworks suffer from thought degeneration and premature convergence. SWE-Debate proves that **structured, competitive multi-agent debate** creates productive analytical tension that outperforms single-pass methods across localization accuracy (+14.67% over SWE-Agent with the same DeepSeek-V3 model, achieving 81.67% Acc@1(File)) and overall resolution (+6.7%).

This analysis directly refines the devil's-advocate watcher and the adjudication protocol across three dimensions:

### 1. Competitive Multi-Agent Debate vs Single Adversarial Pass

In a single adversarial pass, each lens agent (Formalist, Skeptic, Structural Critic, Auditor) inspects a block in isolation. When applied to complex dependency structures, this produces two characteristic error patterns:
- **False positives (symptom attack):** Analogous to the motivating Django-11999 case in SWE-Debate — where an isolated agent attacks `_get_FIELD_display` (a runtime symptom) rather than `Field.contribute_to_class` (the structural source) — an isolated L1 or L2 lens frequently attacks a downstream notation or lemma invocation, failing to recognize that the invariant is already enforced upstream in the `uses[]` closure.
- **False negatives (local plausibility masking):** An isolated lens may accept a locally consistent argument or definition that subtly smuggles in a circular dependency or unproved regime assumption across multiple files.

**Under structured competitive debate**, the lenses do not merely submit static finding lists. Instead, they engage in multi-round competition:
- **Diverse objection traces along dependency graphs:** Traversal of the block dependency graph (`uses[]`, definition references, lemma calls) produces multiple candidate objection paths. Following Finding 4 of SWE-Debate, traversal depth must be bounded at **depth $L \le 5$**; deeper chains introduce extraneous noise that distracts agents and degrades adjudication focus.
- **Cross-agent critique & argumentative pressure:** In Round 2, lenses defending competing objection hypotheses (e.g. L1 arguing logical non-sequitur vs L2 arguing hidden degree of freedom) must defend their own claims while directly critiquing rival analyses (`DebateCritiqueSchema`). This competitive pressure forces agents to justify assumptions against adversarial scrutiny, exposing vacuous objections and sharpening surviving referee arguments.

### 2. When to Elevate to Structured Debate

A single-pass fan-out remains appropriate for standard remarks, simple examples, and routine maintenance blocks. The watcher elevates to a structured **3-round competitive debate** under three explicit trigger conditions:
1. **High blast radius & headline proximity (Slot H items 1 & 2):** Any block on the manuscript's central derivation chain, headline results, or global calibration parameters.
2. **Multi-lens contention / divergent rulings:** When independent lenses produce conflicting assessments (e.g., L1 flags `da-false-claim` while L3 assesses the construction as well-defined, or L2 flags `da-empirical-fragility` on a number L4 considers reproducible).
3. **Multi-hop dependency ambiguity:** When a defect could stem from the immediate block statement or any of its transitive `uses[]` dependencies within depth $L \le 5$.

### 3. Formalizing Debate Rounds in the Adjudication Protocol

The adjudication protocol formalizes the 3-round structure before the referee verdict, codified by the content core (the instance above this harness that owns the adjudication schema) as `AdjudicationDebateSchema`:
- **Round 1 — Objection Hypothesis Proposal & Competitive Ranking:** Specialized adversarial agents propose candidate objection chains along the dependency graph. The pool is ranked by relevance and distinctness, pruning duplicate or superficial quibbles.
- **Round 2 — Competitive Strategy Refinement & Cross-Agent Critique:** Agents formulate concrete, step-by-step referee arguments and review rival proposals. Each agent defends its objection against counter-arguments and identifies flaws in competing hypotheses, recording explicit critiques (`targetAgent`, `point`, `severity`).
- **Round 3 — Synthesis & Discriminator Adjudication:** The Adjudicator acts as the lead discriminator (Prompt 8 in SWE-Debate). Rather than taking an unweighted vote or averaging confidence scores, the adjudicator evaluates technical merit across the competing arguments, explicitly documents `resolved_conflicts`, and synthesizes a definitive, actionable `da-referee-verdict` (`clean`, `survivable-objection`, `open-objection`).

The resulting debate record is embedded directly within `AdjudicationOutcomeSchema.debate`, providing full auditable provenance for how argumentative tension was resolved before the final sidecar entry was committed.

## Slot D — §4c finding taxonomy (the `da-*` criteria family)

These are the sidecar criteria. Each block accrues one entry per
criterion that fired; the `da-referee-verdict` is the rollup.

| Criterion id | "Why a referee says it's wrong" |
|--------------|---------------------------------|
| `da-false-claim` | The stated proposition is false — a counterexample exists, a quantifier is wrong, or a special case fails. |
| `da-vacuous` | True but content-free: a formal layer that states nothing (the content type lists the shapes), a self-assuming projection, a tautology (`x = x`), or a hypothesis so strong the conclusion is immediate. Proves nothing of interest. |
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
| `da-referee-verdict` | Rollup: `clean-rebutted` / `no-objection-raised` / `survivable-objection` / `open-objection` (`clean` retained as legacy synonym) + the strongest objection's one-line referee argument. |

### Sidecar schema (pre-adopted)

Each `da-*` entry is a standard `block-qa/v1` `QaCriterionEntry`
(`field_hash`, `result`, `severity`, `evidence`, `reviewer.kind =
"agent"`, `reviewed_at`, `reviewed_sha`) **plus** the da-axis extension
fields: `scope` (`limited`|`structural`), `ruling`
(`surviving`|`rebutted`|`partial`), `referee_argument`, `rebuttal`, and
— on the `da-referee-verdict` rollup only — `verdict`
(`clean-rebutted`|`no-objection-raised`|`clean`|`survivable-objection`|`open-objection`). `result` is derived
from `ruling`/`verdict` (surviving/open→`fail`, partial/survivable→`warn`,
rebutted/clean/clean-rebutted→`pass`); a `structural` scope requires a non-empty
`rebuttal` + `referee_argument` naming the proved invariant.

### Rollup evaluation and independence

The `da-referee-verdict` aggregates objections across all activated lenses:
- `clean-rebutted`: ≥1 objection was raised by the adversarial lenses, and every one was rebutted with cited artifacts.
- `no-objection-raised`: Zero objections were raised across all lenses. This is an unattacked/unverified state, not a clearance, and does NOT qualify for the sidecar skip.
- `survivable-objection`: ≥1 partial objection survived, but none fully surviving (`warn`).
- `open-objection`: ≥1 objection survived rebuttal (`fail`).

When multiple lenses agree that no objection exists or agree on an evaluation, note that **same-family agreement is not corroboration**. Per [`cat-harness/methodologies/consensus-grounded-subject-evaluation.md`](../../../methodologies/consensus-grounded-subject-evaluation.md), consensus must be grounded in independent judges, disagreement must be retained rather than smoothed over, and unanimous agreement among copies of the same model family provides weak epistemic backing.

The producing types are owned by the folio-assistant platform's
`schemas/sdlc/block-qa.ts`; the watcher emits the structured fields now so
the sidecars conform once the platform validator adopts them.

## Slot E — §4d discharge bands

| Band | Devil's-advocate shape | Action |
|------|------------------------|--------|
| **Auto-discharge** | The objection has a mechanical fix the watcher may apply without author judgement: a `da-vacuous` formal stub that should resolve to a real library declaration; a `da-overclaim` durable "REFUTED" missing the (a)/(b) scope (re-scope to `limited`, cite the supporting note); a `da-citation-misuse` where the correct ref exists in `references.ts`; a `da-reproducibility` stale-witness refresh; a stale-`≈`-vs-`=` notation fix. Apply, re-run the relevant checker, commit. |
| **Author-assist** | The objection is *substantive* and needs the author's judgement: a `da-false-claim` / `da-non-sequitur` / `da-circular` that, if real, changes the claim; a `da-hidden-dof` candidate undisclosed parameter; a `da-empirical-fragility` that questions a headline number; a `da-formal-narrative-divergence` requiring a re-statement. Open one author ask per stuck block (§4e) with the referee argument verbatim. |
| **Defer** | The objection is `rebutted` by the block's own materials or the corpus-grep checklist, OR is a known/acknowledged open item already tracked (an admitted-open kind such as a paper's `conj:`, an acknowledged-stub, a documented gate blocker). Record `verdict: rebutted` (or `wontfix` with the tracking artifact) so it is not re-raised. |

**Critical do-not.** This watcher **never edits the claim to make an
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
(legibility, AGENTS.md §User accessibility).

## Slot G — §5a backlog discovery

The backlog is **every claim-bearing block in the corpus (the content
type's `KINDS`, Slot B) that has no current `da-referee-verdict` entry**, plus every
block whose verdict is stale (hash drift) or `open-objection`.

```bash
# All blocks of an adversarially-auditable kind.
for ts in $(git ls-files 'content/**/*.ts'); do
  grep -qE "^export default ($KINDS)\\(" "$ts" || continue
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
  non-closure signal (a formal-layer gap or vacuity shape,
  `validation:not_checked|stub`, a kind that admits being open). The *sharp* subset
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
3. **Claims before definitions before admitted-open kinds** — a claim
   a referee can falsify comes first; a kind that already admits it is
   unproved comes last (lower adversarial yield).
4. **Never-audited before stale or no-objection-raised before previously-clean-rebutted.**
5. Alphabetical tie-break.

High-yield seed targets are the project's load-bearing, most-attackable
claims — audit these first in any "full audit": the central result(s),
the calibration/parameter-fixing steps, any near-miss numerical match,
and the project's own discipline statement(s). A project can record its
concrete seed list in a side doc; this slot only fixes the ranking
heuristic.

## Slot I — §6 invariants (per-commit, on this watcher's own branch)

1. **No content edits in a finding commit.** A commit that records findings
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
| `canonical-watcher` | no undisclosed parameters, no numerology (pattern-based) | *where exactly does this constant come from, and would a skeptic buy the derivation?* |
| `one-voice-integration-watcher` | scholarly voice, AI-slop, fit | *strip the confident voice — does the argument still stand?* |

A content type adds rows for its own watchers in its devil's-advocate
refinement skill.

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
- **Editing the claim to win the argument.** See Slot I item 1 / Slot E
  "Critical do-not". Auto-discharge is hygiene only.
- **Treating a verdict as a disproof.** `open-objection` = "a referee
  argument is open", not "the block is false." Keep the modality.
