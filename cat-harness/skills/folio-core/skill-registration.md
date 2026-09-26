---
name: skill-registration
description: >
  Adding a skill is never a one-file change. What a new skill file owes, the one
  command that performs the derived half, the one declaration it deliberately
  leaves to you, why running it once is not enough, and the two orphan directions
  it reports rather than fixes. Read this before adding, renaming or removing a
  skill.
---

# Adding a skill

One command, before you commit:

```sh
bun run skill:register
```

It generates everything derived from the skill and verifies each artefact
landed. `bun run skill:register:check` is the same question without writing, and
it is a gate — a skill that arrives undeclared fails CI.

**`skill:register`, singular.** Two commands one letter apart existed between
2026-09-24 and 2026-09-26 — `skill:register` and `skills:register`, built by two
sessions that each looked for a command and did not find the other's. The owner
consolidated them onto this name because it was already on `main`. If you find
the other spelling in older text, it is this.

## What a skill file owes, and why you cannot see it

Three things nothing derives for you, and none of them is in the file you just
wrote:

| artefact | where | produced by |
|---|---|---|
| a `skills` entry | the package's `package-manifest.json` | **you** — see below |
| a published reference page | the site's `reference/skill-instructions/<name>` | `skills:docs` |
| a `kg-qa` sidecar | `test/results/kg-qa/skills/<pkg>/<name>.kg-qa.json` | `kg:audit` |

Then a cascade: the schema reference, the glossary and its SKOS export, the
docs-auto index and the detangle measurements all read something that just
changed.

**The reason this needs a skill at all is that the feedback arrives somewhere
else.** CI judges the *merge* of each pull request's head into the base, so an
undeclared skill on `main` fails the gate set on **every open pull request** — and
the author who sees the failure is whoever opens the next one. Between 2026-09-24
and 2026-09-26 that happened **seven times**, and seven different sessions each
diagnosed it from scratch.

## The manifest entry is yours, on purpose

`skill:register` will not add it, and that refusal is the one place the
consolidation kept the older design over the newer one. Which package a file
belongs to is *your assertion*, not a derivable fact, and a command that guessed
it would register files somebody was still drafting. The command names the file
and the remedy; you add the slug, sorted.

Everything else it either performs (the derived artefacts, and stripping a
retired key — see below) or reports and leaves alone.

## Why one pass is not enough

`skill:register` runs each writer and then **re-runs every `:check` on its own**
to assert the artefact landed. That second pass is the point: a writer can exit 0
over an artefact it failed to update, and only the `:check` form catches it.

**Do not re-derive the chain through `bun run gates`.** `bun test` runs the
detangle and `kg-audit` writers, so by the time those checks execute the
artefacts are already repaired — bean `ymsu`'s blind spot. A chain measured
through `gates` comes out two steps short, and both omissions look correct.

**Four separate attempts to recall this list produced four wrong answers**, in
both directions: steps named that adding a skill does not stale (they had gone
red in the same sessions for unrelated reasons), and steps omitted that it does.
The five in the command were each measured red-then-green in isolation. Add one
only with the same experiment, and put the measurement in the docblock.

One pairing is worth knowing because it reads like a typo and is not:
`glossary:page` is verified by **`check:glossary`**, which is that same script
with `--check`. `glossary:check` is a *different program* over the SKOS
projection. A test asserting "every check ends in `:check`" once drove out the
correct pairing and installed the wrong one — and passed.

## Do not re-add `roles:`

`roles:` is **retired**. It carried 325 annotations across 140 files, was read by
nothing, and pointed at actor ids — `reader`, `collaborator`, `owner` — that have
never existed in any commit.

It keeps coming back, and `check-retired-front-matter.ts` says why in its own
docblock: *"the corpus that taught every agent here to write it is the corpus in
front of them: copy an adjacent skill's front matter and the field is back."*
Three of the seven merges above reintroduced it exactly that way.
`skill:register` strips it and tells you it did — safe to perform automatically
for the same reason the manifest entry is not, since a retired key carries no
author intent to guess at.

If a skill *should* declare who performs it, that is bean `y1w9`, and the field
has to be declared before it is written.

## Removing or renaming a skill: two orphans, and they are yours

`skill:register` **reports** these and does not fix them. That is deliberate,
not an omission.

- **A manifest entry with no file.** `kg:audit` calls this
  `manifest-skill-exists` at severity **critical**. Pruning it automatically
  would decide, on your behalf, that nothing referenced the name — and
  `KNOWN_DANGLING` in `skill-manifest-coverage.test.ts` is empty on purpose *"so
  a future entry is added here consciously, with the reason, instead of the check
  being loosened"*.
- **A derived artefact whose subject is gone.** `kg:audit` reports `SUBJECT GONE`
  and refuses to delete it. That is
  [`deletion-requires-confirmation`](deletion-requires-confirmation.md):
  an agent never removes a durable artefact on its own initiative. No amount of
  regenerating settles it, which is why the command reports the check as still
  red rather than looping.

Both were found by breaking the tool rather than by designing it — registering a
probe skill and then deleting it produced one of each.

## What this does not decide

Whether a skill should exist, what it should say, or which package it belongs in.
This is about the declarations a skill owes once you have decided to add it. For
where a new thing goes at all, start at
[`where-does-this-go`](where-does-this-go.md).
