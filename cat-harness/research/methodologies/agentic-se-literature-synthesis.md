---
$schema: folio-methodology/v1
name: agentic-se-literature-synthesis
title: Agentic Software Engineering Literature Synthesis — Cross-Paper Synthesis and Bidirectional Adversarial Analysis
origin: >
  Systematic cross-paper synthesis and bidirectional adversarial critique across five foundational
  agentic software engineering works ingested under epic folio-assistant-0ipy:
  (1) Junda He, Christoph Treude, and David Lo, "LLM-Based Multi-Agent Systems for Software
  Engineering: Literature Review, Vision and the Road Ahead" (arXiv:2404.04834v4, 2025);
  (2) Zefang Li et al., "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
  (arXiv:2507.23348v1, 2025);
  (3) Yang Ding et al., "SWE-Router: Cost-Aware Temporal Routing for Multi-Turn Agentic Software
  Engineering" (arXiv:2607.00053v1, 2026);
  (4) Tang et al., "TCAndon-Router: Dynamic Agent Selection and Andon-Cord Stopping for Multi-Agent
  Troubleshooting" (arXiv:2601.04544v1, 2026);
  (5) Xunzhu Tang et al., "CodeAgent: Enhancing Code Generation with Tool-Integrated Agent Systems"
  (arXiv:2402.02172v5, 2024).
evidence:
  - library/arxiv-2404.04834v4
  - library/arxiv-2507.23348v1
  - library/arxiv-2607.00053v1
  - library/arxiv-2601.04544v1
  - library/arxiv-2402.02172v5
applies-when: >
  **Architecting, auditing, or optimizing agentic software engineering workflows, swarm management,
  cost-aware model routing, pre-merge verification gates, and adversarial code reviews.**
  Use this methodology when determining: (1) whether to route tasks statically or dynamically based
  on partial execution trajectories; (2) when to deploy competitive multi-agent debate versus serial
  or single-agent analysis; (3) how to enforce the boundary between deterministic compilation gates
  and stochastic agentic reviews; and (4) how to prevent runaway token costs and zombie agent executions
  using explicit Andon-cord predicates. Not applicable for single-prompt code completion without
  tool integration or multi-turn execution loops.
---

# Agentic Software Engineering Literature Synthesis — Cross-Paper Synthesis and Bidirectional Adversarial Analysis

**Ingested & Synthesized under Epic `folio-assistant-0ipy` (Leaf Work item `folio-assistant-9k2i`).**
This node synthesizes the empirical evidence, architectural patterns, and failure modes across five
landmark papers in agentic software engineering (SE), spanning multi-agent SDLC taxonomies, competitive
debate adjudication, cost-aware temporal routing, adaptive swarm selection with early termination, and
tool-integrated pre-merge code review.

It maintains a strict epistemological separation between **Measured** empirical findings, **Recommended**
operational heuristics, and **Claimed** unverified hypotheses, followed by a **bidirectional adversarial
pass** that attacks both the literature's foundational assumptions and this platform's own 69 BPMN/DMN
processes.

---

## 1. Cross-Cutting Landscape: The Five Pillars of Agentic SE

