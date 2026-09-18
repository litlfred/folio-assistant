---
# folio-assistant-ce65
title: Tool nodes exist for 11 of 138 skills — audit which uncovered skills describe an action
status: todo
type: task
created_at: 2026-09-18T20:21:01Z
updated_at: 2026-09-18T20:21:01Z
---


Opened 2026-09-18, after the work rather than before it — the same unclaimed-work
failure as `1dfh`, recorded rather than backfilled quietly. Twice in one session
is a pattern, not an accident: both times I went from a one-line instruction
("do schemas/tool.ts") straight to building.

## Done in #279

`schemas/tool.ts`, `schemas/tool-types.ts`, four Tool nodes in `tools/`,
`check:tools` gated in CI, Tool nodes published in the KG with `satisfies` as
resolving links. Verified against the published staging artefacts, which caught
a real bug — see below.

## The number, and what it does and does not mean

**4 Tools cover 11 of 138 skills.** `check:tools` reports that and does not fail
on it, deliberately: a great many skills are pure judgement
(`interaction-modality`, `one-voice-style-guide`, `symbiotic-interaction`) and
have no mechanism to name. A Tool for them would be an invention.

**What the check cannot tell you is which uncovered skills describe an ACTION.**
Those are the ones whose mechanism is still inlined in prose — the debt
`skills-and-tools` names. Distinguishing "no mechanism exists" from "the
mechanism is written into the skill body" is a judgement about what each skill
is for, and it needs a human read rather than a heuristic. A grep for backticks
or `gh `/`bun run` would over-report: a skill may legitimately quote a command
as an example while still stating its capability generically.

So the work is: read the 127 uncovered skills, mark each as
**judgement-only** / **mechanism-inlined** / **mechanism-exists-elsewhere**, and
open a Tool for the second group. Probably worth doing per package rather than
in one pass.

## Known-good starting points

`prepare-merge-auto`, `pickup`, `watch` and `coordinate` are already covered by
the `github` Tool, so the four PR-choreography skills are the worked example of
what "covered" looks like — their prose still carries `mcp__github__*` calls
inline, which is exactly the thing to strip now that a Tool exists to reference.
That is bean `4dbr`'s migration step 1 and this bean's clearest first slice.

## The bug worth remembering

The first staging build published `tool-types.schema.json` at the STAGING url —
its `$id` was correct — while the Tool nodes in the same document referenced the
CANONICAL one, a document that does not exist on main because #279 introduces
it. Every `io.*.schema` pointed at a 404 while looking like a resolvable
absolute IRI.

`tools/index.ts` read `canonicalUrl` from the declaration and ignored
`--base-url`. Found by fetching the published artefacts, not by any test, and
not by checking that the files existed — the `$id`s were all correct. **The
references BETWEEN documents were wrong.**

Rule now stated in the module and pinned by a test that was verified to bite:
anything that mints an IRI takes its base from the same source as the document
it will be published beside.
