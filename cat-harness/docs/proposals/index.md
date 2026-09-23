---
title: "Proposals"
kind: proposal
movedOn: 2026-09-19
movedFrom: "docs/folio-assistant/proposals/index.md"
summary: >-
  Index of design proposals. Retained for its prose about what a proposal is for; the proposals themselves belong on their issues.
---

# Proposals

Design notes that set out options and what each one costs, before anything is
built. A proposal is not a commitment — it exists so that a decision can be
argued with while it is still cheap to change, and so that the reasoning behind
the option eventually chosen survives the session that produced it.

A proposal says what would **decide** the question, not only what the author
prefers. If it cannot say what evidence would change its mind, it is an opinion
wearing a heading.

| proposal | question |
|---|---|
| [Workflow state in beans](workflow-state-in-beans.html) | Should a running BPMN process keep its position in the bean itself, or in its own store? Four options with what each costs. **Decided 2026-09-18:** Option A — two stores, one link — with both moved out from behind dotfiles to `beans/` and `beans/workflow/` |
| [Deployment topologies](deployment-topologies.html) | How should the harness describe the ten deployment scenarios in #363 — local git only, private repo, sovereign cloud, self-sovereign, developer, swarm, benchmarking — when they can also be *mixed*? **Decided 2026-09-19:** ten topology axes plus six operating modes, so a mix is a point in the product rather than a new named mode. Carries the incompatible pairs a free product would otherwise admit. Still open: whether sovereign cloud and self-sovereign are two topologies or one |
| [Migrating `AGENTS.md` into skills](agents-md-migration.html) | Which of `AGENTS.md`'s 19 sections are bootstrap, which are pointers, and which are the "migration debt" the file names in its own banner? **Survey, not a migration:** every section classified with its destination, four subjects found to have no owning skill at all, and the two-`AGENTS.md` constraint that decides what may move. Corrects two counts an earlier survey asserted |
| [The bootstrap graph](bootstrap.html) | What is `bootstrap/` — the graph an agent reads before it knows whether the repository is an instance, what kind, or what for? A standalone graph that may not import the harness, a README that is a conformance test of the graph's own self-documentation, a two-branch BPMN, two skills and no MCP. **Not built:** the design is settled, no code exists. Records the late correction that intent is an INSTANCE REFERENCE, not a harness-type enum, and the two questions it does not answer |
| [SDLC process audit](sdlc-process-audit.html) | Which of the 33 BPMN diagrams owns which phase of the software life cycle, and which phases nothing owns? Audited against ISO/IEC/IEEE 12207's technical processes. **Five phases unowned, one half-owned**, and the missing artefact has an exact template already in the repository: `content-change-review.bpmn` draws this loop at 22 activities, for *content*, and there is no code-change sibling. Confirms the MVP subprocess already exists, so #363's MVP ask is a reference rather than a drawing. Nothing is drawn here by design |
| [Actor facts and their processes](actor-facts-and-their-processes.html) | Two asks — air-gapped as a property of an ACTOR forcing a human signing route, and the missing actor/role processes — answered as one defect: **a declared actor fact that no process reads**. The crux is a schema gap: `degradation`'s fallback is always another CAPABILITY, so *"the API cannot reach out, therefore a person signs"* is unexpressible. Also: the actor→role→lane join is clean (31 of 31 roles bound), but `role-management` is held by one actor and exercised by nothing. Fourth sighting of the category error `ind9` already fixed once |
| [Does the prose say what the artefact does?](narrative-asserts-code.html) | One review axis for every declared prose ↔ code pair — a diagram and the workflow it draws, a skill and the code beside it, a proof and its Lean — with Lean as a specialisation. **Signed off 2026-09-23** (#1042) as three stages: a staleness flag first, because it asserts nothing about truth and so cannot cry wolf; then mechanical claim checks; then a review branch that sends disagreement to adjudication |
| [Actors, ODRL and PROV-O](odrl-prov-actor-model.html) | How to simplify the actor / role / permission schema, now that the owner has chosen **W3C ODRL 2.2** for permissions and **W3C PROV-O** for logging (2026-09-23)? Actors become `prov:Agent`s with no permission list. The 14 flat permission ids become an ODRL profile in which 9 are kinds of task under `cat-harness:perform`. Grants are ODRL rules scoped by Process, Task and Role constraints, and every task run is a `prov:Activity`. The deterministic and the agentic BPMN engine then check one policy, before and after the fact. Computable data sharing agreements (`odrl:Agreement` as a VC, GDHCN, HCERT) are the next proposal |