The five ingested papers address complementary failure modes across the multi-agent software engineering lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE FIVE AGENTIC SE PILLARS                                             │
├──────────────────────────┬──────────────────────────────────────────┬───────────────────────────────────┤
│ Paper & Citation         │ Primary Problem Addressed                │ Core Mechanism Proposed           │
├──────────────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ 1. He et al. (2025)      │ Ad-hoc agent coordination & unmapped     │ 6-phase SDLC taxonomy, team       │
│    arXiv:2404.04834v4    │ lifecycle coverage across SE phases      │ topologies, state-degeneration    │
│    (Bean 8107)           │                                          │ case studies (Snake vs. Tetris)   │
├──────────────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ 2. SWE-Debate (2025)     │ "Limited observation scope" in bug       │ Graph-guided fault propagation    │
│    arXiv:2507.23348v1    │ localization; consensus thought collapse │ traces ($L \le 5$) + competitive  │
│    (Bean o57z)           │ into superficial symptom patches         │ 3-round multi-agent debate        │
├──────────────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ 3. SWE-Router (2026)     │ Prompt-time Bayes-error floor; runaway   │ Value-based temporal routing      │
│    arXiv:2607.00053v1    │ frontier model token expenditure         │ on $K=3$ trajectories; clean      │
│    (Bean p1sk)           │ across routine multi-turn repairs        │ escalation restart rule           │
├──────────────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ 4. TCAndon-Router (2026) │ Uniform swarm over-allocation; zombie    │ Difficulty-partitioned routing    │
│    arXiv:2601.04544v1    │ token drain in unconstrained fan-out     │ ($|A_q|=1$ vs $|A_q|>1$) + Andon- │
│    (Bean ptdp)           │ runs on out-of-scope defects             │ cord early defect termination     │
├──────────────────────────┼──────────────────────────────────────────┼───────────────────────────────────┤
│ 5. CodeAgent (2024)      │ Uncalibrated LLM code review; runaway    │ 4-phase communicative review +    │
│    arXiv:2402.02172v5    │ dialogue drift; formatting token waste   │ supervisory QA-Checker loops with │
│    (Bean gs0u)           │                                          │ iterative adjustment instructions │
└──────────────────────────┴──────────────────────────────────────────┴───────────────────────────────────┘
```

### Synthesis Across the Operational Lifecycle

1. **Task Ingestion & Routing (SWE-Router + TCAndon-Router)**:
   Tasks enter through an adaptive gate. Rather than deciding statically at prompt-time whether a task is
   "hard" or "easy" (which suffers from a high Bayes error floor), the system executes a bounded exploration
   phase ($K=3$ turns with a lightweight model, or single-agent extraction for $|A_q|=1$). If the partial
   trajectory reveals deep architectural fault propagation, execution cleanly escalates to frontier models
   or specialized expert swarms.
2. **Investigation & Localization (SWE-Debate + He et al.)**:
   When localized diagnosis reveals cross-module ambiguity, unconstrained conversational chat fails
   catastrophically. The system bounds graph traversal to depth $L \le 5$ and deploys competitive multi-agent
   debate across competing fault hypotheses, forcing agents to defend claims against adversarial cross-critique.
3. **Execution & Gating (CodeAgent + Folio-Assistant Core)**:
   Pre-merge code verification is partitioned strictly by epistemological authority. Deterministic tools
   (compilers, linters, formal proof verifiers) act as hard blocking gates; multi-agent review teams execute
   tool-integrated consistency and vulnerability checks, emitting structured advisories ("would have blocked")
   supervised by bounded QA-checker loops. If structural anomalies or missing prerequisites emerge at any turn,
   the Andon cord immediately halts execution.

---

## 2. Epistemic Partition: Measured vs. Recommended vs. Claimed

To prevent ungrounded academic claims from leaking into production engineering rules, all assertions across
the five papers are strictly segregated into three epistemic tiers:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EPISTEMIC PARTITION MATRIX                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MEASURED (Empirically verified metrics, benchmark datasets, measured error rates, exact counts)         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • CodeAgent (2402.02172v5): Standalone GPT-4 exhibits 48.58% false-positive rate on vulnerability      │
│   detection (Table 2: 345 confirmed of 671 flagged). Standalone GPT-3.5 exhibits 63.31% FP; CodeBERT   │
│   exhibits 80.06% FP. Multi-agent review latency: 3 min (GPT-3.5) to 5 min (GPT-4) per PR; financial    │
│   cost: $0.122 per review (Table 12).                                                                   │
│ • SWE-Debate (2507.23348v1): On SWE-bench-Verified-S, file localization accuracy Acc@1(File) peaks at  │
│   depth L=5 (86.7%), climbing from 70.7% (L=1) and 72.0% (L=3), before degrading to 82.7% at L=7       │
│   due to dependency noise (Figure 3, §5.4). Resolution rate increases +14.67% over SWE-Agent with       │
│   identical DeepSeek-V3 backbone; overall resolution reaches 40.0% (+6.7% over single-agent baseline). │
│ • SWE-Router (2607.00053v1): Static prompt-only routing achieves only 32.1% accuracy in predicting     │
│   task resolution. Value head on partial trajectories (K=3) reduces overall cost by 40–50% while       │
│   capturing 85–95% of frontier performance (Theorem 4.1 empirical proof). High-economy threshold        │
│   yields 60–80% cost reduction on routine bug fixes.                                                    │
│ • TCAndon-Router (2601.04544v1): Consultation tasks (|A_q|=1) yield parity with single-worker models   │
│   (27.0% win rate over solo); troubleshooting (|A_q|>1, avg 1.37 experts) yields 63.0% win rate when   │
│   synthesized by a Refining Agent. Andon-cord early stopping terminates failing paths in <3 turns.     │
│ • He et al. (2404.04834v4): In unconstrained conversational multi-agent systems (ChatDev), simple      │
│   games (Snake) succeeded in 10/10 runs; complex stateful logic (Tetris) failed in 9/10 runs, with the │
│   single "successful" run omitting core line-clearing rotation algorithms (§4.2).                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ RECOMMENDED (Operational heuristics, architectural patterns, design thresholds, safety policies)        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • Bounded Exploration Budget: Set initial compact exploration budget to K=3 steps.                      │
│ • Clean Escalation Restart Rule: When escalating from compact worker m1 to frontier m2, RESTART m2 from │
│   initial prompt q; never concatenate m1's flawed trajectory into m2's context window.                 │
│ • Dependency Traversal Horizon: Restrict fault trace extraction to graph distance L ≤ 5.                │
│ • Deterministic vs. Judged Gate Separation: Deterministic compiler/lint checks must hard BLOCK; LLM     │
│   adversarial reviews must WARN ("would have blocked") and record structured sidecars.                  │
│ • Supervisory Turn Caps: Cap conversational QA-Checker refinement loops at a maximum of 2 iterations.  │
│ • Andon-Cord Triggers: Programmatically halt multi-agent swarms upon detecting: (1) structural         │
│   divergence between first 2 workers; (2) out-of-scope missing inputs; (3) circular reasoning loops.    │
│ • External Deterministic Execution: Never use LLMs for format checking or syntax linting; shell out to │
│   deterministic CLI tools (ESLint, Prettier, TypeScript compiler).                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CLAIMED (Unverified hypotheses, speculative extrapolations, marketing claims, ungrounded author goals) │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • CodeAgent's Claimed 92.96% Review Accuracy: Unverified in general software engineering due to         │
│   circular ground-truth annotation (human authors audited only what CodeAgent flagged).                 │
│ • Universal Bayes-Optimality of Trajectory Routing: Claimed universally optimal, but holds only if      │
│   the value estimator is perfectly calibrated and the environment exhibits Markovian state signals.    │
│ • Generalizability of Static Expert Cards: TCAR claims dynamic expert addition scales smoothly, but      │
│   assumes pre-labeled domain ontologies that do not exist in evolving software codebases.               │
│ • Autonomous End-to-End Software Engineering: The survey's vision of fully autonomous multi-agent SDLC   │
│   remains an unverified aspiration given catastrophic state degeneration on complex stateful codebases. │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Adversarial Pass Direction 1: Attacking the Papers' Claims

A critical analysis exposes significant methodological flaws, hidden costs, and uncalibrated assumptions
in the published literature:

```
                                  ATTACK ON LITERATURE CLAIMS
                                  
   [CodeAgent]               [SWE-Debate]              [SWE-Router]             [TCAndon-Router]
   Circular Ground Truth     Quadratic Token Explosion Value-Head Calibration   Rigid Static Taxonomy
   48.6% False Positives     Discriminator Position    Out-of-Distribution Drift Synthetic Bias
   Formatting LLM Waste      Noise Spike at L > 5      Cold-Start K=3 Overhead  Blind to Data Races
        │                         │                         │                         │
        └─────────────────────────┴─────────────────────────┴─────────────────────────┘
                                                  │
                                                  ▼
                               [REFUTED / CONSTRAINED CLAIMS]
                               - No uncalibrated blocking gates
                               - No unconstrained multi-round debates
                               - Clean-slate context restarts mandatory
                               - Dynamic ontology over static cards
