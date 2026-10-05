---
# folio-assistant-rva2
title: 'STATE BRANCH P7: declare every special branch with the same field — gh-pages (within folio, keyed by commit, back-link = build.json) and lake-cache/*'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-04T17:33:45Z
parent: folio-assistant-fs43
---

The general practice: every graph not on main is a declared sub-graph with a back-link {ref, sha} to the content commit it describes. build.json (bean r6es) is the first back-link.

## Done when
- [ ] gh-pages declared
- [ ] lake-cache/* declared
- [ ] audit:coverage sees all special branches

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md


## Owner's ruling, 2026-10-03: per-harness and per-instance, never one central table

The owner, on being shown that `cat-harness/scripts/special-branches.json` describes
itself as *"the ONE declaration of the names"*:

> *"that doesnt seem right. each harness declares it, (and each instance can also
> declare), why centralize?"*

That is this bean's target, and the file's own `$comment` already agrees — it calls
itself INTERIM and names this bean as where it folds in. The agent that quoted
"the ONE declaration" as if it were the design was reading a file's description of
its current role as architecture.

**Three arguments, in increasing force:**

1. **The same rule already governs directories.** An instance declares what it holds,
   inherits its dependencies' entries, and overrides match on the entry's `id`, not
   its path. A special branch is the *storage* of a declared graph, so it belongs on
   that same entry rather than in a parallel table.

2. **A central table drifts, and has.** Measured 2026-10-03: the file declares
   `cat-state` while the live branch is `cat/cat-harness/state`, and declares
   `cat-qa-reports` while the three branches that actually exist are
   `cat/cat-harness/{beans,state,todos}`. Nothing binds the table to the harness that
   writes the branch, so the rename happened and the declaration did not move. A
   declaration owned by the writer cannot drift that way: the name and the writer are
   one change.

3. **Cross-repository, it cannot even be verified where it lives — this is decisive.**
   Measured across all 705 refs of this repository: `fhir-ast/*` is **0 branches** here
   (they are in `litlfred/smart-trust`) and `lake-cache/*` is **0 branches** here (they
   are in folio repositories such as `litlfred/qou`). A table in folio-assistant
   declaring branch names that exist only in *other* repositories is unverifiable at
   its own location, which is why its `repos:` field has to say "none in this
   repository" in prose. The harness that owns the branch is the only place the
   declaration can be checked against reality.

**What stays shared, and it is not the names — it is the RESOLUTION RULE.** The file's
stated reason for being JSON is real: a folio may restore a Lean cache with no `bun` on
the path, so a shell or Python reader needs it. And readers and writers must resolve
identically, or a writer creates a branch a reader cannot find — which is the live
`cat-state` failure above. So: each harness declares its own, each instance may override
by `id`, and ONE resolver implements the rule for all of them.

### Why this is still blocked, measured rather than assumed

The `storage` field this bean needs **is not on `main`**: zero hits for a `storage`
field in `cat-harness/schemas/cat-harness.ts` at `origin/main`, against 7 hits for
`graphKinds` with the same grep shape — so the empty result is a fact and not a broken
pattern. It arrives with arc `3fva`, which exists only on PRs #1764 and #1801. So this
bean is blocked on those landing, and the interim table is unavoidable until then.

**Interim obligation, so the stopgap is at least correct:** bean `32f6`'s rename must
also fix the table's `name` fields to the slashed form in the same change. Leaving them
flat means a writer resolves `cat-state`, finds nothing, falls through to the legacy
`state` which no longer exists, and creates a THIRD name for a branch that already has
two.

## 2026-10-04: route seeds are unmeasured by state-drift (from lehh)

Both route-keyed seeds, cat/cat-harness/uml-overview and cat/fhir-harness/ig-docs, write `seededFrom` (a sha) and `directories[]` into their manifests, with no `source.ref` and no `graphs[]`. So state-drift reports neither (ig-docs has no row; a row would be the wrong direction under the 2026-10-03 ruling). When this bean moves the readers onto declarations, it should read a route seed as current with main by construction, compare `directories[].path`, and drop what the manifest's `excluded` globs name. A draft that did this over rows was written and dropped, unpushed, on the owner's correction. Measured by hand: ig-docs is in sync with main for all three IGs.

_2026-10-04T17:01:12Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-04: unblocked, claimed, and the owner's call — retire the table first

The block above has cleared: `storage` is on main (DirectoryStorageSchema, with `commit | tip | route` and, since lehh, a `family` form with an optional remote `repository`). Asked which clean break comes first, the owner chose **retire special-branches.json** (option 1 of 4; the others were one spelling (`source` only), and dropping the legacy names, bean oycs).

### Inventory, measured 2026-10-04 by `git ls-remote`
- folio-assistant: cat/cat-harness/{beans,fsh-guts,merge-queue,qa-reports,state,todos,uml-overview}, cat/fhir-harness/ig-docs, gh-pages.
- litlfred/smart-trust: cat/fhir-harness/fhir-ast/* and cat/fhir-harness/ig-docs. litlfred/smart-base: cat/fhir-harness/fhir-ast/*. litlfred/qou: none of either family.
- **No legacy name exists on any of the four** (no cat-*, no bare qa-reports/state/fhir-ast/lake-cache). So the legacy fallback can go WITH the table rather than after it, on these four. Other folio repositories were not checked.
- **cat/cat-harness/merge-queue exists and no row declares it**: the drift a central table invites, measured.

### Row by row: where each goes
| row | becomes |
|---|---|
| qa-reports | already `storage` on every qa directory; the row is dropped |
| beans, todos, fsh-guts | already `storage` (tip); dropped |
| state | retired branch, read by nothing; dropped (state-drift names it from its own manifest, not a row) |
| fhir-ast | `family` storage on the consuming instance (smart-trust done in lehh; smart-base next) |
| lake-cache | `family` storage in folio-assistant-sci. OPEN: a member mounts into `<lake root>/.lake/`, and the dot-prefix guard refuses a dot segment in a declared path |
| gh-pages | the published site, declared with lehh's site graph |
| merge-queue (no row today) | declared on the directory its writer, merge-queue.ts, owns |

### Readers to move onto the one resolver
TypeScript: subgraph-source (`special` field, specialBranchFor), state-drift (iterates rows), state-seed (keyed by row id), resolve-subgraph, tools/index. Shell and Python, which run without bun: lake-cache.sh, lake-cache-fetch(.sh, -multi.py), lake-cache-produce.py, reseed-lean-cache.sh, rename-special-branch.sh, the lake-cache-restore action and its paper template copy. Today special-branches.test.ts checks each shell `mirror` against the table; afterwards it checks them against the DECLARATION.

### Order
1. Declarations for every row that lacks one.
2. TS readers onto declarations.
3. Shell mirrors checked against declarations.
4. Delete the table and its legacy fallback in one commit.

Coordinated on #2055 (bean zxvh), which adds size budgets INTO the table; the suggestion there is `storage.budget`.

_2026-10-04T17:01:12Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-04: the owner's sharper ruling — the table leaves infrastructure; it may survive only as a health check

Owner, verbatim: *"i want to retire special-branches.json from being in infrastructure. it can be in health checks. there should not be a central registry for declaring mount tools and subgraph types"*.

So the end state is **no reader resolves a branch name through a central file.** Declarations are the only source. Whatever survives belongs under `test/health/` and is OBSERVED, not declared: a check that lists the special branches on each remote (`git ls-remote`) and compares them with the declarations. It reports an undeclared branch, a declared one that is absent, and a legacy name still present. That check would have reported today's finding, `cat/cat-harness/merge-queue` (on the remote, declared nowhere), which no table did. Siblings: folio-assistant-dmx1 (graph kinds declared per harness) and folio-assistant-j9cs (mount tools declared on storage). The row-by-row plan above stands; step 4 becomes 'delete the table, and add the health check in its place'.

## 2026-10-04: lake-cache's mount path, and step 2 done

**Owner ruling (option 1 of 3): lake-cache mounts at a plain `lake-cache/`**, and lake-cache.sh links `.lake` to it, so Lake still finds `.lake/`. The dot-prefix guard stays absolute; the one dot path is a link the tool owns, not a declared graph. Rejected: excusing `.lake/` by name in the guard, and declaring no mount path. The shell change is step 3. It alters how every Lean folio restores its cache, so it has to be exercised in one (qou) before it lands.

**Step 2 done (64f5b80).** No TypeScript reader resolves a branch through the table.
- `state-drift` OBSERVES the remote (`git ls-remote` over `cat/**` plus gh-pages) and names each branch by the directory that declares it. Measured today, undeclared: `merge-queue` (an authoritative store) and `gh-pages`. Route seeds are measured for the first time: uml-overview is 29 files behind; ig-docs is in sync.
- `state-seed --id` resolves by declared id, branch name, or last segment.
- The resolver attaches no row.
- `resolve-subgraph` no longer exits 2 for a declaration with no row. It did, which meant the table was gating the declarations.

**Left:** step 3, the shell mirrors (lake-cache.sh, lake-cache-fetch*, lake-cache-produce.py, reseed-lean-cache.sh, rename-special-branch.sh, the restore action and its template) reading the prefix from the folio-assistant-sci declaration; then delete the table and its `special-branches.test.ts` mirror check, with `state-drift` as the health check.
