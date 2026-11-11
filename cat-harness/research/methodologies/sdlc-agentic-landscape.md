---
$schema: folio-methodology/v1
name: sdlc-agentic-landscape
title: SDLC agentic landscape — mapping LLM multi-agent systems to the software development lifecycle
origin: >
  Junda He, Christoph Treude, and David Lo, "LLM-Based Multi-Agent Systems for Software
  Engineering: Literature Review, Vision and the Road Ahead" (arXiv:2404.04834v4, 2025),
  Singapore Management University. Systematic review (30pp) covering multi-agent architectures,
  SDLC stage taxonomies, empirical case studies, and research agendas for agentic software engineering.
evidence:
  - library/arxiv-2404.04834v4
applies-when: >
  **Assessing, designing, or auditing multi-agent systems and automated workflows across the software development lifecycle (SDLC).**
  Use this framework to evaluate which SDLC phases an agentic platform covers, identify architectural gaps,
  and benchmark agent collaboration models (e.g., Waterfall sequential vs. Agile sprint cycles vs. dynamic workflows).
  Not applicable for selecting single-prompt generation techniques or isolated bug-fix heuristics.
---

# SDLC Agentic Landscape — Mapping LLM Multi-Agent Systems to the Software Lifecycle

**Adopted from arXiv:2404.04834v4 (He, Treude, and Lo, 2025).** The comprehensive survey maps
the state of LLM-based multi-agent (LMA) systems across every phase of the software development
lifecycle (SDLC), contrasting team architectures, collaboration topologies, and benchmark results.

This node establishes the systematic cross-cutting comparison between the survey's SDLC taxonomy
and the 69 executable BPMN/DMN processes in this platform.

---

## 1. The Survey's SDLC Phase Taxonomy

He et al. synthesize empirical literature into six foundational SDLC phases:

| SDLC Phase | Focus & Key Activities | Representative LMA Systems |
|---|---|---|
| **1. Requirements Engineering** | Elicitation of user needs, domain modeling, requirement formalization/specification, consistency analysis, validation | Elicitron, MARE, AgileGen (Gherkin-based) |
| **2. Software Design** | Architecture design, system decomposition, API contracts, interface specifications, role delegation | MetaGPT (Architect agent), ChatDev, DevLoops |
| **3. Code Generation & Implementation** | Multi-agent pair programming, role-specialized coding, teacher-student self-repair, retrieval-augmented coding | INTERVENOR, Self-repair, TGen, FlowGen |
| **4. Software Quality Assurance** | Test case generation, fault localization, vulnerability detection, cross-validation, static analysis pruning | ICAA, RCAgent, AgentFL, ChatDev (Tester agent) |
| **5. Software Maintenance** | Automated program repair (APR), debugging, code review, test case maintenance, dependency migration | MASAI, MarsCode, AutoCodeRover, Lemner et al. |
| **6. Software Management & Collaboration** | Process modeling (Waterfall vs. Agile sprints), agent coordination, resource allocation, human-agent collaboration | ChatDev, MetaGPT, AgileCoder, Think-on-Process (ToP) |

---

## 2. Cross-Check Against Folio-Assistant Processes (69 Diagrams)

Folio-assistant provides an executable, BPMN 2.0.2 and DMN 1.5 driven architecture for multi-agent
software and knowledge engineering. Below is the mapping against the repository's 69 processes:

```
                                  SDLC AGENTIC COVERAGE
                                  
  [Requirements]       [Design]          [Implementation]      [Testing & QA]       [Management]
  CRDM Process Suite   BPMN/DMN Models   Authoring Adapters    Quality Gates (CI)   Bean Coordination
  Needs Elicitation    MADR Decisions    Lean Formalization    Attestations/Witness  Merge Steward (Queue)
  Signoff Gateways     RACI Swimlanes    Hybrid Deterministic  Adversarial Reviews  Multi-Voice Reviews
         │                 │                    │                     │                   │
         └─────────────────┴────────────────────┴─────────────────────┴───────────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                            [COVERED STAGES]         [CURRENT GAPS]
                            - Requirements (CRDM)    - Post-deployment telemetry
                            - Formal Design (BPMN)   - Runtime APM log monitoring
                            - Controlled Generation  - Legacy reverse-engineering
                            - Verified Gating/QA
                            - Serialized Integration
```

