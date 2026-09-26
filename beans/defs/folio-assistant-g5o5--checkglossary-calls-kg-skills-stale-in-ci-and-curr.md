---
# folio-assistant-g5o5
title: check:glossary calls kg-skills STALE in CI and CURRENT in two local environments, on a commit whose only diff is an e2e comment
status: in-progress
type: bug
priority: normal
created_at: 2026-09-26T14:02:57Z
updated_at: 2026-09-26T14:03:32Z
parent: folio-assistant-1xhc
---

## What was measured, 2026-09-26, on PR #1405

CI step 15 of the `gates` job — `glossary page and SKOS` — failed on `ba7af05f6a1`:

    ✗ stale: cat-harness/docs/glossary/skills/index.md
    ✗ stale: cat-harness/docs/assets/glossary/cat-harness--kg-skills.skos.jsonld
    ✗ stale: folio-assistant-core/glossary/generated/cat-harness/kg-skills.glossary.json
    Run `bun run glossary:page` and commit the result.

**It is the `kg-skills` glossary, and I cannot reproduce it.**

| probe | result |
|---|---|
| `check:glossary` in the working checkout at that exact commit, tree clean | **PASS** |
| `glossary:pot:check` same | PASS |
| `bun run glossary:page` then `git status` | **empty** — the generator reproduces what is committed |
| `check:glossary` in a detached throwaway worktree at the same commit, **no `_kg/`**, no nested `block-qa-schema/node_modules` | **PASS** |
| CI, step 15, same commit | **FAIL** |

So two local environments — one of them deliberately stripped of the residue that has explained every other CI/local disagreement today — agree with the committed artefacts, and the runner does not.

### What makes it strange rather than merely environmental

The **previous** head, `00ba25c5b26`, passed step 15 in CI nine minutes earlier. Verified from the step list rather than inferred from job duration, because I had first guessed it from the 38s-vs-19s runtime and that is not evidence.

The entire diff between those two commits is **+24 lines in `cat-harness/test/navbar-row.e2e.ts`** — a comment and one `page.mouse.move`. Nothing in a KG directory, nothing a skills glossary should read.

    git diff --stat 00ba25c5b26 ba7af05f6a1
     cat-harness/test/navbar-row.e2e.ts | 24 ++++++++++++++++++++++++

### Hypotheses NOT adopted, and why each was dropped

- **Residue** (`_kg/`, nested `node_modules`) — the throwaway worktree had neither and still passed. This is the explanation that fits every other case today and it does not fit this one.
- **Nondeterministic file ordering in the generator** — would fail on every CI run, not the second of two nine minutes apart.
- **The comment introduced a glossary term** — then the local generator would produce a diff. It produces none.

Naming a mechanism without the run is what  warns about in its own *"What is NOT claimed"*, and this session has already corrected two plausible-sounding causes stated with the authority of a measurement. So: **could not determine.**

### What would settle it

The generated content CI produced. Nothing available to this session prints it — the Actions log gives the three `✗ stale` lines and no diff, and re-running a job is not in reach here. A `--check` that printed the first differing line, or wrote the regenerated file as an artefact, would have answered this in one read instead of five probes.

## Done when

- [ ] Someone reproduces it, or the next CI run on a fresh commit shows it transient
- [ ] If it recurs: `glossary-page.ts --check` reports WHAT differs, not only THAT something does
- [ ] If it is environment-dependent, the dependency is named — the three artefacts are committed, so whichever environment is wrong is publishing a wrong glossary
