---
# folio-assistant-izqr
title: 'BOOTSTRAP ON AN EMPTY REPO: seed main first, then bootstrap onto it'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T22:56:13Z
updated_at: 2026-09-30T14:56:03Z
parent: folio-assistant-vke6
---

Owner, 2026-09-22 (session_017nyJj3PsjvszpF3DyGeBgE), a side request, verbatim:

> *"when bootstrapo initailzies, if repo is empty, it should seed main then bootstrap"*

**Why it matters.** A brand-new GitHub repository has no commits and no `main`. Every later step assumes both:
- a feature branch needs a base to branch from;
- a PR needs a base branch to target;
- staging compares against `main`;
- `id-stable` and the ChangeSet diff against `origin/main`.

Bootstrapping straight onto an empty repo either fails at the first `git switch -c`, or makes the bootstrap commit itself the root of `main`. Then the bootstrap is never reviewable as a PR, and the owner's merge-confirmation rule has nothing to act on.

**What.** When bootstrap initialises and detects an empty repository (no commits: `git rev-parse --verify HEAD` fails, or the remote has no default branch), it first creates a minimal seed commit on `main`, and pushes it where a remote exists. Then it runs the bootstrap on a branch off that `main`, so the bootstrap lands as an ordinary PR.

**Open questions for the owner or a roast before building:**
- **What the seed commit contains.** A README stub? `.gitignore`? Nothing but an empty commit? It should be the least that makes `main` real, and nothing a bootstrap would then have to overwrite.
- **A remote with no push rights** to create `main`: report and stop, never bootstrap onto an orphan branch.
- **A repo that is not empty but has no `main`** (for example only `master`): that is a different case, and must not be "seeded" over.

Related: zmdo (prove an empty-repo bootstrap), which this is a precondition of. Parent is vke6 (the split), whose instances are what bootstrap produces.

## Done when
- [ ] bootstrap detects an empty repository, and says so
- [ ] it seeds `main` with a minimal commit, then bootstraps on a branch and opens the bootstrap as a PR
- [ ] a repo with commits but no `main` is reported, not seeded
- [ ] a test runs bootstrap against a freshly `git init`-ed repo with a bare remote, and asserts `main` exists before the bootstrap branch

_2026-09-30T14:55:25Z_ — Claimed by claude/magical-archimedes-4qkfxp-izqr — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Built 2026-09-30, branch `claude/magical-archimedes-4qkfxp-izqr`. New `seedMainIfEmpty(root, slug)` in `cat-harness/scripts/init-folio.ts`, called from `linkPlatform` after `git init` and before `git submodule add` (which stages `.gitmodules`, so it has to come after the branch switch).

**The open questions, settled by roast rather than guessed:**
- **What the seed contains: nothing.** It is an empty commit. That is the least that makes `main` real, and it holds nothing a bootstrap would have to overwrite; a README or `.gitignore` stub would be exactly that.
- **A remote with no push rights:** the seed commit stays local, the run reports why, and it stops. It never switches to a bootstrap branch whose base the remote lacks.
- **Commits but no `main`:** `no-main` is reported with the current branch, and nothing is seeded, since a seed would give the repository a second root.
- **Two cases the bean did not name, found while building:**
  - an empty checkout whose remote already has branches is empty only because nothing was fetched, so it stops;
  - a remote that cannot be asked is could-not-determine, so it stops too.

**Done when:**
- Box 1: done. Detection is by `rev-parse --verify HEAD`, and the result is a note in the init report.
- Box 2: **partly.** `main` is seeded and the scaffold lands on `bootstrap/<slug>`, but init-folio has no forge client, so it *tells* the caller to open the PR rather than opening it. Opening it belongs to whichever agent runs init with GitHub access.
- Box 3: done (`no-main`).
- Box 4: done. `init-folio-seed.test.ts` runs against real `git init` repositories with a bare remote: 7 cases, including that `main` is on the remote before the bootstrap branch exists and that the seed tree is empty.

Behaviour change worth knowing: init-folio's own `git init` always produces an empty repository, so every fresh scaffold now seeds `main`. Where `user.name`/`user.email` are unset, the seed commit fails, and init reports it and stops before the submodule add, where before it went on. That is deliberate: the alternative is the unreviewable root this bean exists to prevent.
