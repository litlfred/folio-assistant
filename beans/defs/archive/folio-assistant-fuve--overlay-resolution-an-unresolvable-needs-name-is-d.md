---
# folio-assistant-fuve
title: 'OVERLAY RESOLUTION: an unresolvable needs name is dropped silently, and repoRootFor climbs out of the repo for the root instance'
status: completed
type: bug
parent: folio-assistant-uhkv
created_at: 2026-09-23T09:16:46Z
updated_at: 2026-09-23T09:16:46Z
---


Found while verifying `5kn6`'s premise — which the same measurement
**falsified**: the overlay now composes down the `needs` chain, `smart-trust`
reaching 6 skill directories where the bean recorded 0. Looking at the numbers
for every instance rather than only the `smart-*` ones is what surfaced these.

Both defects are mine, introduced this session in the `needs`-drives-the-overlay
work.

## A — an unresolvable `needs` name is dropped, and the gate reports clean

`dependenciesFromNeeds` does its job: its own docblock says *"A name that
resolves to nothing is REPORTED, never dropped. It comes back in
`unresolved`."* **`resolveInstanceGraph` then throws that array away.** It
iterates `[...derived, ...authored]` and never reads `unresolved`, so
`problems` comes back empty.

Measured on `main` at `80c18ac`:

```
dependenciesFromNeeds(repoRoot)
  derived:    []
  unresolved: ["folio-assistant-core"]
resolveInstanceGraph(repoRoot)
  problems:   []          <-- the array above, gone
```

`bun run check:instance-graph` prints **"19 instance(s): every dependency
resolves, no cycle"** over a dependency that does not resolve. That is the
`dh4f` shape with a gate on top of it: not merely silent, but actively
asserting the opposite.

## B — `repoRootFor` is `dirname`, and one instance root IS the repository root

`repoRootFor` is documented as one line and honest about it: *"It is `dirname`,
and it is a function anyway."* Its contract assumes an instance nested one
level under the repository. **`folio-assistant` is declared AT the repository
root**, so for that one instance `repoRootFor` climbs out of the checkout:

```
repoRootFor("/home/user/folio-assistant")  -> "/home/user"
instanceRootsIn("/home/user")              -> 1   (only folio-assistant)
byName                                     -> {folio-assistant}
```

so `folio-assistant-core` — which the root's `needs` names — resolves to
nothing. Consequence, measured:

| instance | reaches | should reach |
|---|---|---|
| `folio-assistant` (root) | **1** — `folio-assistant-sci/skills` only | its `needs` chain + the authored sci edge |

The one directory it does reach is the *authored* config edge, which does not
go through the broken derivation. So the failure is invisible in the only way
that matters: it looks like a working overlay with one entry.

`depends-on.ts:160` has the same call and therefore the same defect, for the
same single instance.

## Related, and NOT a duplicate

Bean `zkgs` — *"findContentRepoRoot() stops at cat-harness/"* — is a different
resolver with the same shape: a root-finder that answers with a plausible path
rather than a fault. Worth reading together, because "which root?" now has
more than one answer in this repository and neither answer fails loudly.

## Done when

- [x] an unresolvable `needs` name is a reported problem, and `check:instance-graph` fails on it — proved end to end: a bogus `needs` on `detangle` made the gate exit 1 and name it
- [x] the repository root is found correctly for an instance whose root IS the repository root — `siblingScopeFor`
- [x] both call sites use the one helper (`harness-config.ts:665`, `depends-on.ts:160`)
- [x] the root instance's overlay is re-measured and reported — **1 → 5** skill directories
- [x] tests over throwaway trees, falsified in both directions — 8, in `overlay-resolution.test.ts`
- [x] `bun run gates` green — 131

## Measured after the fix

| instance | before | after |
|---|---|---|
| `folio-assistant` (root) | 1 | **5** |

`resolveInstanceGraph(repoRoot).order` went from `["folio-assistant-sci"]` to
`["bootstrap", "folio-assistant-sci", "cat-harness", "folio-assistant-core"]`,
and `unresolved` from `["folio-assistant-core"]` to `[]`.

## The gate prints the SAME sentence as before, and that is the finding

`check:instance-graph` said *"✓ 19 instance(s): every dependency resolves, no
cycle"* before this change and says it after. Before, it was false. There is no
diff to read in that output and no way to have spotted the bug from it — which
is what defect A costs, and why the proof had to be constructed: a bogus
`needs` on `detangle` now makes the gate exit 1 and name it.

## One thing checked and found NOT to be a defect

`cat-harness` reaches `kg-navigation/skills`, `large-datasets/skills` and
`who-iris/skills`, none of which is in its `needs` chain. Those are
`cat-harness`'s OWN declared directories, carrying `"scope": "repository"` —
deliberate, and unrelated to the overlay. Recorded because it looks exactly
like overlay leakage at a glance, and the next person to read that list will
have the same question.

## Summary of Changes

Merged as [#1038](https://github.com/litlfred/folio-assistant/pull/1038) →
`6055951`, closing [#1037](https://github.com/litlfred/folio-assistant/issues/1037).

| file | change |
|---|---|
| `schemas/cat-harness.ts` | `siblingScopeFor` — the sibling-lookup scope, distinct from `repoRootFor` |
| `schemas/harness-config.ts` | uses it in `dependenciesFromNeeds`; `resolveInstanceGraph` now reports `unresolved` as `missing` |
| `schemas/depends-on.ts` | same sibling-lookup fix |
| `schemas/overlay-resolution.test.ts` | 8 tests over throwaway trees |

Measured after: the root instance goes **1 → 5** skill directories;
`unresolved` `["folio-assistant-core"]` → `[]`.

A base merge took 20 commits from `main` before the merge; the measurement was
re-run on the merged tree and still holds, and `bun run gates` was **133 green**
(main had added two gates).

## The part worth remembering

`check:instance-graph` printed the identical sentence before and after the fix.
Before, it was false. **There was no diff in that output to notice**, which is
why the fix had to be proved by construction — a bogus `needs` on `detangle`
now makes the gate exit 1 and name it.

So the lesson is not "the gate was missing". The gate existed, read `problems`,
and would have failed correctly. It was fed an empty array. A gate is only as
honest as what reaches it, and nothing tested that the feed was populated.

## Left open deliberately

Bean `zkgs` — `findContentRepoRoot()` stopping at `cat-harness/` — is a THIRD
root-finder with the same shape. Cross-referenced, not touched: it is a
different resolver in a different file, and folding it in here would have
widened a fix that was already proved.
