---
# folio-assistant-ha78
title: 'BUILT AND UNREACHABLE: 6 instances have a declared viewer no tile links, and shipping a graph adds one'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-22T06:49:16Z
updated_at: 2026-09-22T08:58:25Z
parent: folio-assistant-o3xy
---

Surfaced on 2026-09-22 by shipping `agent-skills`' voices (bean `26tu`). The
merge conflict in the generated `docs/_data/harness.json` was main adding this
finding for the new graph; regenerating kept it, because it is TRUE.

`harnessTiles` reports, per instance:

> N graph(s) have a declared viewer that exists but is not at a conventional
> path, so no tile links it — … **Built and unreachable is a different gap from
> unbuilt.**

Measured across the current tree, it now fires for **six** instances:

| instance | graphs |
|---|---|
| `cat-harness` | 2 |
| `who-iris` | 2 (`catalogue`, …) |
| `agent-skills` | 1 (`voices`) — NEW |
| `folio-assistant-core` | 1 |
| `detangle` | 1 |
| `large-datasets` | 1 |

## Why this is a bean rather than a fix in that PR

Shipping a graph does not CAUSE the gap — it joins an existing pattern that
five instances already had. Fixing it means either moving viewers to the
conventional path or teaching the tile model to link a declared non-conventional
one, and that is a decision about the tile model across six instances, not a
side effect of adding a voice.

**The reporting is working as designed.** The finding is emitted rather than
smoothed over, which is the whole point of the distinction it draws. What is
missing is somebody deciding which of the two repairs is right.

## Done when

- [x] the owner has decided: move the viewers, or teach the tiles to follow a
      declared path — **move**, 2026-09-22 (issue #886, PR #888)
- [x] whichever way, the count in `docs/_data/harness.json` drops to zero and a
      test pins it there — a finding that is merely rarer is not fixed.
      Zero corpus-wide; pinned by `viewer-undiscovered.test.ts`

---

## 2026-09-22 — the table above is four-fifths stale, and the decision is taken

**Do not plan against the six-instance table.** Measured rather than quoted:
`bun run docs:harness:check` reports `harness.json` current against the tree,
so its contents are a reading, and it carried **one** finding, not six —
who-iris's `catalogue`, at `who-iris/docs/catalogue.html`. The seven `skills`
viewers declared in #852/#870 and the two `docs` viewers in #880 closed the
rest between the bean being written and being picked up.

The table is left in place rather than edited, because it was true when
written and a bean that quietly rewrites its own history teaches the next
reader that its dated notes can be trusted less, not more. This note is the
correction; the table is the record.

**Owner decision, 2026-09-22**, choosing between the two repairs this bean
names: **move the viewer to the conventional path.** Issue #886, PR #888.

### Why it was invisible

`harnessTiles` links a declared visualiser only when its ref sits under the
published site directory — the published path is then the ref with that
prefix stripped, so there is nothing to resolve and nothing to guess. A ref
inside an instance's own tree cannot be stripped, because the build MOUNTS
that tree. `harness-tiles.ts` names this case itself as the one that
*"genuinely needs `withRoutes`"*.

### What landed

`gen-iris-pages.ts` publishes the page at `/<handler>/<kind>/<subject>/` —
composed from `subjectPage`, the same function the discovery uses, so the
generator and the tile model cannot drift into disagreeing about where the
page is. Nothing is spelled: the handler and subject are read from the two
declarations, the kind from the declaration entry that declares the viewer,
and the site directory is asked for rather than composed.

Verified by the report rather than by reasoning: the tile now carries
`catalogue -> /cat-harness/catalogue/who-iris/`, and the corpus-wide
undiscovered count is **0**.

### Three things found by doing it

- **`siteDirFor` answers relative to its instance** (`docs`, not a path). The
  first run dropped the root, wrote a stray `docs/cat-harness/` at the
  repository root, and **reported success** — the idiom every other caller
  uses is `join(ROOT, siteDirFor(ROOT), …)`.
- **`catalogue.html` was absent from `OWNED_DOCS`**, so the generator's own
  prune sweep would never have reclaimed it. Removed explicitly. The gap in
  that pattern is independent of this change and still there for the next page
  somebody adds.
- **The `--check` summary undercounted.** It printed `files.size` while
  checking `targets.length`, so a clean run said 10 where 11 were verified.
  A summary that undercounts what it checked is the mirror of one that
  overcounts.

### Falsified, and the first attempt was the wrong lever

Pointing the DECLARATION at a non-conventional file changed nothing — the
convention lookup finds the page on disk first (`found ?? declared.get(kind)`),
which is the robustness the move buys. The real falsification is moving the
PAGE back inside who-iris's tree: that turns 3 assertions red, including the
zero-pin. Recorded because a falsification that fails to fire is evidence
about the test, not about the code, and mine did not fire on the first try.