### A. Requirements Engineering: Full Coverage
- **CRDM Process Suite (`processes/process/crdm-*.bpmn`)**:
  - `crdm-needs.bpmn`: Systematic stakeholder needs capture.
  - `crdm-requirements-definition.bpmn` & `crdm-requirements.bpmn`: Structured specification.
  - `crdm-data-model.bpmn`: Domain entity mapping.
  - `crdm-signoff.bpmn` & `processes/process/decisions/requirement-signoff-recorded.dmn`: Formal gateway enforcing explicit human signoff.
- **Specification-Compiled Agents (`methodologies/specification-compiled-agents.md`)**:
  - Compiles declarative requirements directly into verifiable agent constraints.

### B. Software Design: Full Coverage
- **Executable Process & Decision Modeling (`processes/`)**:
  - System architecture is modeled in OMG standard BPMN 2.0.2 and DMN 1.5, serving as the machine-verifiable source of truth rather than informal diagrams.
- **Architecture Decision Records (`methodologies/madr.md`, `sdlc/processes/options-analysis.bpmn`)**:
  - Structured decision logging capturing context, options, decision drivers, and trade-offs.
- **Role & Swimlane Topology (`processes/process/actor-role-administration.bpmn`, `methodologies/raci.md`)**:
  - Strict separation between persistent actors, process roles, and skill bundles.
- **Wireframe & UI Design Reviews (`processes/ui/wireframe-design-review.bpmn`, `methodologies/wiregen.md`)**:
  - Structured transformation from intent to reviewed mid-fidelity user interface specifications.

### C. Code Generation & Implementation: Strong Controlled Coverage
- **Authoring Adapters & Profile Checking**:
  - Strict containment of generated artifacts via schemas and Zod validators (preventing unstructured hallucinated code).
- **Formal Verification & Lean 4 Formalization**:
  - Translating natural language assertions into formal mathematical proofs and verified Lean siblings.
- **Hybrid LLM/Deterministic Execution (`methodologies/hybrid-llm-deterministic.md`)**:
  - The model emits a verifiable rule or program (e.g. JSONata, Lean, AST transform), which deterministic machinery compiles and runs.
- **Parallel Dispatch & Heartbeat Contracts (`sdlc/skills/sdlc-core/dispatch-agent.md`)**:
  - Live 2-minute status heartbeats and progress monitoring contracts preventing agent dark runs.

### D. Software Quality Assurance & Testing: Rigorous Evidence-Based Coverage
- **Code Quality Gates (`sdlc/processes/code-quality-gates.bpmn`, `bun run cat gates`)**:
  - Derived dynamically from CI workflows; gates run both static lints, typechecks, schema checks, and browser suites.
- **Verifiable AI Guideline Evaluation (`research/methodologies/verifiable-ai-guideline-evaluation.md`)**:
  - Multi-agent cross-examination with statistical consensus (e.g., Fleiss' kappa, Gwet's AC1).
- **QA Reports & Attestations (`sdlc/processes/qa-report-signing.bpmn`, `sdlc/processes/decisions/signing-route.dmn`)**:
  - Commit-keyed QA verdicts stored on orphan branches (`qa-reports`) and signed attestations.
- **L1 Ingest & Completeness Audits (`scripts/check-l1-complete.ts`)**:
  - Exhaustive multi-arm verification of documents, blocks, images, and figures.

### E. Software Maintenance & Review: High Coverage
- **Adversarial & Multi-Perspective Reviews**:
  - `sdlc/processes/code-change-review.bpmn`, `narrative-code-review.bpmn`, and `processes/content/voice-review.bpmn` evaluate changes across competing perspectives (pedantry, security, architecture, user experience).
- **Upstream Version & Pin Management**:
  - `sdlc/processes/upstream-pin-watch.bpmn` and `upstream-version-adoption.bpmn` guard against dependency drift.
- **Criterion Adjudication (`sdlc/processes/adjudication.bpmn`, `criterion-adjudication.bpmn`)**:
  - Evidence-backed resolution of audit findings and defects.

