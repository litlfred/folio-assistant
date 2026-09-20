---
# folio-assistant-frq2
title: 'RELEASE PATH: release-please names config files that do not exist, and both release workflows document another repository''s behaviour'
status: todo
type: task
created_at: 2026-09-20T20:46:25Z
updated_at: 2026-09-20T20:46:25Z
parent: folio-assistant-vke6
---


Found while establishing the ground for bean `dhvf` (instance versioning,
issue #592). Not that bean's to fix, but a versioning scheme built on this
release path would inherit all of it.

## Measured 2026-09-20 on branch `claude/sharp-ptolemy-6qxh77`

### 1. `release-please` is passed config files that are not in the repository

`.github/workflows/release-please.yml` ends with:

```yaml
config-file: .github/release-please-config.json
manifest-file: .github/release-please-manifest.json
```

**Neither file exists.** `ls .github/release-please*.json` → no such file. So a
dispatch of this workflow fails at the action, and the failure is only
discoverable by dispatching it — which nobody has (see §4).

This is the one defect here that is **not** already self-documented.

### 2. Both workflows' headers describe another repository, at length

`release-please.yml` opens with ~20 lines describing a `push`-to-`main`
trigger and *"the 7 published packages under `tools/`"*, naming `pyhecke` and
`qou-substrate`. Root `tools/` holds **one file**, `index.ts` — Tool node
definitions, not publishable packages.

**The file does correct itself**, ~60 lines down, in a `TRIGGERS, ACTUAL`
block: the real trigger is `workflow_dispatch` only, the prose is the other
repository's, copied at the split (`109a4ff`) with the trigger neutered and
the text left alone. It cites bean `5rfy`.

**That correction sits BELOW the false description, and the cost is
measured:** an agent reading this file on 2026-09-20 stopped at the header
and reported to the owner, as fact, that the workflow *"runs on every push to
`main` against config files that do not exist."* The first half was false and
the second half true, which is the worst combination — a real defect arriving
inside a wrong story. A correction a reader meets after the claim is a
correction that only works on readers who finish.

`release-folio-assistant.yml` is the same shape: its header says *"Triggers
on: Tag push matching `folio-assistant-v*`"*, and its `on:` block is
`workflow_dispatch` only.

### 3. The install line names the WRONG REPOSITORY, and the workflow emits it

`release-folio-assistant.yml`, line 4 (header) and **line 86 (the output the
workflow prints to whoever dispatched it)**:

```
bun add https://github.com/litlfred/qou/releases/download/<tag>/folio-assistant-<version>.tgz
```

`litlfred/qou`, not `litlfred/folio-assistant`. Line 4 is stale prose; **line
86 is the workflow instructing a user to install this package from a
repository that does not host it.**

### 4. Zero tags

`git tag | wc -l` → **0**. Neither release path has ever run, so nothing about
either is known to work — including §1's missing config and §3's install URL,
both of which would surface on the first real attempt.

## What is NOT this bean

- **"The workflow never fires on its own."** That is `5rfy` (archived), which
  classified 29 of 32 workflows as dispatch-only and asked for each to be
  sorted into correctly-manual / belongs-to-the-folio / should-fire-and-does-
  not. `release-please` being dispatch-only may well be correct here. This
  bean is about it being **broken when dispatched** and **misdescribed**.
- **Whether this repository should use release-please at all.** That is
  `dhvf` and `fsh-guts/proposals/instance-versioning.md` §5, which deliberately
  does not depend on it.

## Done when

[ ] `release-please` either has its two config files or stops naming them
[x] The install URL in `release-folio-assistant.yml` names this repository.
    **Done 2026-09-20** (`90ebd7c5`): the release body now interpolates
    `${{ github.repository }}` rather than a corrected literal — the workflow
    creates the release in the repository it runs in, so deriving it cannot
    drift, whereas hardcoding `litlfred/folio-assistant` would reproduce this
    exact defect one rename later. The header comment's copy is fixed too.
[ ] Each header describes THIS repository, with the corrections moved above
    the prose they correct rather than below it
[ ] One release cut end to end, or a recorded decision that neither path is
    used — zero tags and a documented release process is a claim nothing has
    tested
