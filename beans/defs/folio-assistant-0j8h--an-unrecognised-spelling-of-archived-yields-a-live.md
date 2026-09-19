---
# folio-assistant-0j8h
title: 'An unrecognised spelling of archived: yields a LIVE, UNTAGGED memory node that reaches every agent'
status: todo
type: task
priority: normal
created_at: 2026-09-19T11:01:24Z
updated_at: 2026-09-19T11:01:24Z
parent: folio-assistant-8jt6
---

Found 2026-09-19 while verifying PR #402 (bean `4kiw`), which archived four
`platform-boundary-guard` memory nodes. The agent that did that work flagged
this as a sharp edge and judged hardening the parser out of scope, which was
the right call for that PR. It is **not** merely a sharp edge: I reproduced it,
and three of four spellings leak.

## The mechanism

`scripts/agent-memory.ts:210`:

```ts
...(fm["archived"] === "true" ? { archived: true } : {}),
```

An exact string compare. `parseFrontMatter` (same file, line 140) is a
hand-rolled line reader that runs every scalar through `stripQuotes`, so both
spellings the corpus actually uses — `archived: true` and `archived: "true"` —
collapse to the string `"true"` and match. Those are safe, and the generator's
own remediation message (line 324) tells authors to write `archived: true`, so
the documented path works.

**Every other YAML-valid spelling of the same boolean silently does not.** The
node then has `archived` absent, so `memoryForAgent` falls through to the
untagged rule — and an archived node has typically lost its `agents:` tag,
which is the whole reason `AGENTS.md` says the ordering is load-bearing:

> **Archived is checked BEFORE the untagged rule**, and the ordering is
> load-bearing: an archived entry has no agent tag once its agent is gone, so
> checking it second hands it to every agent — the opposite of archiving.

The ordering is correct in `schemas/memory.ts:264-268`. The defect is one layer
earlier: the flag never reaches it.

## Measured, not reasoned — 2026-09-19, on `main` at `e94288562`

Four probe nodes, identical but for the spelling, read through the real
`readMemoryNodes` and passed to the real `memoryForAgent` for an agent named
`some-unrelated-agent`:

```
probe-TRUE     archived=undefined
probe-True     archived=undefined
probe-true     archived=true
probe-yes      archived=undefined

reaching an UNRELATED agent: 3 of 4
   LEAKED: probe-TRUE
   LEAKED: probe-True
   LEAKED: probe-yes
```

So `archived: yes`, `archived: True` and `archived: TRUE` each produce a node
that is **live and reaches an agent it was never tagged for**. A trailing
comment (`archived: true # superseded by placement.md`) is the same shape and
almost certainly also leaks, though I did not probe it.

## Why this is the bad direction of failure

The two ways this can go wrong are not symmetric, and this is the worse one.

If the compare were too *loose*, an entry an author meant to keep would vanish
from a prompt — visible as a missing entry, and the agent's work would show it.
Too *strict*, as here, and the entry goes to **everybody**: a widened blast
radius, which nothing in the corpus reports on and no gate measures. `AGENTS.md`
records that the untagged escape hatch currently has **no instances at all**, so
a leaked entry would be the only one — and it would look like a deliberate
choice rather than a typo.

It also silently costs budget in every agent it reaches, which is exactly the
problem `4kiw` exists to fix.

## Options, with what each costs

1. **Accept the booleans YAML accepts.** Normalise case and the `yes`/`on`
   family, or parse the scalar as a boolean and compare. Cheapest; matches
   what an author writing YAML expects. Cost: it widens what the parser
   accepts, and a genuinely misspelled key (`archive:`, `archived?`) still
   passes silently.
2. **Refuse what the reader does not understand.** Treat any `archived:` value
   outside a known-true/known-false set as an error at read time rather than as
   absent. Strongest: silencing a node must cost more than not silencing it,
   which is the same reasoning `<folio:no-skill reason="…"/>` already applies.
   Cost: a malformed node fails the build instead of quietly working, which is
   correct here and is still a behaviour change.
3. **Validate the front matter against `MemoryNodeSchema` at read time.** The
   Zod schema already declares `archived: z.boolean().optional()` — the parser
   simply never consults it on this field. Most principled and fixes the whole
   class. Cost: every existing node must satisfy the schema, and some may not.

Recommendation: **3**, falling back to **2** if the corpus does not yet
validate clean. Not **1** alone — it fixes the spellings someone thought of.

## Done when

An unrecognised `archived:` value cannot produce a live, untagged node, and a
test asserts the leak case directly: a node whose `archived` spelling the
reader does not understand must not appear in `memoryForAgent(nodes, <an agent
it was never tagged for>)`. The four-spelling probe above is the fixture.
