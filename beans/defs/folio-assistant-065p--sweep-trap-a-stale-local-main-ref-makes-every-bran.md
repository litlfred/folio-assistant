---
# folio-assistant-065p
title: 'SWEEP TRAP: a stale local `main` ref makes every branch look like it carries unmerged beans'
status: completed
type: bug
priority: normal
created_at: 2026-09-25T15:48:01Z
updated_at: 2026-09-27T08:27:57Z
parent: folio-assistant-ahvw
---


Found 2026-09-25 during a `/goal-review` sweep, by axis 4's own instruction —
*"Items that exist only on a branch … Sweep the open branches' stores too, or
the review is blind to the largest workstream."*

## The trap

The natural way to write that comparison is the way the skill's prose implies:

```sh
git diff --name-only --diff-filter=A main..origin/<branch> -- beans/defs/
```

In this container the local `main` ref was **2655 commits behind**
`origin/main` (`4ba8b7a6712` vs `a83f8bee902`) — because a session fetches
`origin/main` and fast-forwards its own branch, and nothing ever moves the
local `main` ref.

So every branch appeared to carry **566–573 unmerged beans**. Against
`origin/main` the true answer across the nine most recently updated branches
was **1** (`oxka`, on `claude/cool-fermi-htir5p`).

Off by ~570x, in the direction that manufactures a crisis: an agent reading
that figure concludes the work plan has fractured across branches and starts
reconciling something that is not broken.

## Why this is an instruction gap and not just a mistake

The skill says *"sweep the open branches' stores"* and names the measurement,
but not the **ref to measure against**. Both readings are grammatical and one
is silently wrong by two orders of magnitude. The same trap sits in any check
comparing a branch to "main" in a container that only ever fetches.

It is also the `dh4f` shape inverted: instead of a consumer scanning nothing
and reporting clean, a consumer scans the wrong baseline and reports a
catastrophe.

## Done when

- [x] `goal-review`'s axis 4 says **`origin/main`**, not `main`, and says why
      in one clause — so the next reader cannot pick the wrong one.
- [x] A sweep that cannot confirm its baseline is fresh reports *could not
      determine* rather than a count. An unverifiable baseline is not a
      measurement, which is this repository's own standing rule.
- [x] Check whether any committed check or script compares against a local
      `main` ref. Not yet measured — **this bean does not claim there are
      none.**

## Not in scope

Changing how sessions fetch. Keeping a local `main` current is one option and
naming the right ref is another; the second is cheaper and does not depend on
every agent remembering a step.


## Summary of Changes

Worked from `claude/brave-hypatia-r820sf` after #1425 merged, alongside `pesg` — the
two are the same shape (an instrument or an instruction producing a confident wrong
number) and they touch the same file, so they ride one PR.

**Reproduced first, and it is worse than recorded.** This container's local `main` is
**3277** commits behind `origin/main` (`cf115c6494a` vs `cc10dfb3c3e`), against the
**2655** the bean measured. The trap grows rather than ageing out, which is the
argument for naming the ref rather than asking sessions to keep a local ref current.

**Item 1 — axis 4 now names `origin/main`.** With the mechanism in one clause (a
session fetches `origin/main` and fast-forwards its own branch; nothing moves the
local ref), both measurements, and the reason the ref is named rather than left to
the reader: both spellings are grammatical and one is silently wrong by two orders of
magnitude.

**Item 2 — an unverifiable baseline is `could not determine`, not a count.** Stated as
rule 1 applied to the ref rather than to the corpus, with a runnable check.

**The check I first wrote would have FAILED in the container it is for.** I drafted it
with a literal `main`, then tried to generalise it via
`git symbolic-ref refs/remotes/origin/HEAD` — and measured that `origin/HEAD` is
UNSET in this clone, so the generic form exits **128**. The shipped form resolves and
then falls back, exactly as `session-start-coord-sweep.sh:250` already does. It also
uses an explicit refspec, because a bare `git fetch origin $DB` updates the tracking
ref only when `remote.origin.fetch` happens to cover it and exits 0 when it does not
(bean `9giz`). A guidance snippet nobody ran is not guidance.

**Item 3 — MEASURED, and it is clean.** The bean explicitly did not claim there were
none, so here is the population and the method rather than a bare verdict.

Searched every `*.ts`, `*.sh` and `*.yml` under the repository excluding
`node_modules`, for `refs/heads/main`, `main..`, `..main`, `merge-base … main`,
`--contains … main`, and separately for variables assigned the literal `"main"` from
which a ref could be built. Every hit classified:

| hit | verdict |
|---|---|
| `github.ref == 'refs/heads/main'` (5 workflows) | GitHub EVENT ref, not a local comparison |
| `.github/scripts/generate-diff.sh:66` | `git merge-base origin/main …` — correct; only its prose says "main" |
| `upload-bib-papers.sh` `DEFAULT_BRANCH="main"` | fetches into and uses `origin/$DEFAULT_BRANCH`; the bare form at :217 is `gh pr create --base`, an API argument |
| `session-start-coord-sweep.sh:250` | resolves via `origin/HEAD` with a fallback, explicit refspec |
| `skill-fetch.ts:33` `ref: "main"` | a REMOTE package ref, and `sync-remote-skills.test.ts:52` already asserts the floating form is rejected |
| `claim-bean.test.ts:58` | a test fixture creating a bare repo's `main` |
| `class="main"`, `defaultBranch: "main"` in fixtures | HTML and test data |

**0 committed checks or scripts compare against a local `main` ref.** The limit of
this measurement, stated so a later reader can judge it: it is a grep plus a
classification, so it cannot see a ref assembled at runtime from a value this
repository does not hold as a literal. Nothing suggests one exists; that is not the
same as proving it.

**Not in scope, as the bean ruled:** changing how sessions fetch. Naming the right
ref is cheaper and does not depend on every agent remembering a step.

Verified: `skill:register` (6 artefacts current, 275 skills / 19 packages),
`skill:register:check`, `skills:docs:check`, `check:bean-restates-skill`,
`check:command-paths`, `check:declared-paths`, `kg:audit:check`.
