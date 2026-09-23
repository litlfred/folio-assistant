---
# folio-assistant-izqr
title: 'BOOTSTRAP ON AN EMPTY REPO: seed main first, then bootstrap onto it'
status: todo
type: task
created_at: 2026-09-22T22:56:13Z
updated_at: 2026-09-22T22:56:13Z
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
