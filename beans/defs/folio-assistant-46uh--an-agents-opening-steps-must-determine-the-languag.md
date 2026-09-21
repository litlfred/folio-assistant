---
# folio-assistant-46uh
title: An agent's opening steps must DETERMINE the language it communicates in, rather than defaulting to the one the tooling happens to be written in
status: todo
type: task
priority: normal
created_at: 2026-09-21T22:04:33Z
updated_at: 2026-09-21T22:04:53Z
parent: folio-assistant-bzyu
---


Owner, 2026-09-21:

> part of agent first task is to determine appropriate lanaguge when
> speaking/communicating regrafless of context

## What is missing

This repository has a great deal about the language its **content** is in —
`translation-manager` carries `available_locales`, the source-language rule,
coverage badges, the per-locale `.po` resolution. Searching the skills for a
rule about the language an AGENT SPEAKS IN returns nothing.

So the language of every turn is currently decided by accident: the skills are
written in English, the corpus is English, and an agent therefore answers in
English without ever having asked whether that is right for the person in
front of it. That is a default masquerading as a decision — the same shape as
every other defect this repository names, where the absence of a determination
is indistinguishable from a determination that happened to agree.

"REGARDLESS OF CONTEXT" is the load-bearing phrase. It is not "detect the
language of the request and mirror it" — that answers only the easy case, and
it fails silently for a person who writes a terse instruction in one language
while wanting the report in another, or who can type a language more easily
than they can read a wall of it.

## Where it belongs

An opening step, beside the others an agent performs before durable work —
`opening-brief` and the session-start sweep are the neighbours. It is **not**
a line in `AGENTS.md`: that file's own banner says a rule living only there is
a rule with no home, and this one governs behaviour on every turn, so it wants
a skill and a place in the sweep's output.

## Questions this has to settle

- **What is the determination made FROM?** The person's own turns are the
  obvious signal and the weakest one. A declared preference — where a person
  states it once and it holds — is stronger, and this repository already has a
  place for a person's standing choices.
- **What is it recorded IN, so a sibling session does not re-ask?** The
  `interaction/` graph is `context` (read at session start, never written by a
  process), which is the right layer to READ it from and the wrong one to
  write it to.
- **Does it apply to what an agent WRITES as well as what it says?** A commit
  message, a PR body and an issue comment have other readers than the person
  in the chat, and the answer for those is plainly not "whatever language this
  person prefers". The rule needs that boundary drawn explicitly or it will be
  read as covering everything.

## Done when

- [ ] a skill states how an agent determines the language it communicates in,
      and when it re-asks
- [ ] the determination is recorded where a sibling session reads it rather
      than re-deriving it
- [ ] the boundary between SPEAKING to the person and WRITING durable
      artefacts is stated, not left to judgement
- [ ] the session-start sweep reports the determination, so "never decided"
      is visible rather than silent
