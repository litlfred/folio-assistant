---
# folio-assistant-pesg
title: A review re-derived a finding the instrument had already computed, and got it wrong
status: todo
type: bug
parent: folio-assistant-ahvw
created_at: 2026-09-25T16:05:34Z
updated_at: 2026-09-25T16:05:34Z
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

- [ ] `goal-review` distinguishes *re-measure the window* (right) from
      *re-derive a committed check's findings* (wrong), and says to quote the
      check and name it.
- [ ] `deletion-requires-confirmation` says the candidate list must name which
      instrument produced it, so the owner can see whether a hand-built list is
      being presented as a measured one.
- [ ] Consider whether `health`'s findings should carry the check id in a form
      a report can cite, so quoting is easier than re-deriving.
