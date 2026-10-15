---
name: swarm-management
description: >
  Decide whether to run parallel agents at all, and if so how many, at which
  model level, against which decomposition. Read BEFORE dispatching more than
  one background agent — a swarm spends the author's tokens and the decision
  is theirs.
consulted: true
---

# Swarm management

A swarm is several agents working one goal in parallel. It is the most
expensive tool available and the easiest to reach for, so the first section is
about not using one.

## Ask first — always

**Never start a swarm without explicit permission for that swarm.** It costs
the author's tokens, and the cost is not obvious from the outside: a six-agent
fan-out against a large corpus can spend more in ten minutes than a day of
ordinary work.

Permission is **per swarm**, not standing. "Yes, swarm it" for one task does
not authorise the next one. When you ask, give the author the three numbers
they need to answer: **how many agents, at which model level, and roughly what
it will cost** relative to doing it serially.

**"Not standing" is the agent's constraint, not the owner's.** An agent may
never treat one permission as covering the next swarm. The *owner* may
nevertheless decide in advance that a session or a process run has this gate,
and that decision is theirs to make — it is the same person answering the same
question, earlier. That is a `swarm-spawn` **waiver**, and it is bounded on
exactly the three numbers you would otherwise have asked for: a grant for three
Haiku agents is not a grant for thirty Opus ones, and a scope that does not
plainly cover the swarm in front of you does not cover it.

Acting under one, name it in the turn report and quote its words — a waived
swarm is an announced swarm. And a waiver removes the **asking**, never the
sizing, the decomposition or the stopping condition below.
[`confirmation-waiver.md`](../../conduct/conduct-core/confirmation-waiver.md).


## First ask whether you need one

| situation | do this instead |
|---|---|
| The work is one file at a time | Serial. A swarm cannot make one edit faster. |
| The parts share state | Serial. Parallel writers to one file is a merge problem you are creating on purpose. |
| You have not decomposed it yet | **Decompose first.** A swarm against an undecomposed task produces N agents discovering the same thing. |
| Two or three independent parts | **Sub-beans, run sequentially.** Most "parallel" work is really "ordered work I have not ordered yet". |
| Many genuinely independent parts, each reading a different corpus slice | A swarm is justified — continue below. |

**The decomposition is the work.** If you cannot write down N independent
units with non-overlapping inputs and separate outputs, you do not have a swarm
shape; you have a task you have not understood yet.

## Sizing

| dimension | guidance |
|---|---|
| **size** | Start at 3. Go above 6 only when the corpus slices are genuinely disjoint and each unit is substantial. Beyond ~10 the coordination cost and the token cost both grow faster than the throughput. |
| **model level** | Match the *hardest* judgement in the unit, not the average. A sweep that only classifies runs small; anything making a call a human would argue with runs large. Mixed swarms are fine and usually right: small workers, one large reviewer. For tasks with uncertain difficulty, use dynamic temporal routing (§"Cost-aware dynamic routing") rather than statically over-allocating frontier models. |
| **CPU / concurrency** | Bounded by what the box can actually run. A swarm that thrashes is slower than half the swarm. If units shell out to a build or a solver, the real limit is that tool's parallelism, not the agent count. |
| **wall-clock** | Give each unit a bound. An unbounded unit in a swarm is an unbounded swarm. |

## Cost-aware dynamic routing (SWE-Router / 2607.00053v1)

A swarm's token consumption is dominated by model choice. Deploying frontier
models (e.g. Claude Opus, GPT-4) across every parallel agent creates an
unfavorable cost–capability trade-off: empirical analysis on SWE benchmarks
shows that only a minority of software engineering subtasks genuinely demand
frontier reasoning, while most admit localized, cheap resolution.

SWE-Router (*arXiv:2607.00053v1*, `library/arxiv-2607.00053v1`) provides the
principled framework for cost-aware routing in multi-turn agentic SE tasks,
demonstrating how to break the information-theoretic Bayes-error floor that
plagues static, prompt-only routers.

### The Bayes-error floor of prompt-only routing

Static routers that inspect only the task description $q$ (e.g. issue or
sub-bean description) inherit a high Bayes error: in software engineering, a
superficially simple issue description may require a multi-module architectural
refactoring, while an intimidating, complex stack trace may resolve with a
one-line typo fix. The prompt alone cannot distinguish between these cases.

