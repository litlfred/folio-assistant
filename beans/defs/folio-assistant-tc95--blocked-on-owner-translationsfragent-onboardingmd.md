---
# folio-assistant-tc95
title: 'BLOCKED on owner: translations/fr/agent-onboarding.md is an English .md in a gettext directory'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:14:28Z
updated_at: 2026-09-23T19:25:46Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 while draining bean `rl3h`. **Needs the owner: this is a
deletion, and an agent does not remove a durable artefact on its own
initiative.**

## The file

`cat-harness/translations/fr/agent-onboarding.md` — 8,656 bytes, added
2026-09-20 (commit `169b7510b5`, *"Merge main, and fix the sweep main's
memory move made blind"*).

## Why it looks wrong

It is the **only `.md` anywhere under `translations/`**, and the declaration
for that directory says what belongs there:

> *"The gettext side of translation — one directory per target locale holding
> `.pot` templates, `.po` catalogues and the `TranslationNode` `.ts`
> manifests… The INPUT to injection. There is deliberately NO matching
> declaration for the rendered OUTPUT."*

Its siblings are exactly that: `agent-onboarding.po`, `.pot`, `.ts`. The
`.md` is the odd one.

**And it is not even French.** Its front matter reads `lang: en` with the
title *"Agent onboarding"*; the real translation lives at
`docs/guides/fr/agent-onboarding.md` with `lang: fr` and a French title. So
it is an English page sitting in a French gettext directory.

## Why it matters beyond tidiness

It is the **sole remaining source of dangling links** in `rl3h` — 7 of them.
Its relative links are correct for `docs/guides/`, where the English source
lives, and resolve to nothing at `translations/fr/`. Fixing those links
would be polishing a file whose existence is the actual question, so they
were deliberately left.

## What I did NOT do

Delete it. `deletion-requires-confirmation`: report what would go, with size
and age, and wait. Both are above.

## The options, for whoever decides

1. **Remove it** — if it is a stray from the memory-move merge, which its
   commit message and its lone-`.md` status both suggest.
2. **Move it** to wherever an untranslated English source belongs, if the
   translation pipeline wants a copy as injection input. Note the pipeline
   already has `.pot`/`.po` for this page, which is the declared input.
3. **Keep and fix its links** — only if something reads a `.md` from
   `translations/`, which nothing in the declaration suggests.

## Done when

- [x] the owner has said which
- [x] `bun run subgraphs` reports **0** dangling, at which point the count
      can be gated rather than reported

## Summary of Changes

Closed 2026-09-23 **on evidence, not authorship**, in the owner's "go through remaining beans" sweep. A read-only check against `main` called it landed, and it was re-verified before closing:

The owner's standing rule decided it: fsh-guts, never delete. The file was moved to `fsh-guts/retired/translations-fr-agent-onboarding.md`, and nothing named agent-onboarding is left under `translations/fr/`. `bun run subgraphs` reports no dangling line, and `check:subgraphs` exits 0.
