---
# folio-assistant-n8br
title: check:voice-skills — schemas/voice-skill.ts promises a gate that does not exist
status: todo
type: bug
priority: normal
created_at: 2026-09-21T18:26:34Z
updated_at: 2026-09-21T18:36:28Z
parent: folio-assistant-1xhc
---

`schemas/voice-skill.ts` says, in the module doc comment:

> **No field serves two of those by restatement.** The instruction body must
> not enumerate rules: a rule stated in prose beside the same rule stated as
> data is one fact in two places, and the prose copy is the one carrying no
> citation and no pattern. `check:voice-skills` enforces it.

**There is no `check:voice-skills`.** Written 2026-09-21 in the same session
that wrote the schema, describing a gate that was planned and not built.

That is the same shape of defect this session spent the day fixing in
`AGENTS.md` — a file stating a rule with nothing behind it. It is worse here
in one specific way: a reader who believes the sentence SKIPS the check. An
absent gate that nobody was told about leaves a reviewer reading carefully; an
absent gate that a doc comment promises leaves them reading past.

## What it has to catch

A `SKILL.md` that restates its own `voice.json` rules. The instruction body is
for what an actor DOES with the voice; the rules are data, cited, with
patterns. A prose copy beside them carries neither.

## Done when

- [ ] `check:voice-skills` exists, is in the gate set, and fails a SKILL.md
      that enumerates its voice's rules
- [ ] falsified in both directions: a mutation that restates a rule is caught,
      and the four SKILL.md files that ship today pass
- [ ] the doc comment in `schemas/voice-skill.ts` is true when the gate lands,
      or amended to say 'proposed' until it does

## The cheap fix, if the gate is not wanted

Amend the comment. A promise withdrawn is honest; a promise left standing is
the defect.
