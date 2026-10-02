---
# folio-assistant-n8br
title: check:voice-skills — schemas/voice-skill.ts promises a gate that does not exist
status: completed
type: bug
priority: normal
created_at: 2026-09-21T18:26:34Z
updated_at: 2026-09-21T19:01:57Z
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


## 2026-09-21 — built, gated, and falsified five ways

`scripts/check-voice-skills.ts`, `bun run check:voice-skills`, wired into
`code-quality-gates.yml` beside `check:voices` — the two halves of one claim:
the rules are cited, AND the body beside them does not restate them uncited.

### Four signals, one per way a rule leaks across

| signal | catches |
|---|---|
| the rule's **id** | a body that indexes or lists the rules |
| the rule's **title** | the commonest copy — a heading per rule |
| the citation's **quote** | the source passage moved into the prose |
| a **terminology pair**, both sides | "write X, never Y" lifted out of the data |

Plus the structural half Zod cannot do: a voice declaring
`folio-voice-skill/v1` promises an `instructions.file`, and that the file
RESOLVES is a different question from that the field is a string.

### Why it can be mechanical

The two halves are not written in the same register. A rule title is a
specific editorial claim — *"-ize, not -ise"*, *"Roman numerals for the front
matter, Arabic for the body"* — and instructions are about what an actor DOES.
Measured over 37 rules in four voices: **zero hits on any signal**.

### Falsified — the point of the exercise

A check reporting zero over its whole corpus is indistinguishable from one
that cannot fire. Five mutations, each caught:

1. a body listing a rule id — 1 major
2. a body restating a rule title — 1 major
3. a body copying the source quote — 1 major
4. a body giving both sides of a terminology pair — 1 major, and the finding
   names the pair: `("organize" against "organise")`
5. the declared `instructions.file` missing — 1 **critical**

And in the other direction, four cases that must NOT fire: instructions about
what to do with the rules; ONE side of a terminology pair (a body is written
IN the voice); the front matter's `description`, which legitimately
paraphrases; and a short title, which could be ordinary prose.

### A real bug found while writing it

`readVoicesGraph` derived the repository root with `repoRootFor(roots[0])`,
which is `dirname` and documented as taking an INSTANCE root. A caller
starting from the repository root got its PARENT, found no instance, and the
reader returned `null` — "no voices are declared" for a repository declaring
three. The checker was that caller. Fixed with an explicit `repoRootIn`
parameter rather than a guess between two readings of one argument, which is
the rule `resolveCoveragePath` states: resolving against whichever root
happens to work is worse than picking wrong, because the wrong pick is visible
and the lucky one is not. Regression test in `voice-skills.test.ts`.

### The doc comment is true now

`schemas/voice-skill.ts` names the gate BY PATH rather than by npm script, and
says in as many words that the sentence described a gate that did not exist
until today. A path is something a reader can open and find absent.

97/97 gates.
