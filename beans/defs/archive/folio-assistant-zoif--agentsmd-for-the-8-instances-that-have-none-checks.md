---
# folio-assistant-zoif
title: AGENTS.md for the 8 instances that have none — check:subgraph-coverage names them
status: completed
type: task
priority: normal
created_at: 2026-09-20T19:59:52Z
updated_at: 2026-09-20T20:31:29Z
parent: folio-assistant-zzmr
---


## Measured 2026-09-20, by the criterion added in PR #593

`check:subgraph-coverage` now asks about `agent-instructions` as well as
`instance-readme`. **8 of 11 instances declare no `agent-instructions`
asset** — readable by a person, mute to an agent. Run it for the list; it is
not copied here, because a count in prose is a claim and this one goes stale
the moment one is written.

One of the eight is a different defect from the other seven:
`folio-assistant-core` **has** an `AGENTS.md` on disk and does not declare it.
That is a finding rather than an exemption — an undeclared file is one no
checker has a reason to look at, which is the `v8gh` property.

## The rule each file must satisfy

Owner, 2026-09-20:

> agents.md should give good coldstart instructions (dont duplicatae
> readme.md) but augment.

So it is not a second README and not a stub. The split is by QUESTION: the
README answers *what is this*, `AGENTS.md` answers *what do I do, in what
order*. `cat-harness/AGENTS.md` (written in PR #593) is the worked example,
and `folio-assist-core/AGENTS.md` is the short form — point up at the root,
then state the ONE rule specific to the layer.

**Do not batch-generate these.** A file with nothing layer-specific to say
should say so in two lines and point up; eight copies of a template is eight
files an agent learns to skip.

## Done when

[ ] Every instance declares `agent-instructions`, and the file exists
[ ] `bun run check:subgraph-coverage --strict` is clean on that criterion
[ ] The root README's generated instances table shows no em dash in the
    agent column (it regenerates itself — `bun run readme:sync:root`)

Related: issue #592, PR #593, `agent-memory` skill §"The instance's two
declared assets".
