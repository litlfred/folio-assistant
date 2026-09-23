---
# folio-assistant-9fdi
title: Task_Review needs theme-ui-review, which NO role carries — and the ruling to re-lane it contradicts the diagram's own no-call reason
status: todo
type: bug
created_at: 2026-09-23T16:30:53Z
updated_at: 2026-09-23T16:30:53Z
parent: folio-assistant-zzmr
---

Found 2026-09-23 by stream 3/3 of the #956 consolidation, while applying the
owner's ruling on the `role-carries-activity-skill` findings. **Five of the six
were closed by that ruling. This is the sixth, and it is stuck for a reason the
question did not know about.**

## What was fixed, and what this is

`ingestion-agent` now carries `theme-art-intake`, which cleared five findings in
one line — the four `ingest-theme.bpmn` tasks and `CallActivity_IngestTheme` in
`document-ingestion.bpmn`. Verified: `document-ingestion.kg-qa.json` →
`role-carries-activity-skill: pass`.

`ingest-theme.bpmn` still fails on **`Task_Review`**, which needs
`theme-ui-review`.

## Two facts that were not in front of the owner when they ruled

**1. NO role carries `theme-ui-review` at all.** Grepped every role in
`cat-harness/scenarios/roles.json`: `theme-art-intake` is carried by
`docs-authoring-agent`; `theme-ui-review` is carried by **nobody**. So this is not
"the skill is on the wrong role" — it is `y1w9`'s class, a skill bound to no role,
and re-laning cannot fix it on its own. Whichever lane `Task_Review` moves to,
that lane's role must also GAIN the skill.

**2. The diagram already records a decision that the ruling contradicts.**
`Task_Review` carries, in `ingest-theme.bpmn` itself:

> `<folio:no-call reason="One automated check (no colour-only signal) out of the
> post-MVP theme-ui-review, which adds branding, locales and a human judgement.
> **Calling it would put a human gate into an automated ingest.**"/>`

The ruling was *"move `Task_Review` to a reviewer lane that carries
`theme-ui-review`"*, chosen against the framing that *"a review is plausibly not
an unattended engine's job"*. **That framing was mine and it was incomplete.** The
diagram's author had already considered exactly this and decided the opposite,
with a reason: the task is the **automated subset** of a post-MVP skill, and
moving it into a reviewer lane does the very thing the note says must not happen.

**So the ruling was taken on a premise the diagram refutes, and it was not
applied.** An agent that applied it anyway would be laundering its own bad framing
through the owner's answer.

## The tension is real, not a misreading

The skill's own front matter says `theme-ui-review` is *"Post-MVP by design"* and
adds *"a human judgement"*. The `no-call` note says this TASK is one automated
check carved out of it. **Both can be true** — and that is the actual defect: one
skill id is doing duty for an automated check and for a human review, which are
different things that want different roles.

## Three ways out, none of them an agent's to pick

| | |
|---|---|
| **A** | `ingestion-agent` also carries `theme-ui-review`. One line, consistent with the `no-call` note, and the skill stays one id doing two jobs. |
| **B** | Split the skill: an automated `theme-contrast-check` the engine carries, and `theme-ui-review` as the post-MVP human review bound to `reviewer`. Honest, and the largest change. |
| **C** | Re-lane as originally ruled, and withdraw the `no-call` note with its reason. Only correct if the note is actually wrong. |

## Done when
- [ ] One of A/B/C is chosen **with the `no-call` note in front of whoever
      chooses**, not the framing that omitted it
- [ ] `theme-ui-review` is carried by at least one role, so it stops being a
      `y1w9` orphan whichever way this goes
- [ ] `ingest-theme.kg-qa.json` reports `role-carries-activity-skill: pass`, or
      the criterion's scope says why this activity is exempt

*Raised by stream 3/3 of the #956 consolidation — session_013vZiHGPug7PuHoMxRS82vw.*

