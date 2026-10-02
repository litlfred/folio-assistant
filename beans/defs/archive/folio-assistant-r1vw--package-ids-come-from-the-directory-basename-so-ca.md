---
# folio-assistant-r1vw
title: Package ids come from the DIRECTORY basename, so bootstrap/skills/ mints package/skills and collides
status: completed
type: task
parent: folio-assistant-zzmr
created_at: 2026-09-20T17:06:00Z
updated_at: 2026-09-20T17:06:00Z
---


## Measured 2026-09-20, in `_kg/folio-assistant.jsonld`

A `SkillPackage` node's id is minted from the **directory basename**, not from
the `name` field in the directory's own `package-manifest.json`. Eleven of the
twelve packages in the root graph hide this, because their directory is named
after the package:

```
package/authoring-math   package/folio-core       package/raci
package/content-lifecycle package/folio-document-adapter package/remote-stubs
package/crdm             package/folio-paper-adapter    package/workflow
package/authoring-who-smart-guidelines  package/graph-management
package/skills                          <-- the twelfth
```

`bootstrap/skills/package-manifest.json` declares `"name": "bootstrap"`.
Its node is `package/skills`, **named `skills`**. The manifest's own name is
dropped.

## The collision that follows

`cat-harness/src/skills/` is the other declared kg directory whose basename is
`skills` (declared as `cat-harness-src`). Both mint `package/skills`, so in the
root's graph that one node has **5 members**:

```
skill/bootstrap-kg-navigation   <- bootstrap/skills/
skill/confirm-harness               <- bootstrap/skills/
skill/discussion                    <- bootstrap/skills/
skill/log-message                   <- bootstrap/skills/
skill/corpus-grep                   <- cat-harness/src/skills/
```

A cat-harness skill is published as a member of bootstrap's package. Nothing
reports it: both sides resolve, no link dangles, and the audit's `skill-servable`
criterion is *satisfied* by the collision — `corpus-grep` is served because a
package it was never listed in happens to exist.

## Why it is `dh4f`-shaped rather than cosmetic

An id derived from a path is an id two paths can agree on by accident. The
failure is silent in both directions: bootstrap's package loses its declared
name, and cat-harness's unmanifested skill gains a package it never claimed.
The one node that would have caught it — a uniqueness check keyed on the
manifest `name` — cannot exist while the name is not what the id is made of.

## Relation to `pve3`

This is a **third** symptom of the same asymmetry, alongside the three dangling
`bindsLane` links and the `kg-navigation` docs collision (`v3se`): all three
exist because the root declares `bootstrap/skills/` as one of its own kg
directories. Dropping that declaration (`pve3`'s "neither" option) removes this
one too — but the id-minting defect would survive, waiting for the next two
directories to share a basename.

## Done when

- [ ] A package node's id comes from its manifest `name`, with the directory
      basename as the fallback only when no manifest declares one.
- [ ] Two packages minting one id is a FINDING, not a silent merge.
- [ ] `corpus-grep`'s membership is whatever it should actually be —
      `src/skills/` has no `package-manifest.json` at all, so "no package" may
      be the honest answer.

## Closed 2026-09-20

`packageIdFor(dir)` in `kg-export.ts` reads the directory's
`package-manifest.json` `name`, falling back to the basename when no manifest
declares one. One resolver, used at all three sites that composed the id
independently: the skill side's `inPackage`, the directory-stub loop, and the
manifest-backed replacement under `skills/`.

The `seen` Set is gone. It deduped on basename and its `continue` **was** the
bug: two directories wanting one id was indistinguishable from the same
directory twice. A second claimant is now a `problems[]` entry naming both
directories and the remedy; one node is still emitted, because dropping it
would dangle every `inPackage` edge pointing at it.

Measured, before → after:

```
SkillPackage nodes      12 → 13
package/skills          5 members → 1   (corpus-grep only)
package/bootstrap   absent  → 4     (the four bootstrap skills)
dangling internal links 0 → 0
```

Six tests in `kg-export.test.ts` under *"a package's id is declared, not
derived from its path"*: ids are unique; `bootstrap` is named by its
manifest; its members are exactly the four; **`corpus-grep` is not among
them** — the assertion that was false while every signal said healthy; a
manifest-less directory falls back and reports `hasManifest: false`; and,
over the whole corpus, every manifested package's id equals its declared name.
That last one is the mechanism rather than the outcome: `bootstrap/skills`
and `src/skills` are the only colliding pair here, so an outcome-only test
would pass over a corpus with nothing left to detect the day one is renamed.

**Left alone deliberately:** `corpus-grep` still sits in `package/skills`,
named after `src/skills/` because that directory declares nothing. The bean's
third item asked whether "no package" is the honest answer instead. It may be
— but that is a decision about `src/skills/`, not about how an id is minted,
and folding it in here would have hidden the measurement above inside a second
change.
