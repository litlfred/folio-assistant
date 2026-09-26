---
layout: default
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

### 3. Social / behavioral decision methods

**When**: multiple stakeholders, group consensus needed, behavioral biases
must be accounted for.

Source: Ravichandran, "Algorithmic Approaches to Sequential Decision-Making
and Social Epistemology" (arXiv:2607.20636).

| method | best for | avoid when | complexity |
|---|---|---|---|
| **Delphi method** | Expert consensus without groupthink | Time pressure (<1 day) | Medium |
| **Nominal group technique** | Structured brainstorming → voting | >15 participants | Low |
| **Grit-aware evaluation** | Decisions requiring sustained investment | Reversible/low-stakes | Medium |

### 4. Classical decision methods

**When**: well-understood problem structure, textbook applicability.

| method | best for | avoid when | complexity |
|---|---|---|---|
| **Cost-benefit analysis** | Monetisable outcomes, policy decisions | Non-quantifiable values | Low |
| **Decision trees** | Sequential binary/multi-way choices with probabilities | Too many branches (>50 leaves) | Medium |
| **Game theory / minimax** | Adversarial settings, zero-sum contexts | Cooperative settings | High |
| **Expected utility** | Single decision under known probability distributions | Deep uncertainty, unknown distributions | Low |

### 5. Hybrid / distance-based MCDM

**When**: reference-point comparison (ideal solution), outranking rather than
scoring.

| method | best for | avoid when | complexity |
|---|---|---|---|
| **TOPSIS** | Ranking by distance to ideal/anti-ideal solution | Criteria weights uncertain (use AHP first) | Medium |
| **ELECTRE** | Partial ordering, incomparability is valid | Need a total ranking | High |
| **PROMETHEE** | Preference functions on each criterion | All criteria are simple linear | Medium |
| **VIKOR** | Compromise solution for conflicting criteria | Stakeholders refuse compromise | Medium |

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
