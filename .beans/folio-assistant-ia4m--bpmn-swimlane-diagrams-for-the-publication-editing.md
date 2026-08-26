---
# folio-assistant-ia4m
title: BPMN swimlane diagrams for the publication + editing workflow (HCI validation gate, roles)
status: completed
type: task
priority: normal
created_at: 2026-08-26T12:46:50Z
updated_at: 2026-08-26T13:14:19Z
---

Claimed by claude/publication-workflow-diagrams-4uw90m.


## Landed

Three BPMN 2.0 swimlane diagrams under `docs/workflows/` (source of truth,
modeler-editable), rendered to SVG by `scripts/render-bpmn.ts` (bpmn-js in
headless Chromium) into `docs/assets/img/workflows/`:

- `editing-hci-validation.bpmn` — one proposed change to one block. Parallel
  gateway splits MECHANICAL validation (schema/constraints, syntax+spelling+
  links, build+QA gates) from NON-MECHANICAL (review agent, escalating to a
  human/SME on a judgement call). Both must report before the join; findings
  are collated and shown to the editor, whose accept/revise/discard decision
  gates the only step that writes content.
- `draft-to-publication.bpmn` — corpus → draft build → publication QA →
  parallel review-team + SME sign-off → programme-manager authorisation →
  publish. A red draft goes back through the editing call activity, never
  patched in the artifact.
- `content-lifecycle.bpmn` — one cycle, plan → retire, with the other two as
  call activities.

Every diagram carries a **Work plan (beans)** lane: claim before drafting, log
findings on the bean, resolve or re-open on commit; review change-requests are
opened as beans. Each activity carries `<folio:skill ref="…"/>` (and
`<folio:bean store=".beans/"/>`) so the skill→step mapping is machine-readable,
not just prose.

New actors: `authoring-agent` (proposes, cannot commit) and `review-agent`
(reports, cannot approve) — the RBAC model had no actor for the LLM itself.

Docs: `docs/publication-workflow.md` (nav_order 6) with the roles table,
per-diagram activity→skill tables, and the beans section; linked from
index/content-types/skills/README/AGENTS. The docs-site workflow renders the
SVGs before the Jekyll build so the published site cannot go stale;
`bun run render:bpmn:check` is the local guard (marker ids are normalised, so
output is byte-deterministic).
