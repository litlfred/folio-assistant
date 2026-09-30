---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Decision methodology selector'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/decision-methodology-selector.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/decision-methodology-selector.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/decision-methodology-selector.md){: .fa-edit-source }

{% raw %}
# Decision methodology selector

**Input**: a decision context — what is being decided, how many alternatives,
how many criteria, available data, time constraints, stakeholder count,
reversibility, uncertainty level.

**Output**: a ranked list of applicable methodologies, each with:
- the methodology name and its graph-node id
- why it fits this context (matched `applies-when`)
- why it does NOT fit the alternatives (matched `not-for`)
- complexity rating
- data requirements

## Relationship to methodology-adoption

[`methodology-adoption`](methodology-adoption.md) carries the **protocol** —
four questions asked in order, the first yes decides. This skill carries the
**implementation**: given that the protocol routes the decision to a category
(computable, evidence-grading, decision-record, decision-analysis), which
*specific* methodology in the graph serves that category best for this context?

**methodology-adoption names the lane; this skill names the runner.**

## Decision context schema

A decision context has these dimensions. Not all are required — an agent
provides what it knows and the selector grades against what is declared.

| dimension | type | when it matters |
|---|---|---|
| `questionType` | `"computable" \| "evidence-grading" \| "decision-record" \| "decision-analysis"` | Always — from methodology-adoption §"Choosing which applies" |
| `alternativeCount` | `number` | MCDM methods scale differently |
| `criteriaCount` | `number` | AHP pairwise comparisons grow as n² |
| `criteriaWeightsKnown` | `boolean` | Some methods derive weights, others require them |
| `dataType` | `"quantitative" \| "qualitative" \| "mixed"` | Aggregation methods need numbers |
| `stakeholderCount` | `number` | Group methods (Delphi, ANP) vs solo |
| `timeConstraint` | `"minutes" \| "hours" \| "days" \| "weeks"` | Eliminates complex methods |
| `reversibility` | `"reversible" \| "costly" \| "irreversible"` | Higher stakes → more rigorous method |
| `uncertainty` | `"low" \| "moderate" \| "high" \| "deep"` | Bayesian methods for deep uncertainty |
| `sequential` | `boolean` | True when decisions recur or adapt over time |

## Method families and when to use them

### 1. MCDM aggregation methods

**When**: multiple alternatives scored against multiple criteria, quantitative
data available, goal is a ranking.

Source: Wang & Rangaiah, "Multi-Criteria Decision-Making: Aggregation-Type
Methods" (arXiv:2509.06388).

| method | best for | avoid when | complexity |
|---|---|---|---|
| **SAW** (Simple Additive Weighting) | First pass, well-understood criteria, all benefit-type after normalisation | Criteria on incomparable scales without good normalisation | Low |
| **MEW** (Multiplicative Exponent Weighting) | Criteria with exponential importance differences | Any criterion value is zero (product collapses) | Low |
| **AHP** (Analytic Hierarchy Process) | Weights unknown, need stakeholder consensus on priorities | >9 criteria (pairwise comparisons explode: n(n-1)/2) | Medium |
| **ANP** (Analytic Network Process) | Criteria have interdependencies (feedback loops) | Simple independent criteria (overkill) | High |
| **COPRAS** | Benefit and cost criteria naturally separated | All criteria same direction | Medium |
| **MOORA** | Quick ranking with ratio normalisation | Need for weight derivation (requires pre-set weights) | Low |
| **FUCA** | Alternatives close in score, need tie-breaking | Very few alternatives (<3) | Medium |
| **WASPAS** | Combines SAW + MEW for robustness check | When SAW and MEW agree (no added value) | Medium |

### 2. Probabilistic / sequential decision methods

**When**: decisions recur, data arrives over time, exploration-exploitation
trade-off matters, experiments are costly.

Source: Kristiadi, "Introduction to the Analysis of Probabilistic
Decision-Making Algorithms" (arXiv:2508.21620).