In agentic systems, the disambiguating information is generated dynamically
during the agent's interaction loop (ReAct thoughts $z_t$, actions $a_t$, and
observations $o_t$). Early turns are predominantly exploratory—running grep,
inspecting directory structures, reading localized test failures. These
intermediate observations contain the structural signals of task difficulty
that no prompt-time classification can see.

### Value-based temporal routing policy

SWE-Router establishes a two-phase temporal routing policy:

1. **Exploration budget ($K$ steps)**:
   Assign the subtask initially to a lightweight, compact model $m_1$ (e.g.
   Claude Haiku, GPT-4o-mini, Qwen-Coder-7B). Run $m_1$ for a small exploration
   budget $K$ (empirically $K=3$ achieves optimal trade-offs).
2. **Trajectory evaluation via value head**:
   A value estimator $\hat{r}_1(T_{\le K, 1})$ inspects the partial trajectory
   $T_{\le K, 1} = [q, (z_1, a_1, o_1), \dots, (z_K, a_K, o_K)]$, evaluating
   whether $m_1$ has successfully localized the problem and is likely to solve it.
3. **Routing decision**:
   - **Continue with $m_1$**: If the predicted resolution probability exceeds a
     cost-adjusted threshold ($\hat{r}_1 \ge \lambda''$), let the cheap model
     complete the task.
   - **Escalate to frontier model $m_2$**: If $\hat{r}_1 < \lambda''$, escalate
     to the frontier model $m_2$.

### Clean escalation vs context poisoning

A critical structural finding in SWE-Router is the **clean escalation rule**:
when escalating to the frontier model $m_2$, **restart $m_2$ from the original
specification $q$** rather than continuing from $m_1$'s partial trajectory.
Conditioning a strong model on a weak model's flawed reasoning biases $m_2$
toward $m_1$'s false assumptions and hallucinated bug locations. The $K$ turns
of $m_1$ are treated as an up-front exploratory cost.

### Pareto frontier and swarm economics

Conditioning on partial trajectories provides a proven Bayes-optimality guarantee
(Theorem 4.1): partial-trajectory routing never harms expected utility compared
to prompt-only routing and is strictly superior whenever early exploration yields
informative observations.

Tuning the escalation threshold $\lambda''$ traces a cost–performance Pareto
curve:
- **High-economy regime ($\lambda'' \to 1$)**: High threshold for escalation;
  maximizes utilization of $m_1$, achieving 60–80% cost savings for tasks with
  straightforward localization and repetitive mechanics.
- **Matched-capability regime**: A balanced threshold captures 85–95% of
  pure-frontier performance while cutting overall token expenditure by 40–50%.
- **Synergistic resolution**: At specific operating points, routing achieves
  higher aggregate resolution than pure frontier execution because compact
  models occasionally explore non-obvious localized paths that large models
  overlook.

### When does a swarm need a frontier model?

Apply this matrix when assigning models across swarm sub-beans:

| Task characteristics | Trajectory signals ($T_{\le K}$) | Routing decision |
|---|---|---|
| Repetitive scaffolding, single-file edits, straightforward grep/tests | Clean reproduction in $\le K$ turns, clear localization | **Compact / lightweight worker ($m_1$)** |
| Ambiguous bug description, initially unknown scope | $m_1$ localizes exact file and passes reproducing test in $K$ steps | **Continue with $m_1$** |
| Multi-file architectural refactor, deep semantic reasoning | $m_1$ thrashes in search, fails to reproduce, or loops across modules | **Escalate cleanly to frontier model ($m_2$)** |
| High-stakes adjudication, cross-agent review, security invariant checks | N/A (inherently high-complexity judgement) | **Frontier model ($m_2$) from step 0** |

## Decomposition into sub-beans

One unit, one sub-bean, with:

- a **disjoint input slice** stated explicitly — which files, which blocks;
- a **separate output** — its own file, its own findings list, its own branch
  if it writes;
- the **parent bean** recorded, so the work rolls up.

This is what `bean-blocking.md` means by preferring sub-beans: the same
decomposition that avoids a spurious block is the one a swarm needs.

## While it runs

- **Do not block on the swarm.** The parent bean stays in progress; you report
  partial results as they land.
- **One writer per file.** Two agents editing one file is not parallelism.
- **Report the fan-out in the turn report** — how many, at what level, against
  which decomposition — so the author can see what their tokens bought.

