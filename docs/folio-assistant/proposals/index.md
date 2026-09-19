---
layout: default
title: Proposals
nav_order: 12
has_children: true
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
| [Deployment topologies](deployment-topologies.html) | How should the harness describe the ten deployment scenarios in #363 — local git only, private repo, sovereign cloud, self-sovereign, developer, swarm, benchmarking — when they can also be *mixed*? **Strawperson:** ten topology axes plus six operating modes, so a mix is a point in the product rather than a new named mode. Includes the incompatible pairs a free product would otherwise admit |
