---
# folio-assistant-32f6
title: Prefix the harness's special branches with cat- (qa-reports, lake-cache/*, state); gh-pages unchanged
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T18:07:50Z
updated_at: 2026-10-03T01:00:33Z
parent: folio-assistant-fs43
---

Owner, 2026-10-02, verbatim: "need to prefix 'special' branches with cat-, cat-qa-reports, cat-fhir-ast, cat-lean-cacje (or whatever), not sure if any more. gh-pages stays as is" — and later: "(need to /coordinate and rename active branches)".

Parent: fs43, not 7x5n — fs43 is the arc whose subject is the special branches (its P7, rva2, declares every special branch with one field); 7x5n is the separation workplan this was asked from.

## Done when
- [x] Inventory of special branches with references and writers (PR body)
- [x] One declared source of truth for the names (`cat-harness/scripts/special-branches.json`) with a test that every copy agrees
- [x] Readers and writers resolve new-then-legacy name, so nothing breaks across the rename
- [x] Collision review recorded: #1764/#1801 (qa-reports), #1816 (fhir-ast), state branch session
- [ ] Owner approves the renames; renames done through the rename API (keeps a redirect), never delete
- [x] Follow-up bean (folio-assistant-oycs) for removing the legacy fallback

## Collision review (coordinate §"Before a platform refactor"), 2026-10-02, before the first edit

Open PRs scanned: all 29 (REST diffs; #1764, #1766, #1799, #1801 too large for the diff API, read from fetched branches).

| sibling | PRs | session | shared subject | files shared with this branch |
|---|---|---|---|---|
| arc 3fva (qa-reports) | #1764, #1801 (`heavy-mover`) | session_01LKpuPotV3Ve5Za75DQ3AQR | the `qa-reports` branch: `storage.branch` in 13 instance JSONs, `qa-store.ts` `DEFAULT_QA_BRANCH` | **none** — qa-reports code is not on main; its rename is listed for that owner |
| wnhh (fhir-ast) | #1816 | session_01PricYFhYhFA5DuMJaWo3CE | the `fhir-ast/<ig>` family, `ig-cache.sh`; also edits the `lean-cache-restore` skill | **none** — the skill prose is left for that owner |
| fs43 (state branch) | no PR; beans 8ez4, 2h76, rva2 | session_01KC89Knbbj8V6YL6Hrr7kk1 | the `state` branch (seeded, not authoritative) | **none** — no code reads it yet |

Phases: lake-cache/* (this branch) touches no sibling file, so it went ahead. qa-reports, fhir-ast and state renames wait on their owners.


## Agent brief — measured 2026-10-03, so the next session does not re-derive it

The owner approved the renames (via the rename API, keeping redirects, never deleting)
and asked for a one-line dispatch. These are the facts that line needs to carry, so
they live here rather than in a chat message.

### 1. ONE branch needs renaming in this repository, not a family

Measured across all **705** refs on `origin`:

| declared | legacy name | state here |
|---|---|---|
| `qa-reports` | `qa-reports` | **EXISTS — the only rename needed** |
| `state` | `state` | absent; already `cat/cat-harness/state` |
| `lake-cache` | `lake-cache/` | **0 branches** (they live in folio repos, e.g. `litlfred/qou`) |
| `fhir-ast` | `fhir-ast/` | **0 branches** (they live in `litlfred/smart-trust`) |
| `gh-pages` | — | exists; never renamed, GitHub Pages serves it by name |

The bean title reads like a family sweep. It is one rename.

### 2. The target is `cat/cat-harness/qa-reports` — slashed, NOT `cat-qa-reports`

The owner ruled the slashed form. `special-branches.json` still declares the flat form.

### 3. Fixing that declaration is part of THIS bean, not a follow-up

The file declares `cat-state` while the live branch is `cat/cat-harness/state`. Its own
resolution rule is *"the new `name` if it exists on the remote; else the first `legacy`
name that exists; else the new `name`."* For `state` the declared name does not exist and
the legacy name no longer exists either, so resolution falls through and **creates a third
name** for a branch that already has two. Every `mirrors` copy moves with it;
`cat-harness/scripts/tests/special-branches.test.ts` fails if one disagrees, so work from
the declaration's own `mirrors` list rather than grepping.

### 4. Do NOT redesign the declaration

The owner has ruled that each harness declares its own special branches and each instance
may override — that is bean `rva2`, and it is **blocked**: the `storage` field it needs is
not on `main` (0 hits for a `storage` field in `cat-harness/schemas/cat-harness.ts` at
`origin/main`, against 7 for `graphKinds` with the same grep shape, so the zero is a fact
rather than a broken pattern). It arrives with arc `3fva`, which exists only on PRs #1764
and #1801. So fix the interim table to match reality; leave the architecture to `rva2`.

### 5. Step 5 of the script will probably 403, and that is not a failure to work around

`rename-special-branch.sh` creates the new ref, reads it back, then deletes the old one
under a `--force-with-lease`. **Ref deletion is refused for an agent in this environment**,
measured 2026-10-02:

| route | result |
|---|---|
| `git push origin --delete <branch>` | `RPC failed; HTTP 403` |
| `gh api -X DELETE .../git/refs/heads/<branch>` | *"Write access to this GitHub API path is not permitted through this proxy"* |

The script fails safe — it keeps both names and says so. `/root/.ccr/README.md` says to
report such a denial rather than route around it. So: run the dry run, apply, and if the
delete 403s, **report it and hand the owner the one command** rather than attempting
another route.

    cat-harness/scripts/rename-special-branch.sh litlfred/folio-assistant \
      qa-reports cat/cat-harness/qa-reports            # dry run; --apply to do it
