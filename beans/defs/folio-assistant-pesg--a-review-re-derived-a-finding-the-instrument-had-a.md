---
# folio-assistant-pesg
title: A review re-derived a finding the instrument had already computed, and got it wrong
status: in-progress
type: bug
priority: normal
parent: folio-assistant-ahvw
created_at: 2026-09-25T16:05:34Z
updated_at: 2026-09-27T08:21:26Z
---


## What happened, 2026-09-25

`bun run health` reported **one** orphaned staging preview, named, sized and
reasoned:

> `STAGING/dependabot-github_actions-actions-c1d4c18a44` (101.6 MB, 1426 files)
> — no open pull request; and no branch on the remote slugifies to it.

Running a `goal-review`, I re-derived that finding instead of quoting it. I
wrote a slug function inline — `re.sub(r'[^a-zA-Z0-9]+','-',branch)` — and got
**three** orphans. I then put that number to the owner in a question, and they
authorised deleting "the 3 orphans".

The real rule, in `feature-staging.yml`, preserves `.`, `_` and `-`:

```sh
sed 's|[^a-zA-Z0-9._-]|-|g' | sed 's|--*|-|g' | sed 's|^-||;s|-$||'
```

Mine replaced `_` and `.`, so `dependabot/github_actions/actions-2e120b27c0`
slugified to `dependabot-github-actions-...` and matched no preview. Two LIVE
previews therefore read as orphaned:

| preview | actually | would have been |
|---|---|---|
| `dependabot-github_actions-actions-2e120b27c0` | **PR #1337's live preview** | deleted |
| `dependabot-npm_and_yarn-…-typescript-7.0.2` | **PR #914's live preview** | deleted |

Both are open PRs a reviewer can be reading right now. Caught only because I
measured each directory's size before deleting, saw a name that looked like an
open PR's branch, and re-checked.

## The rule was already written down, exported, and tested

`cat-harness/schemas/staging.ts` exports `stagingSlug`, with the `sed` pipeline
quoted in its doc comment — and `test/health/checks.test.ts` asserts it
**against the actual `sed` command**, shelling out and comparing. There was a
correct, differentially-tested implementation one import away, and the health
check was already using it. I wrote a fourth spelling of a rule
`schemas/attribution.ts` even warns about by name: *"three copies of `slugify`,
already drifted."*

## The gap

Not duplication in the codebase — that is already solved. The gap is that
nothing says **do not re-derive what an instrument has already computed.**

`goal-review` rule 2 says *"Measure at the window's edges, not from prose… a
count you remember from an earlier turn is neither."* That rule pushes toward
re-measuring, and it is right about remembered numbers — but a **committed
check's output is not prose and not memory**. It is the measurement, made by
code with a test behind it. Re-deriving it by hand is strictly worse: same
question, no test, and the report's own authority now rests on whichever
version the agent happened to write.

The asymmetry that makes this sharp: a re-derivation that finds FEWER items is
a harmless miss, but one that finds MORE hands the owner a larger permission
than the instrument justified. `deletion-requires-confirmation` assumes the
list put to the owner is true; nothing checks that it came from the instrument.

## Done when

- [x] `goal-review` distinguishes *re-measure the window* (right) from
      *re-derive a committed check's findings* (wrong), and says to quote the
      check and name it.
- [x] `deletion-requires-confirmation` says the candidate list must name which
      instrument produced it, so the owner can see whether a hand-built list is
      being presented as a measured one.
- [ ] Consider whether `health`'s findings should carry the check id in a form
      a report can cite, so quoting is easier than re-deriving.

_2026-09-27T08:18:52Z_ — Claimed by claude/brave-hypatia-r820sf — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## Items 1 and 2 landed; item 3 is the owner's — 2026-09-27

Worked from `claude/brave-hypatia-r820sf`, restarted from `main` after #1425 merged.

**A premise of mine was refuted before I wrote anything, and it changed the fix.**
I expected `goal-review` to be silent on re-derivation. It is not: line 242 already
says *"**covered** | read the survey; do not re-derive it."* But that is a DIFFERENT
object with a different reason — a sibling session's published survey, where the cost
is duplicated effort. This bean is about an instrument's computed finding, where the
cost is a wrong number reaching someone who acts on it. Stated narrowly and
contradicted broadly, rather than absent. The new text says so explicitly, so the two
cannot collapse into one.

**Item 1 — `goal-review` rule 2.** The qualification is folded into rule 2 itself
rather than added as a sibling rule, because it qualifies that rule: rule 2's "measure,
don't quote prose" is what pushed toward re-deriving, and a separate rule elsewhere
would be read after the damage. It says a committed check's output is not prose, that
re-deriving is strictly worse (same question, no test, authority resting on whichever
spelling you wrote), and to **quote the finding and name the check**. (Written first as
a `2a.` list item, which is not a valid ordered-list marker and would have rendered as
literal text — caught by reading the marker sequence, not by a gate.)

**Item 2 — `deletion-requires-confirmation`.** A new section at the `plj1` sequel,
plus a checklist line: does the list say which instrument produced it, or that you
built it by hand? The section records that **every rule in that skill was obeyed** on
2026-09-25 — named, sized, aged, confirmed — and the list was still wrong, because no
rule asked its provenance. And that it was caught by measuring sizes first and
noticing a familiar branch name, which is luck wearing the clothes of diligence.

**A SECOND, INDEPENDENT INSTANCE, recorded in both skills.** 2026-09-27, a different
agent on a different subject: extending `check:anchor-names`, I probed only the files
declaring an anchor-NAMED const and wrote **25** invisible ascents into a docblock
where the check's own output said **75**. Retracted in the same change. Two agents, two
subjects, one move — which is the argument for a rule rather than a caution.

**Item 3 is NOT taken.** Whether `health`'s findings should carry the check id in a
citable form is a change to an instrument's output format, and the bean says
"consider". Put to the owner rather than decided: it would make quoting cheaper than
re-deriving, which is the incentive half of this bean, but it also adds a field to
every finding and I have no measurement that the field is what was missing — the two
instances above both had a nameable check and re-derived anyway.

Verified: `skill:register` (6 artefacts current, 275 skills across 19 packages),
`skill:register:check`, `skills:docs:check`, `check:bean-restates-skill`,
`check:command-paths`, `check:declared-paths`.
