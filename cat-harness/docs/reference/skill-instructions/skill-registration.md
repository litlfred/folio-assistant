---
layout: default
title: 'Adding a'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/skill-registration.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/skill-registration.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/skill-registration.md){: .fa-edit-source }

{% raw %}
# Adding a skill

One command, before you commit:

```sh
bun run skills:register
```

It declares the skill, generates everything derived from it, and iterates until
the generators agree. `bun run skills:register:check` is the same question
without writing, and it is a gate — a skill that arrives undeclared fails CI.

## What a skill file owes, and why you cannot see it

Three things nothing derives for you, and none of them is in the file you just
wrote:

| artefact | where | produced by |
|---|---|---|
| a `skills` entry | the package's `package-manifest.json` | declared, not generated |
| a published reference page | `docs/reference/skill-instructions/<name>.md` | `skills:docs` |
| a `kg-qa` sidecar | `test/results/kg-qa/skills/<pkg>/<name>.kg-qa.json` | `kg:audit` |

Then a cascade: the schema reference, the glossary and its SKOS export, the
docs-auto index, the UML overview, the PROV-QAQC report, the tools viewer and the
detangle measurements all read something that just changed.

**The reason this needs a skill at all is that the feedback arrives somewhere
else.** CI judges the *merge* of each pull request's head into the base, so an
undeclared skill on `main` fails the gate set on **every open pull request** — and
the author who sees the failure is whoever opens the next one. Between 2026-09-24
and 2026-09-26 that happened **seven times**, and seven different sessions each
diagnosed it from scratch.

## Why one pass is not enough

The generators feed each other. Run them in order once and the earliest is stale
against the latest — measured on 2026-09-26, when `docs:auto` went stale behind
`glossary:page` and a green-looking chain still failed CI. `#1376`'s author
records the same lesson from four earlier pull requests.

`skills:register` iterates and **asserts** convergence by re-running each
`:check`, rather than running a fixed number of passes and hoping. If it reports
non-convergence, that is a finding to report — not a reason to run it again.

## Do not re-add `roles:`

`roles:` is **retired**. It carried 325 annotations across 140 files, was read by
nothing, and pointed at actor ids — `reader`, `collaborator`, `owner` — that have
never existed in any commit.

It keeps coming back, and `check-retired-front-matter.ts` says why in its own
docblock: *"the corpus that taught every agent here to write it is the corpus in
front of them: copy an adjacent skill's front matter and the field is back."*
Three of the seven merges above reintroduced it exactly that way.
`skills:register` strips it and tells you it did.

If a skill *should* declare who performs it, that is bean `y1w9`, and the field
has to be declared before it is written.

## Removing or renaming a skill: two orphans, and they are yours

`skills:register` **reports** these and does not fix them. That is deliberate,
not an omission.

- **A manifest entry with no file.** `kg:audit` calls this
  `manifest-skill-exists` at severity **critical**. Pruning it automatically
  would decide, on your behalf, that nothing referenced the name — and
  `KNOWN_DANGLING` in `skill-manifest-coverage.test.ts` is empty on purpose *"so
  a future entry is added here consciously, with the reason, instead of the check
  being loosened"*.
- **A derived artefact whose subject is gone.** `kg:audit` reports `SUBJECT GONE`
  and refuses to delete it. That is
  [`deletion-requires-confirmation`](deletion-requires-confirmation.md): an agent
  never removes a durable artefact on its own initiative. No amount of
  regenerating settles it, which is why the chain reports non-convergence rather
  than looping.

Both were found by breaking the tool rather than by designing it — registering a
probe skill and then deleting it produced one of each.

## What this does not decide

Whether a skill should exist, what it should say, or which package it belongs in.
This is about the declarations a skill owes once you have decided to add it. For
where a new thing goes at all, start at
[`where-does-this-go`](where-does-this-go.md).
{% endraw %}
