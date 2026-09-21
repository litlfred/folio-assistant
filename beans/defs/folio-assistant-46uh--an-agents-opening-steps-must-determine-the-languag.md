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

## Owner, 2026-09-21 — the MODEL's own languages are part of the determination

> note if agent was not trained primaruily in english, the agent/person
> staring the bootstrap on that model should potentially use other lanuges
> than english (especially if human validated) should clarify each new model
> added to bootstrap which of the preferred languages

This sharpens the bean considerably, and in a direction it had not considered
at all.

### What it adds

The bean asked what the determination is made FROM and offered two weak
answers — the person's own turns, and a declared preference. **A third input
is the model the agent is running on.** A model trained primarily in a
language other than English is not well served by a harness that assumes
English, and neither is the person working with it: the competent language for
that pairing may be neither the corpus's nor the requester's first guess.

*"Especially if human validated"* is the load-bearing qualifier. A model's own
claim about which languages it handles well is not evidence; a person having
checked it is. So the declaration carries a **validation state**, not just a
list — the same distinction this repository draws everywhere between a
determined answer and an assumed one.

### Where it goes: bootstrap, per model

> should clarify each new model added to bootstrap which of the preferred
> languages

So this is a **declaration on the model**, in bootstrap, made when a model is
added — not something derived at runtime and not something an agent decides
about itself. Bootstrap is the right home for the same reason it holds the
other things true before a harness exists: an agent reaching for its
communication language has not yet loaded the harness that would otherwise
answer.

### What this does NOT license

An agent choosing a language because its model prefers one. The person's
needs outrank the model's competence: a model strong in a language the person
does not read is worse than the fallback, not better. The model's languages
are an INPUT to the determination and never the determination itself — and
the bean's existing question about where the answer is recorded still stands.

## Done when — added

- [ ] each model declared in bootstrap names its preferred language(s)
- [ ] that declaration carries whether a HUMAN validated the claim, because
      a model's own word for it is not evidence
- [ ] adding a model without the declaration is a finding rather than a
      silent default to English
- [ ] the determination reads the model's languages as one input among the
      person's stated preference and their own turns — never as the answer
