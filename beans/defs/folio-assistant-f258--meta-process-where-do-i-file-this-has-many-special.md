---
# folio-assistant-f258
title: 'META-PROCESS: ''where do I file this?'' has many specialised answers and no general one — plus the surprise-to-corpus loop'
status: todo
type: feature
priority: high
created_at: 2026-09-21T21:09:05Z
updated_at: 2026-09-21T21:09:05Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-21, two linked asks in one message:

> also during such interactions/any task really, review the discussion/(input.output),
> was there something unexpected that happened (stastically so, logically so)
> then, if it is is happening during a defined process that is
> happeneing/expecting to happen often, it may be worth a new
> skill/guidance/tool refinment. if so prompt the user to add to corpus.
>
> (Need a meta-process "where to file things" as we have lots of specialized
> instances of that. bean up to review those and develop process/subprocesses.
> any lit we need on proven methdologies to help?)

## Part 1 — the SURPRISE-TO-CORPUS loop

A standing review at the end of a task: was anything UNEXPECTED, statistically
or logically? If so, and it happened inside a process that runs often, that is
a candidate for a new skill, a guidance line or a tool refinement — and the
agent PROMPTS THE USER rather than adding it unilaterally.

Three things make this worth designing rather than asserting:

- **What counts as unexpected.** 'Statistically' implies a base rate, and the
  corpus carries none for anything today. LOGICAL surprise — a premise that
  turned out false, a gate firing for a reason nobody predicted — is cheaper
  to detect and is probably where this starts.
- **The recurrence test is the filter.** A surprise inside a one-off is an
  anecdote; the same surprise inside a weekly process is a defect in the
  process. Without that filter this generates noise every turn.
- **PROMPT, never write.** The owner said prompt. Same rule as
  deletion-requires-confirmation, pointed the other way: the agent proposes a
  durable change to the corpus and a person decides.

THIS SESSION IS ITS OWN EVIDENCE. Four logical surprises, each costing a
cycle, each reaching a skill only because somebody happened to notice:

1. potracer treats ZERO as foreground — the inverse of the name (5r57)
2. Image.crop past the edge pads with BLACK, which a tracer reads as ink (5r57)
3. .fa-qr-toggle stopped being an IDENTITY the moment a second button reused
   it as a box class, breaking 39 test selectors at once
4. a bean id read off a listing that sliced one character too many — the
   parent 'hvw' did not exist and the create failed silently behind a
   `tail -1`, after the wrong id had already been written into a pushed
   commit message. The general shape: a truncated identifier that still LOOKS
   like an identifier.

Number 4 is the best argument for the loop. It was caught by accident.

## Part 2 — the META-PROCESS: where does a thing go?

Many specialised answers to one question, and no general one. From the corpus:
beans vs issues vs PRs (issue-working); bean type and parent (todo-manager,
check-bean-parents); which graph a directory holds
(content-context-and-state-graphs); adapter vs profile vs visualiser
(content-profiles, issue #764); AGENTS.md vs a skill (the banner atop
AGENTS.md); skill vs agent memory (agent-memory); spec on the issue vs in the
graph (4kq7); which harness's docs/ owns a link (crdm-detect, added today).

Each is well argued in isolation. Nothing says WHICH question you are asking —
and an agent who does not know a rule exists cannot look it up.

This bean is itself an instance: choosing where to file IT took a judgement
call (PROCESS epic ahvw, over QA, KG, or a new root).

## Part 3 — the owner's question, recorded UNANSWERED

> any lit we need on proven methdologies to help?

Candidates to CHECK, none endorsed here; the owner picks:

- after-action review / blameless post-incident practice — the closest mature
  literature to part 1
- information architecture and faceted classification — for part 2
- Diataxis — for what KIND of document a thing should be
- ADRs (architecture decision records) — this repo already does something
  close, in long commit messages and issue specs

## Done when

- [ ] a written rule for when a surprise becomes a corpus candidate, with the recurrence filter
- [ ] the prompt is a PROMPT — the agent never writes corpus guidance unasked
- [ ] a routing skill naming the filing questions and pointing at the skill that answers each
- [ ] the owner has said which methodologies, if any, to draw on
