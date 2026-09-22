---
# folio-assistant-lxpq
title: 'CLEAN MERGE, WRONG ARTEFACT: a generated file neither side would emit, and no conflict to flag it'
status: todo
type: bug
priority: normal
created_at: 2026-09-22T08:41:04Z
updated_at: 2026-09-22T08:41:04Z
parent: folio-assistant-1xhc
---

Measured on `main` at `3341108a`, 2026-09-22, minutes after it landed.

## What happened

Two branches changed the SAME generated artefact in ways git merged cleanly:

| side | change to `docs/assets/voices/index.json` |
|---|---|
| main (`tis1`) | added `tile.voices.count` — a projection declares its own count |
| #827 (`26tu`) | added a sixth voice, `agent-skill-authoring` |

Git had no textual conflict: one side touched the header, the other the array.
The merged file therefore declared **`count: 5` while listing 6 voices** —
an artefact **neither side would ever emit**, and precisely the failure
`tis1` was built to make visible ("a badge also makes a WRONG count visible,
where a dimmed tile only ever answers empty-or-not").

`voices:viz:check` catches it. It is in `gates`, not in the fast subset I had
already run, and I merged the PR while `gates --all` was still executing. So
the gate did its job and the human did not wait for it.

## Why this is NOT bean `520m`

`520m` is about generated artefacts that CONFLICT on a base merge — noisy, but
git stops you. This is the opposite and worse: **no conflict, no signal, a
wrong artefact.** A conflict is a question; a clean merge is an assertion that
the result is correct, and here it was not.

`qa:resolve-conflicts` cannot help either — it only ever looks at unmerged
paths, and there were none.

## The general shape

> A generated artefact committed to the repository can be merged into a state
> **no generator would produce**, whenever two branches touch different parts
> of it. The only reliable check is to RE-RUN THE GENERATOR after every merge,
> not to inspect the diff.

This branch already regenerated `kg-audit`, `harness.json` and
`published-graphs.md` after each merge by habit. `voices:viz` was missed
because the merge was CLEAN and nothing prompted it.

## Done when

- [x] `main` is green on `voices:viz:check` again
- [ ] the owner has decided whether a post-merge "regenerate everything
      declared" step is worth having, versus relying on the gates — the cheap
      version is one script that runs every `*:check`'s writer after a base
      merge, and it is exactly the blast-radius question `520m` left open