### F. Software Management & Collaboration: Industrial-Grade Governance
- **Git-Backed Work-Plan Coordination (`sdlc/processes/bean-lifecycle.bpmn`, `work-plan/skills/work-plan/bean-coordination.md`)**:
  - Branch-local claims, no duplicate work item creation, explicit holder notes, and scrap-over-delete discipline.
- **Serialized Merge Train & Merge Steward (`sdlc/processes/merge-train.bpmn`, `decisions/merge-priority.dmn`)**:
  - Avoids multi-agent git race conditions and conflicting concurrent pushes to main.

---

## 3. Gap Analysis: Where Folio-Assistant Gaps Exist

The survey identifies emerging operational paradigms where folio-assistant does not currently maintain active processes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            IDENTIFIED GAPS                                  │
├────────────────────────────────┬────────────────────────────────────────────┤
│ Gap                            │ Survey Capability / Contrast               │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 1. Post-Deployment Monitoring  │ Cloud root-cause analysis (e.g., RCAgent), │
│    & Live Incident Diagnosis   │ runtime log anomaly detection, and active  │
│                                │ fault mitigation in production.            │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 2. Runtime Telemetry Feedback  │ Streaming OpenTelemetry/Prometheus metrics │
│    Into Knowledge Graph        │ directly into the bean store to trigger    │
│                                │ auto-remediation workflows.                │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 3. Legacy Software Evolution   │ Multi-agent reverse engineering of legacy  │
│    & Codebase Ingestion        │ untyped repositories lacking tests or BPMN │
│                                │ process specifications.                    │
└────────────────────────────────┴────────────────────────────────────────────┘
```

1. **Post-Deployment Monitoring & Operational Telemetry**:
   - *Current state*: Folio-assistant monitors CI health (`ci-health-watch.bpmn`) and GitHub Pages deployment status, but stops at the boundary of static site and artifact delivery.
   - *Survey benchmark*: Systems like RCAgent analyze cloud telemetry, parse real-time logs, and identify system anomalies during live runtime execution.
   - *Recommendation*: Introduce an `operational-monitoring` process group if folio-assistant deploys active microservices or continuous services.

2. **Runtime APM & Telemetry Closed-Loop Ingestion**:
   - *Current state*: Audit failures in CI create local and branch-level reports. Production telemetry does not feed back into the `beans` graph.
   - *Survey benchmark*: Automated incident-to-bug-report translation with automated regression test generation.
   - *Recommendation*: Connect external issue alerts and crash-reporters into automated triage work items (`stalled-agent-triage` / `issue-working`).

3. **Legacy Software Reverse Engineering**:
   - *Current state*: Folio-assistant excels in forward-engineering from formal specifications, guidelines, and schemas.
   - *Survey benchmark*: Agents that ingest 100k-LOC legacy C/Java codebases with no tests and reverse-engineer requirements and architecture.
   - *Recommendation*: Develop an extraction adapter to reconstruct BPMN/DMN diagrams and CRDM requirement models from existing code repositories.

---

## 4. Key Takeaways for Agentic Platform Design

1. **Process Rigor Trumps Unconstrained Multi-Agent Chat**:
   As He et al. demonstrate in their Tetris case study, unconstrained agent conversation (e.g. ChatDev) fails repeatedly (9 out of 10 attempts failed, with the final attempt still missing core line-clearing logic) when tasks require deep stateful logic. Folio-assistant's deterministic process boundaries, DMN rules, and compiler shims prevent these catastrophic failures.
2. **Hybrid Deterministic/LLM Architecture is Essential**:
   Pure generative coding degrades with complexity. Inverting the model's responsibility from generating whole output to generating validated rules (`methodologies/hybrid-llm-deterministic.md`) matches the survey's research agenda for Phase 1 (specialized agent capability enhancement).
3. **Multi-Agent Coordination Requires Serialized Governance**:
   Uncoordinated agent swarms produce merge chaos and duplicated work. Folio-assistant's work item claims and merge steward fulfill the survey's Phase 2 vision for optimizing agent synergy and leveraging industry software engineering principles.