```

### 1. CodeAgent (arXiv:2402.02172v5): The Circularity Trap & Alert Fatigue
- **The Circular Annotation Fallacy (§4.1)**:
  CodeAgent claims a 92.96% confirmation rate for its vulnerability detections. However, Section 4.1 admits
  that ground truth was established by running CodeAgent over 3,545 commits and having human authors inspect
  *only the commits CodeAgent flagged*. Unflagged commits were never audited. This circular methodology
  completely masks false negatives and inflates apparent precision.
- **The 48.58% False-Positive Disaster (Table 2)**:
  Standalone frontier models (GPT-4) exhibited a 48.58% false-positive rate. Deploying an uncalibrated LLM
  reviewer as a blocking CI gate will trigger severe alert fatigue, forcing developers to bypass or disable
  the review system.
- **The Format Analysis (FA) Anti-Pattern**:
  Employing multi-agent LLM dialogue to detect indentation errors, trailing spaces, and bracket formatting
  wastes hundreds of thousands of tokens on problems deterministic linters (Prettier, ESLint, `gofmt`)
  solve in under 50 milliseconds with mathematical certainty.
- **Runaway Latency and Cost (Table 12)**:
  At 5 minutes and $0.122 per review, running synchronous multi-agent review loops across concurrent PRs
  in a busy merge queue would completely throttle CI throughput.

### 2. SWE-Debate (arXiv:2507.23348v1): Token Explosion and Judge Vulnerabilities
- **Quadratic Token Explosion in Multi-Round Debates**:
  Multi-round debates with cross-agent critique require each participant to ingest the full debate history,
  code snippets, and rival arguments at every turn. Token consumption scales quadratically with debate rounds
  ($O(N^2 \cdot \text{turns})$), rendering unconstrained debate economically unviable for routine software maintenance.
- **Discriminator Bias and Hallucination Aggregation**:
  The Round 3 Discriminator (Prompt 8) is itself an LLM subject to well-documented cognitive biases: length
  bias (favoring longer, more verbose arguments), position bias (favoring the last argument presented), and
  prestige bias. If two debaters introduce subtly flawed reasoning, the discriminator frequently synthesizes
  a compromise that combines both errors rather than identifying the underlying defect.
- **The Horizon Noise Cliff ($L > 5$)**:
  The paper's own ablation study (Figure 3) demonstrates that expanding dependency graph traversal from $L=5$
  to $L=7$ causes localization accuracy to plunge from 86.7% to 82.7%. Excessive context traversal injects
  irrelevant semantic noise that derails agent attention.

### 3. SWE-Router (arXiv:2607.00053v1): Value-Head Fragility and Inflexible Budgets
- **Value-Estimator Calibration Drift**:
  The theoretical optimality of SWE-Router (Theorem 4.1) assumes a perfectly calibrated value head $\hat{r}_1$.
  In practice, value heads trained on specific repository distributions (e.g. Python repositories in SWE-bench)
  suffer catastrophic out-of-distribution drift when deployed on mixed-language, schema-heavy, or formal math
  codebases. An uncalibrated value head results in false escalations (burning tokens) or false continuations
  (sub-agents thrashing in dead ends).
- **Cold-Start Exploration Overhead**:
  Enforcing a mandatory $K=3$ exploration budget with a compact model imposes an unnecessary 3-turn latency
  and token penalty on tasks that are trivially identifiable as requiring frontier reasoning (e.g., Lean 4
  formal proofs, cryptographic invariant changes, architectural boundary reviews).
- **Impoverished Prompt Artifact**:
  The paper's claim that prompt-only routing has an irreducible Bayes-error floor is partially an artifact of
  treating raw, unstructured issue descriptions as the sole prompt input. When prompts are compiled from
  structured requirements models (e.g., CRDM, BPMN specifications), prompt-time routing precision increases
  substantially.

### 4. TCAndon-Router (arXiv:2601.04544v1): Static Ontologies and Synthetic Bias
- **Brittle Static Domain Expert Profiles**:
  TCAR relies on predefined "role cards" and static candidate pools ($A_q$). In modern software architectures,
  subsystems interact dynamically; bugs rarely respect static functional boundaries. Static routing topologies
  break down when confronted with emergent, cross-cutting architectural refactorings.
- **Synthetic Training Data Contamination**:
  TCAR's routing model is fine-tuned on synthetically generated multi-agent interaction dialogues. Synthetic
  training sets systematically underestimate real-world developer ambiguity, tool execution timeouts, and
  flaky test environments.
- **Blindness to Emergent Data Races**:
  TCAR's Andon cord relies on explicit linguistic signals of conflict or out-of-scope tags. It cannot detect
  subtle semantic data races, state corruption in shared test databases, or silent git merge collisions between
  concurrent agents.

### 5. He et al. Survey (arXiv:2404.04834v4): The Chat State-Degeneration Blindspot
- **Conversational Entropy and the Tetris Failure**:
  The survey documents that ChatDev failed 9 out of 10 times on Tetris (§4.2) due to conversational drift
  and loss of global state. Yet the survey continues to treat unconstrained multi-agent conversational chat as
  a viable foundation for complex SE. In reality, chat histories act as entropy accumulators: each conversational
  turn adds tokens, increases context ambiguity, and degrades instruction adherence.
- **Conflation of MoE and Multi-Agent Systems (§6.1)**:
  The survey's comparison between Mixture-of-Experts (MoE) and Multi-Agent Systems glosses over the fundamental
  inefficiency of text-serialized coordination. MoE routes internal activation vectors with zero token serialization
  overhead; multi-agent systems communicate via natural language strings, incurring massive token costs, serialization
  latency, and linguistic parsing errors.

---

## 4. Adversarial Pass Direction 2: Attacking Folio-Assistant's Processes

Applying the literature's critical insights to folio-assistant's own architecture exposes four significant
operational vulnerabilities across its 69 BPMN/DMN processes and SDLC skills:

```
                              ATTACK ON FOLIO-ASSISTANT PROCESSES
                              
   [Context Saturation]       [Context Poisoning]       [Merge Queue Stoppage]    [Zombie Agents]
   69 BPMN/DMN XML in Prompt  Parent History Re-used    Uncalibrated LLM Block    No Automated Andon
   Large Schema Ingestion     Flawed Traces Inherited   Alert Fatigue Risk        Runaway Loops
        │                          │                         │                         │
        └──────────────────────────┴─────────────────────────┴─────────────────────────┘
                                                   │
                                                   ▼
                                [FOLIO-ASSISTANT REMEDIATIONS]
                                - Sub-process context projection
                                - SWE-Router Clean Escalation Rule
                                - Deterministic Block / Agent Warn
                                - Explicit Andon-Cord Triggers