## Stopping

Stop early when the first two units disagree about something structural: that
means the decomposition was wrong and the remaining N−2 will reproduce the
disagreement N−2 more times, at full price.

## Adaptive reasoning routing and Andon-cord stopping (TCAndon-Router / 2601.04544v1)

TCAndon-Router ([`arxiv-2601.04544v1`](../../../library/arxiv-2601.04544v1/README.md))
refines two critical assumptions in swarm execution: **uniform model allocation**
and **run-to-completion fan-out**.

### 1. Adaptive reasoning routing: difficulty-matched depth

Static model tiering ("all workers run small, one reviewer runs large") wastes tokens
on trivial slices and starves ambiguous ones. TCAR demonstrates that real tasks
partition into two distinct regimes:

| Query/task regime | Agent conflict ($|A_q|$) | Reasoning & model demand | Swarm strategy |
|---|---|---|---|
| **Consultation / extraction** (direct lookups, syntax transforms, single-file edits) | $|A_q| = 1$ | Low reasoning depth; small tier (`flash_lite` / `flash`) | Single worker suffices (win rate parity, 27.0% TCAR win over solo). Do not swarm. |
| **Troubleshooting / diagnosis** (cross-cutting bugs, multi-subsystem latency, root-cause analysis) | $|A_q| > 1$ (avg 1.37) | High reasoning depth (`<reason>` rationale); heavy tier (`pro` / `opus`) | Parallel subset of domain experts + downstream **Refining Agent** ($63.0\%$ win rate over solo). |

**Rules for adaptive routing in swarms:**
- **Reason before allocating:** Before spawning workers, evaluate the sub-task's domain boundaries and difficulty. Generate an explicit rationale for why a worker or model tier is needed.
- **Dynamic reasoning budget:** Do not assign fixed thinking budgets or uniform model tiers across the swarm. Allocate light models with shallow reasoning to deterministic checks and reserve deep reasoning / frontier models for units with genuine ambiguity.
- **Controlled candidate subset:** When sub-tasks have overlapping responsibilities, dispatch only the small relevant candidate subset (empirically 1 to 3 workers, average ~1.4), never an unconstrained fan-out.
- **Refining synthesis:** When multiple workers investigate overlapping root causes, route their partial answers to a designated Refining Agent (reviewer) that compares, deduplicates, and resolves contradictions into a single coherent verdict.

### 2. Andon-cord stopping: early termination on defect signals

In the Toyota Production System and TCAndon, an **Andon cord** allows any participant to halt the line immediately when an abnormality is detected, preventing defects from cascading downstream. In an LLM swarm, running an entire swarm to completion when the foundation is broken burns tokens at $N\times$ the rate of serial work.

**Pull the Andon cord (kill running subagents and halt the swarm) when:**
- **Structural divergence:** The first two completed units produce incompatible interfaces, conflicting schema assumptions, or contradictory interpretations of the brief.
- **Out-of-scope / missing prerequisites (TCAR `oos` signal):** An early worker discovers that required context, APIs, or files do not exist or are fundamentally underspecified. Stop the swarm immediately and clarify with the user rather than letting $N-1$ remaining agents hallucinate missing inputs.
- **Reasoning loop / drift:** An agent's reasoning log exhibits circular deliberation, repeated retries without progress, or mismatch between rationale and tool actions. Terminate that worker early rather than waiting for timeout.
- **Deadlock or shared state collision:** Multiple workers wait on interdependent outputs or attempt conflicting branch updates.

## Agentic SE literature synthesis & cross-paper methodology

For the comprehensive cross-cutting synthesis, epistemic partition (Measured vs. Recommended vs. Claimed), and bidirectional adversarial analysis across all five foundation papers (He et al., SWE-Debate, SWE-Router, TCAndon-Router, CodeAgent), see:
- [`methodologies/agentic-se-literature-synthesis.md`](../../../methodologies/agentic-se-literature-synthesis.md)

## Known gaps

This skill is **written ahead of the tooling**. There is no swarm runner in
this repo that enforces the sizing above, no per-unit wall-clock bound, and no
cost estimate to show the author when asking. `dispatch-agent.md` covers the
mechanics of dispatching background agents; this covers whether and how big.
Until the gap closes, the numbers here are guidance an agent applies by hand.