| method | best for | avoid when | complexity |
|---|---|---|---|
| **Multi-armed bandits** (UCB, Thompson sampling) | Repeated choice among options with unknown payoffs | One-shot decisions | Medium |
| **Bayesian optimisation** | Expensive-to-evaluate black-box functions, few evaluations | Cheap evaluations (just try them all) | High |
| **Tree search** (MCTS) | Sequential decisions with branching outcomes | No natural tree structure | High |
| **Contextual bandits** | Payoff depends on observable context | Context is not available or not meaningful | Medium |

**Two caveats on the source, measured 2026-09-30.** The monograph's abstract
promises *"bandit algorithms, Bayesian optimization, and tree search
algorithms"*, but **v2 as ingested has no tree-search chapter** — its sections
run decision theory, concentration inequalities, frequentist bandits
(explore-then-exploit, UCB), Gaussian processes, and discrete then continuous
Bayesian optimisation. And **`contextual bandit` occurs nowhere in it.** So of
the four rows above, two are backed by the cited source and two are not.

### 3. Social / behavioral decision methods

**When**: multiple stakeholders, group consensus needed, behavioral biases
must be accounted for.

Source: Ravichandran, "Algorithmic Approaches to Sequential Decision-Making
and Social Epistemology" (arXiv:2607.20636) — **for `grit-aware evaluation`
only.** Checked against the ingested text 2026-09-30: `grit` occurs in 35 of
its sections; **`Delphi` occurs in none, and `nominal group` in none.** Those
two come from the group-consensus literature and are UNSOURCED here; the
attribution above covered all three rows until this was measured.

| method | best for | avoid when | complexity |
|---|---|---|---|
| **Delphi method** | Expert consensus without groupthink | Time pressure (<1 day) | Medium |
| **Nominal group technique** | Structured brainstorming → voting | >15 participants | Low |
| **Grit-aware evaluation** | Decisions requiring sustained investment | Reversible/low-stakes | Medium |

### 4. Classical decision methods — UNSOURCED

**When**: well-understood problem structure, textbook applicability.

**No source in this repository.** Nothing in `library/` covers cost-benefit
analysis, decision trees, game theory or expected utility, and no methodology
node renders any of them. The rows below are textbook recall, not adopted
method — see §"What this does NOT cover".

| method | best for | avoid when | complexity |
|---|---|---|---|
| **Cost-benefit analysis** | Monetisable outcomes, policy decisions | Non-quantifiable values | Low |
| **Decision trees** | Sequential binary/multi-way choices with probabilities | Too many branches (>50 leaves) | Medium |
| **Game theory / minimax** | Adversarial settings, zero-sum contexts | Cooperative settings | High |
| **Expected utility** | Single decision under known probability distributions | Deep uncertainty, unknown distributions | Low |

### 5. Hybrid / distance-based MCDM — UNSOURCED

**When**: reference-point comparison (ideal solution), outranking rather than
scoring.

**No source in this repository**, and the gap is a known one rather than an
oversight: the MCDM source ingested here is Chapter 8, *"selected
**aggregation-type**"* methods by its own abstract, so outranking (ELECTRE,
PROMETHEE) and distance-based (TOPSIS, VIKOR) are somebody else's chapter.
TOPSIS appears in that chapter only inside a reference title. The rows below
are textbook recall — see §"What this does NOT cover".

| method | best for | avoid when | complexity |
|---|---|---|---|
| **TOPSIS** | Ranking by distance to ideal/anti-ideal solution | Criteria weights uncertain (use AHP first) | Medium |
| **ELECTRE** | Partial ordering, incomparability is valid | Need a total ranking | High |
| **PROMETHEE** | Preference functions on each criterion | All criteria are simple linear | Medium |
| **VIKOR** | Compromise solution for conflicting criteria | Stakeholders refuse compromise | Medium |

## What this does NOT cover — bean `7e59`, measured 2026-09-30

The title of the bean that commissioned this skill claims it *"covers all
methodology families with when-to-use criteria"*. Checked against the three
sources now that they are in `library/`, that does not hold, and the honest
shape is:

| | methods | backed by an ingested source |
|---|---:|:--:|
| §1 MCDM aggregation | 8 | **yes** — `mcdm-aggregation` |
| §2 probabilistic | 4 | **2 of 4** — bandits and Bayesian optimisation |
| §3 social / behavioural | 3 | **1 of 3** — grit-aware evaluation |
| §4 classical | 4 | no |
| §5 distance-based / outranking | 4 | no |
| **total** | **23** | **11** |

