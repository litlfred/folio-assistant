---
title: "Deployment descriptions: placing actors, matching Tools"
kind: proposal
issue: 363
bean: folio-assistant-o1by
summary: >-
  Owner, 2026-10-24: sovereign cloud is one of several deployment scenarios for agents and Tools, and the harness needs a comprehensive way to describe them. The vocabulary exists (ten topology axes, declared actors, per-actor reach, Tool requirements, credential needs). What is missing is the PLACEMENT of each actor in a deployment and a resolver that matches Tools and process tasks to those placements. Proposal only; no code.
---

# Deployment descriptions: placing actors, matching Tools

**Status: proposal (owner chose "proposal first", 2026-10-24).** No code is
written against it. Work item `folio-assistant-o1by`, under epic `5a3l`.

> sovergign cloud is one of several potential deployment scenarios for agents
> and Tools. we need a comprehensive way to descirbe this.
>
> — owner, 2026-10-24

1. TOC
{:toc}

---

## 0. The claim

The harness can already say **what** each participant is and **what** each
Tool needs. It cannot say **where** a participant runs in a given deployment,
so it cannot say which Tool works for which task there. One new declaration,
the **placement** of a declared actor, and one reader of it, the
**resolver**, close that gap without a second vocabulary.

## 1. What already exists

| layer | what it says | where |
|---|---|---|
| Topology | ten axes, an **aggregate** over the deployment | [deployment-topologies](deployment-topologies.md) §1; `Topology` in `schemas/cat-harness.ts` |
| Named profiles | a point in the topology product; only `developer` exists | `DEPLOYMENT_PROFILES` (work item `2ngl`) |
| Refused pairs | combinations the mechanism forbids | `topologyConflicts()` |
| Operating modes | author, ingest, develop, test, qa-review, publish | deployment-topologies §2 |
| Actors | 34 declared participants: `kind` (person, agent, system), `roles`, `capabilities`, sometimes `reach` | `scenarios/actors/` |
| Per-actor reach | reach is a property of each actor; the deployment value describes the population | `schemas/actor-reach.ts`, [actor facts](actor-facts-and-their-processes.md) (work items `r0rq`, `bkje`) |
| Tool requirements | `requires` {os, runtime, network}, `remedies`, `install`, `selection` | `schemas/tool.ts`, gated by `check:tools` |
| Forge twins | GitHub and GitLab Tools as alternatives under one skill | work item `4dbr` |
| Agent host and identity | which agent host runs a session; who is typing | cat-harness-tools `src/core/agent-host.ts`, `identity.ts` (work item `f1e1`) |
| Credentials | a consumer declares a need from a closed action list; a deployment profile supplies a mechanism | [credentials](credentials-needs-and-supply.md) (work item `vobp`; declaration `9hxd`, parked) |
| UI surface | gh-pages, local server, with or without MCP, chat only | `skills/ui/ui-core/deployment-awareness.md` (work item `81vy`) |
| Live data | sovereign cloud: artefacts only; self-sovereign: may hold wallet credentials | work items `4y2i`, `61tg`; [wallet custody](wallet-custody.md) |

## 2. The gap: an actor is not a placement

A declared actor is **abstract**. `claude.json` says an agent occupies the
`authoring-agent` lane. It does not say that, in the deployment this project
runs today, that lane is filled by Claude Code cloud sessions *and* by the
owner's local Antigravity agent, with different reach, identity and
credentials.

`attestation-service.json` shows the line already being drawn: its
description says its `reach` is "part of what it IS, rather than a fact about
where it happens to run". Every other reach fact is the second kind, a fact
about where an actor runs, and the harness has nowhere to put it per
deployment.

So four questions are answered today by an agent reading prose:

1. **Who is in this deployment.** `Topology` is one flat record, with no list
   of participants.
2. **Which Tool runs a task here.** Tools declare needs and deployments declare
   axes, but nothing matches the two. Only `signing-route.dmn` routes by an
   actor fact.
3. **The #363 scenarios.** Only `developer` is a declared profile. Sovereign
   cloud, self-sovereign, private GitHub, test/swarm and QA review are tables
   in work items.
4. **Jurisdiction and live data.** Sovereign cloud's real requirement (where an
   artefact may be served, who may reach it, how long it is kept) has a value,
   `jurisdiction-endpoint`, and no fields. "Artefacts only" is a ruling in
   prose.

## 3. Proposal

### 3.1 A deployment description

One description per deployment. It **reuses** every existing vocabulary and
adds only `placements`, `jurisdiction` and `liveData`:

