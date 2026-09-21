---
# folio-assistant-0grh
title: 'SPINE: the untainted-dispatch skill — controlled context extracted from the KG, parameterized prompt, producer never writes the verdict'
status: todo
type: task
priority: high
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

The spine of `3x2n`. Everything else here is an instance of this.

## What generalises, taken from the one place it exists

`translation-manager.md` §"The agentic round trip" states it in translation
vocabulary. Stripped of that vocabulary it is three rules and a table:

| party | is given | produces |
|---|---|---|
| **producer** | the task | the artefact |
| **checker** | the artefact, and nothing that would let it shortcut | an independent rendering or finding |
| **adjudicator** | the original intent and the checker's output, never the artefact itself | `pass` / `warn` / `fail`, each drift named |

1. **Neither dispatched agent sees what would let it shortcut.** The
   translation case: a back-translator shown the English writes the English
   back and the check passes vacuously.
2. **The checker uses no tools, and says so.** The source is in the repository;
   an agent with filesystem access finds it, and the verdict then measures its
   search rather than the artefact. Ask for a `TOOLS_USED` line and record it.
3. **One agent doing both halves is not this check.** It compares a text with
   its own paraphrase of itself.

## What has to be built rather than lifted

**The controlled context is extracted from the KG, not hand-assembled.** The
owner's words: *"as extracted from the KG with a set prompt and parameterized
input"*. A caller names a **subject node** and a **criterion**; the mechanism
resolves what the checker may see from the graph and fills a fixed prompt. Hand
-composing a brief per call site is how rule 1 gets broken quietly — the person
composing it is the producer.

**Model provenance.** `translation-manager` already carries the rule and the
reason: a subagent's serving model is not observable from the dispatching
session, so record `model` **with** `modelSource` or not at all. Absent both,
"not recorded" is a true statement and an acceptable one.

## Done when

- [ ] A skill in the `kg` graph states the discipline with no domain vocabulary
- [ ] Context resolution is parameterized over (subject node, criterion) and
      reads the graph — falsified by a subject whose context cannot be resolved
      returning **could not determine**, never an empty context that reads as
      "nothing to check"
- [ ] `TOOLS_USED` is recorded, not assumed
- [ ] Both dispatched agents are written as witnesses, adjudicator first
- [ ] At least two unrelated domains are expressed against it, so the
      genericity is demonstrated rather than asserted