**An unsourced row is not thereby wrong** — these are standard methods and the
guidance in them may be perfectly good. It means something narrower and worth
saying: nobody here has read a source for it, no methodology node renders it,
and `methodology-adoption`'s *"never adopt a method by naming it"* applies.

**The output schema already makes this structural, and that is the sharper
point.** `MethodologyRecommendationSchema` requires `methodologyId` — *"the
methodology's `name` from its front matter"* — so a recommendation must name a
node in the methodology graph. **No individual method above has one.** The
graph's nodes are families and adopted processes (`mcdm-aggregation`,
`probabilistic-decision-analysis`, `adequacy-for-purpose-modelling`,
`kepner-tregoe`, `dmn`, `swot`, `madr`, `raci`/`rasci`, …), so the tables in
this skill are at METHOD granularity while the declared output is at NODE
granularity.

Two consequences, and neither is cosmetic. A recommendation of "use TOPSIS" or
"run a Delphi" **cannot be expressed** in the output shape — there is no id to
put in `methodologyId`. And an implementation that emits one anyway is
inventing an id, which is how a consumer ends up resolving a methodology that
does not exist.

**Owner ruled 2026-09-30: FAMILY plus prose.** The selector returns a
methodology node that exists — `mcdm-aggregation`,
`probabilistic-decision-analysis`, `kepner-tregoe`, `dmn` and the rest — and
names the within-family method in `rationale`, as prose. The 23 rows above are
material for that prose. They are not a menu of returnable answers, and no
individual method gets a node.

Three things follow, and the third is the one to keep in view:

1. **`methodologyId` is always resolvable.** Every value the selector can emit
   is a node in the graph, so a consumer that follows the id finds a document.
2. **An unsourced row may still be named in prose**, and must be named as what
   it is. "Of the distance-based family, TOPSIS is the usual first reach —
   note that nothing in this repository's library covers it" is honest; "use
   TOPSIS" as a returned recommendation is not.
3. **A request that lands wholly outside the sourced families gets a refusal,
   not the nearest fit.** `SelectionResultSchema` already carries the field
   for it — the explanation for when no methodology fits. An agent asking for
   an outranking method is told none is adopted here.

**And these families are entirely absent, even as recall**: ambiguity and
robust decision-making (maximin under unknown distributions), real options,
voting rules and social choice beyond the thesis's cascades, multi-objective
optimisation proper (Pareto fronts rather than scalarisation), and
satisficing / bounded-rationality methods.

## Selection algorithm

```
function selectMethodology(context: DecisionContext): MethodologyRecommendation[] {
  // Step 1: Route via methodology-adoption protocol
  const lane = routeByQuestionType(context);
  
  // Step 2: Load methodology graph nodes
  const nodes = readMethodologyGraph();
  
  // Step 3: Classify each node against the context
  const classified = nodes.map(n => ({
    ...n,
    matchTier: classifyFit(n, context),  // primary | secondary | excluded
    rationale: explainFit(n, context)
  }));
  
  // Step 4: Return primary matches first, then secondary. Excluded are named
  // but NOT recommended — per methodology-adoption, refusals are stated.
  return classified.sort((a, b) =>
    tierOrder(a.matchTier) - tierOrder(b.matchTier)
  );
}
```

## Rules

1. **Never blend.** The output is one or more methods, each whole. A composite
   is a house method that §methodology-adoption forbids creating here.
2. **Name refusals.** Every recommended method comes with its `avoid when`,
   matched against the context. If a method's `avoid when` fires, say so rather
   than omitting silently.
3. **Cite the source.** Each recommendation names the paper or standard the
   method comes from.
4. **Report no-match.** If no methodology fits, that is the output — §"If none
   fits, that is a finding, not a licence."
5. **The graph is the catalogue.** Do not recommend methods not in the
   methodology graph. If a paper describes a method worth adopting, the output
   is a recommendation to ingest it via §methodology-adoption, not to use it
   directly.
{% endraw %}
