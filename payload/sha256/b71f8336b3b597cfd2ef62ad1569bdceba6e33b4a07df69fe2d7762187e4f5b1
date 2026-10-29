---
# folio-assistant-61tg
$schema: bean/1.0.0
title: 'TOPOLOGY: self-sovereign — own infrastructure, inward-facing, wallets and DAK intake'
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:55:37Z
updated_at: 2026-10-26T13:20:00Z
parent: folio-assistant-o1by
---

**Strawperson.** From [#363](https://github.com/litlfred/folio-assistant/issues/363):
"self-soveringn mode: like soveregion cloud but hosted on own infrastructure, in
L4-L5 context may have data stores like hapi. not designed for external facing
services. more for managing wallets. have incoming DAK content. bean up to may
strwperson and create issue to review these."

## Strawperson position, to be argued with

| axis | value |
|---|---|
| forge | own infrastructure, or none — local git only is in scope |
| publication host | local HTTP server on own infrastructure |
| compute | own hardware |
| model supply | open or closed; possibly air-gapped |
| data stores | may include HAPI FHIR at L4–L5 |
| outward facing | **no** — this is the axis that separates it from sovereign cloud |

## The property that makes it hard, and is already recorded

`folio-assistant-4dbr` §"Sovereign compute" states it: running with no external
service at all additionally needs the **no-MCP** property (`agentic-harness`
reads files and does not require a tool server) and the **`beans-manual`** Tool
node (the work plan is editable by hand when no CLI can be installed). It then
records the thing this bean must fix:

> Both are already decided and recorded; **neither is exercised.**

So the deliverable is not a decision. It is a demonstration: stand the harness up
with no network and find out what breaks. Until that happens, "runs
self-sovereign" is an assertion. `docs/architecture/cat-harness-minimum.md`
(614 lines) is the written claim; it has not been tested.

## Incoming DAK content

"have incoming DAK content" is a distinct requirement and easy to skim past.
This topology **receives** content rather than only publishing it, which the
document-ingestion pipeline covers in principle (`uploads/` → `library/`) — but
that pipeline's capability probes assume tools may be installed on demand. On
air-gapped infrastructure they may not be. Check `--check-deps` behaviour under
no-network before assuming ingestion works here.

## Wallets

"more for managing wallets" is the use case, and it is the least specified thing
in #363. A health digital wallet implies holding credentials for individuals,
which is a materially different risk profile from publishing a guideline. The
strawperson's position is the same as its sibling's: **the harness produces
artefacts, it does not hold anyone's credentials.** That needs confirming, not
assuming.

## Review

https://github.com/litlfred/folio-assistant/issues/370, opened per #363's instruction.

--------

## Owner, 2026-09-24: **"It may hold credentials"**

The owner chose this over the strawperson ("the harness produces artefacts
and holds no credentials") and over parking it. Custody is a security design
of its own, so no code is written. The CRDM proposal is
`docs/proposals/wallet-custody.md`. It lists seven questions in order: whose
credentials, hold or broker, where the bytes live (never the repository),
which actors may use a credential, audit, offline revocation, and which
standards. The offline "stand it up with no network" demonstration is still
owed, and is not superseded by this.

_2026-10-24T08:20:00Z_ — Claimed by the Claude drain thread (smart-trust-demo session https://claude.ai/code/session_01CLVaA6b8XQ5xhvqNZCqc4R). Other agents: please skip this bean until this claim is released.

_2026-10-24T08:45:00Z_ — Moved under o1by (deployment descriptions), as the owner chose ("A. Proposal first"). Analysis: https://claude.ai/artifact/TauEHEAz5d2wgFinqZEqb8.

## Offline run, 2026-10-24 (Claude drain thread)

The run: a fresh clone of smart-trust-demo with all seven layers mounted from `index.lock.json`. Commands ran inside `unshare -rn`, with no network and loopback up. Logs were kept in the session; the analysis is https://claude.ai/artifact/TauEHEAz5d2wgFinqZEqb8 (section "Offline run").

- **Nothing failed for lack of network:**
  - `bun install --frozen-lockfile`, `mount:remote:check`, `check-deps` and `beans:fallback` worked.
  - `auth:login --all` worked and noted that GitHub was unreachable.
  - The session-start sweep worked and said "origin/main fetch failed (offline?)".
  - `serve:rendering` served on 127.0.0.1:4000.
- **Content findings, with the network on too:** `check:tools` (18 satisfies naming no skill, 2 missing paths), `check:reference-direction`, `render:bpmn:check` (missing SVGs), `index:render:check` (stale AGENTS.md/README.md/CLAUDE.md, no GEMINI.md) and `gates:list` (no QA working copy).
- **Defect found:** commands named as checks WRITE into the mounted layers.
  - `render:bpmn:check` wrote 109 files: 104 under `cat-harness/docs/assets`, plus 5 bootstrap SVGs.
  - `gates:list` wrote `test/results/` in five layers: 549 files in cat-harness, 69 in cat-harness-tools, 22 in smart-trust-tools, 3 in fhir-harness and 1 in folio-assistant-core.
  - Afterwards `mount:remote:check` reports five layers missing as "modified". On self-sovereign or air-gapped infrastructure, where a layer cannot be re-cloned, that breaks the mount until it is re-laid from a local copy.

Still owed: the same run with the network on, in the same clean layout, for a line-by-line comparison. The first pass at 08:25Z showed the same content failures online.

_2026-10-26T13:20:00Z_ — The air-gapped deployment description (`scenarios/deployments/self-sovereign.json` with `liveData: "may-hold-credentials"`, verified by `schemas/deployment-examples.test.ts` including the `attestation-service` reach refusal) merged in `litlfred/cat-harness#547` (`0a2a4c0f`, `2026-10-26T11:23:55Z`).
