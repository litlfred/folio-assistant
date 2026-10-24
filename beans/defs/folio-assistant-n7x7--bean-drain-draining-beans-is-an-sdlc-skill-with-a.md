---
# folio-assistant-n7x7
$schema: bean/1.0.0
title: 'BEAN DRAIN: draining beans is an SDLC skill, with a queue builder and a claim check as Tools'
status: in-progress
type: feature
priority: high
created_at: 2026-10-24T08:30:00Z
updated_at: 2026-10-24T08:45:00Z
parent: folio-assistant-ahvw
---

Owner, 2026-10-24 08:15Z: *"update Skills so on draining beans/stories as part of
SDLC and describe Tools for coordination on spawned bean drains"*.

Today several agents drain at once: cloud threads plus agy (the owner's local
Antigravity agent, commits as `Carl Leitner <litlfred@fenugreek.home>`). The
practice that worked lives only in a project-files queue and in chat. It goes
into the knowledge graph here.

## Done when

- [ ] skill `bean-drain` (cat-harness `skills/sdlc/sdlc-core/`) with input and
      output JSON schemas: build the queue, group by owner, claim check, work,
      refill, ask the owner through `ask-the-person`
- [ ] Tool definitions in cat-harness `tools/`: `drain-queue` and `bean-claim-check`
- [ ] implementations in cat-harness-tools (definitions there, implementations here)
- [ ] pointers from `bean-coordination`, `idle-backlog` and AGENTS.md step 2

Related: pomp (the open-PR lookup, reopened today), bssi (the drain as a BPMN process).

_2026-10-24T08:30:00Z_ — Claimed by this session (https://claude.ai/code/session_01MMQkmKdyvbBnE6dR9xMAmg), with a plain commit on both copies.

_2026-10-24T08:45:00Z_ — PRs litlfred/cat-harness#520 (skill, schemas, Tool definitions) and litlfred/cat-harness-tools#706 (implementations). Issue litlfred/cat-harness#515. Session https://claude.ai/code/session_01MMQkmKdyvbBnE6dR9xMAmg.