```

### 1. Context Saturation in the 69 BPMN/DMN Process Suite
- **Vulnerability**:
  Folio-assistant maintains 69 executable BPMN 2.0.2 diagrams and DMN 1.5 decision tables. Several coordinating
  skills (e.g. `coordinate.md`, `integration-watcher.md`, `crdm-*.bpmn`) tend to inject entire XML process
  specifications, schemas, and extensive markdown memory files into the agent's context window.
- **Risk**:
  As documented in `specification-compiled-agents.md` and SWE-Debate, LLM reasoning degrades as context
  saturation increases. Dumping global process state causes "needle-in-a-haystack" retrieval failure, leading
  agents to hallucinate tool capabilities, skip gateway conditions, or miss specific lint rules.
- **Remediation**:
  Enforce strict **sub-process projection**: agents executing a task must receive only their immediate task
  node, incoming/outgoing sequence flows, and the explicit DMN decision table governing the active gateway,
  never the whole-process XML graph.

### 2. Context Poisoning in Swarm Dispatch and Escalation
- **Vulnerability**:
  In `sdlc/skills/sdlc-core/dispatch-agent.md` and `swarm-management.md`, sub-tasks are spawned when an agent
  encounters complex sub-problems. In common usage, the parent agent frequently forwards its entire ongoing
  conversation transcript—including failed search attempts, erroneous grep commands, and hallucinated root-cause
  hypotheses—into the subagent's prompt.
- **Risk**:
  This directly violates the **Clean Escalation Rule** established by SWE-Router (arXiv:2607.00053v1).
  Conditioning a fresh agent on an exploratory agent's flawed trajectory biases the new agent toward the same
  false assumptions, destroying the independent reasoning advantage of model escalation.
- **Remediation**:
  Codify the clean escalation restart rule across all swarm dispatch tools: when escalating a stalled task or
  spawning a specialist subagent, compile a clean task brief containing only the objective specification $q$,
  relevant file paths, and target acceptance criteria, discarding exploratory dialogue history.

### 3. Merge Queue Fragility: The Deterministic vs. Agentic Boundary
- **Vulnerability**:
  Prior to work item `nok9` and proposal `merge-gate-2026-10-02.md`, there was strong pressure to establish a
  "blocking red flag" gate where multi-agent code reviews could unilaterally reject pull requests on the merge train.
- **Risk**:
  As CodeAgent proved (Table 2), LLM vulnerability reviewers exhibit an uncalibrated false-positive rate of
  up to 48.58%. Making an LLM code reviewer a blocking gate halts the merge train over hallucinated objections,
  paralyzing development throughput and inducing alert fatigue.
- **Remediation**:
  Strictly preserve the owner's 2026-10-02/10-03 ruling:
  - **Deterministic compile/test gates (G1, G2, G5–G8) MUST BLOCK**: Lean 4 formal math compilation, SUSHI/FHIR
    AST compilation, JSON-LD schema renders, linter suites, and unit tests answer questions with one machine-settled
    truth.
  - **Agentic reviews (G3, G4) MUST WARN**: LLM reviewers exit 0, emit structured advisories, and record
    "would have blocked" sidecars. Promotion to a blocking gate is forbidden until an agent demonstrates an
    empirically calibrated false-positive rate below 5% across recorded historical defects (`plj1`, `dh4f`, `w4tq`, `7u3g`).

### 4. Zombie Agent Runs and the Lack of Programmatic Andon Cords
- **Vulnerability**:
  While `sdlc/skills/sdlc-core/swarm-management.md` describes the conceptual discipline of stopping early, the
  underlying runner (`invoke_subagent`, background shell commands) lacked automated runtime predicates to detect
  and kill runaway agents.
- **Risk**:
  An agent trapped in an infinite search loop, circular git merge conflict, or hallucinated dependency chain
  continues to burn tokens until hitting wall-clock timeouts, draining API budgets and creating zombie lockouts
  in the work item store.
- **Remediation**:
  Implement explicit **programmatic Andon-cord stopping predicates**:
  ```typescript
  // Programmatic Andon-Cord Halt Predicates
  function evaluateAndonCord(trajectory: AgentTurn[]): { halt: boolean; reason?: string } {
    if (detectStructuralInterfaceConflict(trajectory)) {
      return { halt: true, reason: "Structural interface divergence detected across workers" };
    }
    if (detectMissingPrerequisites(trajectory)) {
      return { halt: true, reason: "Out-of-scope / missing input files (TCAR oos condition)" };
    }
    if (detectCircularReasoning(trajectory, { maxRepetitions: 3 })) {
      return { halt: true, reason: "Reasoning loop / tool thrashing detected without progress" };
    }
    if (trajectory.length > MAX_ALLOWED_TURNS) {
      return { halt: true, reason: "Turn budget exhausted; terminating to prevent zombie drain" };
    }
    return { halt: false };
  }
  ```

---

## 5. Architectural Transfer Matrix: What Transfers, What is Refuted, What Remains

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                ARCHITECTURAL TRANSFER MATRIX                                            │
├────────────────────────────┬────────────────────────────┬───────────────────────────────────────────────┤
│ Concept / Mechanism        │ Verdict                    │ Concrete Manifestation in Folio-Assistant     │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Value-based temporal       │ TRANSFERS                  │ Implemented in `swarm-management.md`:         │
│ routing (SWE-Router)       │                            │ K=3 compact exploration before escalation    │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Clean escalation restart   │ TRANSFERS                  │ Implemented in `dispatch-agent.md`:           │
│ (SWE-Router)               │                            │ Restart frontier models from clean prompt q   │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Bounded dependency trace   │ TRANSFERS                  │ Implemented in `devils-advocate-watcher.md`:  │
│ L ≤ 5 (SWE-Debate)         │                            │ Block dependency traversal capped at depth 5  │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ 3-round competitive debate │ TRANSFERS                  │ Codified in core's `adjudication.ts`:         │
│ (SWE-Debate)               │ (Selective)                │ Reserved for high-blast-radius headline math  │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Difficulty partitioning    │ TRANSFERS                  │ Implemented in `swarm-management.md`:         │
│ |A_q|=1 vs |A_q|>1 (TCAR)  │                            │ Solo worker for lookups; swarm for diagnosis  │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Andon-cord early stop      │ TRANSFERS                  │ Implemented in `coordinate.md` & swarms:      │
│ (TCAndon-Router)           │                            │ Halt on divergence, missing input, or loops   │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Warn-only agentic review   │ TRANSFERS                  │ Codified in `methodologies/agentic-pre-merge- │
│ (CodeAgent + nok9 ruling)  │                            │ review.md` & `merge-queue.md`: G3/G4 warn     │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ LLM Format Analysis (FA)   │ REFUTED                    │ Rejected: linters and formatters must run as  │
│ (CodeAgent)                │                            │ deterministic CLI tools, never LLM dialogue   │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Blocking LLM merge gate    │ REFUTED                    │ Rejected: 48.6% false-positive rate induces   │
│ (CodeAgent initial pitch)  │                            │ fatal alert fatigue; machine compilers block  │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Unconstrained chat teams   │ REFUTED                    │ Rejected: ChatDev failure on Tetris proves    │
│ (He et al. / ChatDev)      │                            │ conversation state degenerates without BPMN   │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Runtime APM closed-loop    │ IDENTIFIED GAP             │ Tracking: production telemetry feeding back   │
│ (He et al. / RCAgent)      │                            │ into bean triage store (`stalled-agent`)      │
├────────────────────────────┼────────────────────────────┼───────────────────────────────────────────────┤
│ Automated value-head       │ IDENTIFIED GAP             │ Tracking: training offline value heads on     │
│ calibration (SWE-Router)   │                            │ repository-specific git commit histories      │
└────────────────────────────┴────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 6. Implementation Checklist for Agents and Swarm Stewards

When coordinating multi-agent work, opening work items, or stewarding merge trains, verify these six invariants:

1. **Before dispatching a swarm**:
   - Check if the task is consultation/extraction ($|A_q|=1$). If so, **do not spawn a swarm**; dispatch a single compact worker.
   - For troubleshooting/diagnostic tasks, restrict the initial pool to $\le 3$ candidate specialists.
2. **During multi-turn execution**:
   - Limit compact model exploration to $K=3$ turns.
   - If the task is not progressing, **pull the Andon cord** immediately. Do not allow agents to run to timeout.
3. **When escalating to a frontier model**:
   - **Do not forward the exploratory chat history.** Re-compile the prompt from clean specifications, passing only verified file paths and objective error messages.
4. **When executing adversarial code reviews**:
   - Restrict block dependency graph traversal to depth $L \le 5$.
   - Never use LLMs for syntax, formatting, or typechecking. Run `bun run cat gates`.
5. **In the merge train**:
   - Enforce hard failure on Tier 1 & Tier 2 deterministic gates (Lean, SUSHI, JSON-LD, ESLint, TypeScript).
   - Enforce warn-only (`exit 0`) status on Tier 4 agentic reviews, emitting structured sidecars with `"would have blocked"` audit tags.
6. **In debate and adjudication**:
   - Reserve 3-round competitive debate exclusively for high-blast-radius headline theorems or disputed audit criteria.
   - The adjudicator must synthesize technical arguments and explicitly document `resolved_conflicts` rather than voting or averaging confidence scores.