```ts
interface DeploymentDescription {
  id: string;                    // "litlfred-today", "sovereign-cloud-example"
  topology: Topology;            // unchanged: the aggregate
  publicationHost?: PublicationHost;
  modes: OperatingMode[];        // which of the six run here
  placements: Placement[];       // NEW
  jurisdiction?: Jurisdiction;   // NEW
  liveData: "artefacts-only" | "may-hold-credentials";  // NEW; owner rulings 2026-09-24
}

interface Placement {
  actor: string;                 // an id in scenarios/actors/, never a new actor
  host?: AgentHost | Runner;     // claude-code, gemini-cli, codex, cursor,
                                 // antigravity, copilot, github-actions, gitlab-ci, local
  reach?: NetworkReach;          // undeclared stays REACH_UNKNOWN (actor-reach.ts)
  compute?: Compute;
  toolSurface?: ToolSurface;
  modelProvenance?: ModelProvenance;
  identity?: { provider: string };          // as identity.ts names providers
  credentials?: Record<CredentialAction, string>;  // need -> mechanism NAME, never a value
}

interface Jurisdiction {
  publicationBase?: string;      // where artefacts may be served
  audience?: "public" | "authenticated" | "operator-only";
  retention?: string;            // as the jurisdiction states it
  residency?: string;            // where bytes may live
}
```

`AgentHost` is the list `agent-host.ts` already detects. A placement of an
actor whose own declaration fixes a fact (`attestation-service` reach) may not
contradict it, and a check says so.

### 3.2 A resolver

The resolver reads the descriptions in `deployments/` (§5 question 1), the Tool graph and the process graph, and
answers three questions:

1. **Who may run a task here:** placements whose actor holds the task's lane
   role.
2. **Which Tool works for them:** the alternatives under the task's skill,
   filtered by `requires`, the forge and the credential need, against that
   placement. When none survives, its `remedies`.
3. **Which route a gateway takes:** the `signing-route` pattern made general,
   so a DMN table reads placement facts.

Its output is a report per deployment. It flags **a declared process with a
task that no placement can run**. That is reported only and never fails CI
(owner, 2026-10-24, §5 question 3). Undeclared facts route as
`actor-reach.ts` rules: unknown is never "reachable".

### 3.3 The scenarios as examples

Each #363 scenario becomes an example description that the tests load. The
first is the deployment this project runs now, because it is real:

| example | forge | publication | placements (examples) | live data |
|---|---|---|---|---|
| today (litlfred) | github | gh-pages | `claude` on claude-code (cloud), `claude` on antigravity (workstation), `ci-pipeline` on github-actions, `owner` | artefacts only |
| developer | none | local server | one agent, CLI, one model | artefacts only |
| private GitHub | github, private | local server | as today | artefacts only |
| sovereign cloud | jurisdiction-hosted | jurisdiction endpoint | agents and runners inside the jurisdiction | artefacts only |
| self-sovereign | own or none | local server | an air-gapped agent, a signing host, a person | may hold credentials |
| test / swarm | any | none | a stack of agents (work item `amom`) | artefacts only |

## 4. What it deliberately does not do

- **No live-store connection.** `liveData` records the ruling. It grants
  nothing, and no Tool gains a store connection from it.
- **No credential values.** A placement names a mechanism and a secret name,
  as the credentials proposal already says.
- **No inherited reach.** A placement without `reach` is unknown, never the
  deployment's value.
- **No new actors.** A placement names an actor that is already declared, so
  roles and ODRL policies stay where they are.

## 5. Open questions for the owner

1. **Where descriptions live.** **Decided 2026-10-24 (owner, option A): a
   `deployments/` subgraph holding several descriptions per layer.** One
   layer already runs in at least two deployments (cloud sessions and a
   workstation). The alternatives were one `deployment` block in `<name>.json`,
   or both.
   The folder sits in the declared `scenarios` graph, beside `actors/`, because
   every placement names an actor there (`DEPLOYMENTS_DIRNAME` in
   `schemas/deployment-description.ts`, work item `23a3`).
2. **Jurisdiction now or later.** **Decided 2026-10-24 (owner, option A): now,
   as four optional fields** (§3.1), so the sovereign-cloud example can be
   written in full. The alternatives were to wait until a jurisdiction asks, or
   to point to a document.
3. **Gate strength.** **Decided 2026-10-24 (owner, option C): report only,
   never fail.** "A task no placement can run" appears in the resolver's report
   and never blocks a merge. The alternatives were to report first and fail
   later, or to fail at once.

## 6. Work items

| work item | what |
|---|---|
| `o1by` | this proposal (feature) |
| `23a3` | schema: `DeploymentDescription`, `Placement`, `Jurisdiction`, and the placement-contradicts-actor check |
| `v3zw` | resolver and its report, including "a task no placement can run" (report only) |
| `jog4` | example descriptions: today's setup first, then the #363 scenarios, loaded by tests |
| `4y2i` | sovereign cloud: the jurisdiction fields and the artefacts-only example |
| `61tg` | self-sovereign: the offline run, and the air-gapped example |

## 7. What would change its mind

- If every real deployment has one placement per actor, `placements` collapses
  into the actor files plus `topology`, and this proposal shrinks to the
  resolver.
- If the resolver's answers never differ from what an agent reads in prose
  across the examples, it is ceremony; drop it and keep the examples.
- If a jurisdiction's rules cannot be stated as fields (§3.1), `jurisdiction`
  becomes a pointer to a document, not a schema.
