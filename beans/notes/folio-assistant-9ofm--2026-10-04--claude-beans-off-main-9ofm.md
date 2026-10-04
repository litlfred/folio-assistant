---
# note on folio-assistant-9ofm from claude/beans-off-main-9ofm
$schema: folio-bean-note/v1
bean: folio-assistant-9ofm
branch: "claude/beans-off-main-9ofm"
created: "2026-10-04"
---
## The cutover is ready except for the cutover: what is left, and the two measurements

## The cutover is ready except for the cutover, and here is exactly what is left

Dispatched to perform the flip. I did the prerequisites, measured the two
things the proposal left open, and **did not perform the cutover** — the
reason is at the bottom and it is not a judgement call I made.

### 1. `.beans.yml` needs NO change, and the §4 row saying otherwise is dead

§4 says `.beans.yml` → `path: state/beans/defs`. That row predates D4 (b).
Under the per-graph ruling a mount lands at the graph's **declared path**, so
`beans/defs` still resolves and the third-party CLI needs nothing.

Measured rather than reasoned, because "the CLI is third-party" is exactly the
claim that deserves a probe. A directory that is **not a git repository at
all**, holding `beans.json` and three bean files, with this repository's
`.beans.yml` copied beside it unchanged:

```
$ beans list
folio-assistant-fs43         E  I  ARC: state graphs on a declared 'state' …
├─ folio-assistant-9ofm      T  I  STATE BRANCH P3: migrate every reader an…
└─ folio-assistant-p3ny      T  I  STATE BRANCH P6: remove the moved state …

$ beans update folio-assistant-p3ny --body-append "CLI-write probe …"
Updated folio-assistant-p3ny …
```

So the CLI **reads and writes a mount**, finds it through the unchanged
`.beans.yml`, and needs neither git nor an index. `beans-fallback` is already
better than that: it REBASES the `.beans.yml` path onto the mount and refuses
when the graph is unreachable (`graph-read.test.ts`).

One thing does change, and it is a skill change rather than a code one (P5,
bean `89cl`): a `beans create` or `beans update` is then local to the mount
until `branch-store push --id beans`. `todo-manager`'s *"WHEN COMMITTING
include bean files"* becomes *"push the mount"*, and nothing enforces that yet.

### 2. The store is readable from the branch, with the real tooling

```
$ bun cat-harness/scripts/branch-store.ts ls   --branch cat/cat-harness/beans beans
f beans.json   d defs   d notes   d queue   f README.md   d surveys   d workflows
$ bun cat-harness/scripts/branch-store.ts read --branch cat/cat-harness/beans \
      beans/defs/folio-assistant-p3ny--…md
… status: in-progress … Claimed by claude/beans-off-main-9ofm …
```

That last line is this session's own claim, pushed to `main` minutes earlier
and then carried onto the branch by the refresh — so the branch is current to
the commit, not merely well-formed.

### 3. The seeds were stale again, and now there is a command for it

`state:drift` on arrival: `beans` drifted (**53 files**: 20 added, 12
modified, and the whole `notes/`, `queue/` and `workflows/merge-train--train-6`
additions), `todos` drifted by one file. The remedy the gate prints had no
implementation — both previous refreshes were hand-run plumbing recorded in
bean `2h76`'s body. So `state:seed` exists now, keyed by the
`special-branches.json` row (NOT the directory id, because before a cutover
the directory still declares `kind: "directory"` and `resolveTipLocation`
refuses it — a refresh keyed off the declaration is unavailable in exactly the
window it is for).

After it: `3 seeded graph(s); 0 drifted; 0 could not be determined`.

### 4. Rows done in this PR

| §4 row | state |
|---|---|
| `.beans.yml` | **no change needed** — measured above; the row is superseded by D4 (b) |
| engine `WORKFLOW_DIR` | **done** — resolves through `graphReadPath`, memoised, throws rather than reading an absent directory as "no instance recorded" |
| gates | **done** — three jobs mount every tip-keyed graph before any gate reads one; inert while nothing is tip-keyed |
| site | readers were already done (#2036); the **build-time mount** is done here; the TRIGGER is bean `fwtz` and needs more than a `branches:` entry |
| `beans-landed` | **already done** — it reads through `beans-fallback`'s `listBeans`, which relocates and refuses |
| claim | sibling PR #2042, open — and a **hard prerequisite**, see below |
| todos, issue-marks | #2042 |
| health results | untouched; its branch is not seeded |
| `folio_init` templates | **not done, and arguably should not be**: a fresh folio has no seeded branch, so writing a branch declaration into one would make its first `state:mount` fail loudly. A new folio wants `kind: "directory"` and a cutover of its own later |

### 5. Why the cutover did not happen

Two reasons, and the first is sufficient on its own.

**(a) The environment refused it.** `git rm -r beans` was denied by this
session's permission layer as irreversible local destruction, and the same
denial covers reaching the outcome another way — including mounting over the
path. The dispatch pre-authorised Phase 6; the permission system did not, and
an agent message is not consent. So the flip needs a human, or a session with
that permission. The commit is one commit and its contents are written out
below.

**(b) `claim-bean` still pushes to `main`.** Measured on
`main@abbc21c90f34`: `claim-bean.ts` pushes the claim to the default branch
from a temp worktree. After the cutover that writes `beans/defs/<id>.md` into
a `main` that no longer tracks `beans/` — re-creating the directory, which
`check:declared-dirs` then reports as `not-cut-over`, i.e. a red `main` caused
by claiming a bean. #2042 fixes it; until it merges the cutover must not land.

### 6. The cutover commit, exactly

1. `folio-assistant.json`, the `beans` entry, gains:

   ```jsonc
   "source": { "kind": "branch", "branch": "cat/cat-harness/beans", "keyedBy": "tip" }
   ```

2. `git rm -r beans` — 1442 tracked files.
3. `.gitignore` gains `/beans/`, beside the `state/` entry, with the same note:
   a READ SURFACE, never a commit on this branch.
4. `bun run state:seed --id beans --authoritative` — the branch half. After it
   `state:drift` reports `authoritative` and stops comparing, and `state:seed`
   refuses the branch (one-way, by design).
5. `bun run state:mount` to bring it back on disk, then the gates.

`.beans.yml` is NOT touched (§1). The order matters: 4 before 2 would leave a
window where neither copy is authoritative, and 2 before 1 leaves a checkout
whose declaration says the files are here.

**Count both sides.** 1442 tracked files under `beans/` on
`main@abbc21c90f34`; 1442 files in the branch's `beans` subtree at
`67265200d0ff`, tree `05fbb6a90bc1`, verified by re-reading the pushed tip.
770 open defs + 631 archived + 23 notes + 11 workflows + 2 surveys + 1 queue
+ 4 declarations and READMEs.
