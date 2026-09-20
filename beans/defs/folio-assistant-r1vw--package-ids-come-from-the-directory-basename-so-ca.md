---
# folio-assistant-r1vw
title: Package ids come from the DIRECTORY basename, so cat-bootstrap/skills/ mints package/skills and collides
status: todo
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

`cat-bootstrap/skills/package-manifest.json` declares `"name": "cat-bootstrap"`.
Its node is `package/skills`, **named `skills`**. The manifest's own name is
dropped.

## The collision that follows

`cat-harness/src/skills/` is the other declared kg directory whose basename is
`skills` (declared as `cat-harness-src`). Both mint `package/skills`, so in the
root's graph that one node has **5 members**:

```
skill/cat-bootstrap-kg-navigation   <- cat-bootstrap/skills/
skill/confirm-harness               <- cat-bootstrap/skills/
skill/discussion                    <- cat-bootstrap/skills/
skill/log-message                   <- cat-bootstrap/skills/
skill/corpus-grep                   <- cat-harness/src/skills/
```

A cat-harness skill is published as a member of cat-bootstrap's package. Nothing
reports it: both sides resolve, no link dangles, and the audit's `skill-servable`
criterion is *satisfied* by the collision — `corpus-grep` is served because a
package it was never listed in happens to exist.

## Why it is `dh4f`-shaped rather than cosmetic

An id derived from a path is an id two paths can agree on by accident. The
failure is silent in both directions: cat-bootstrap's package loses its declared
name, and cat-harness's unmanifested skill gains a package it never claimed.
The one node that would have caught it — a uniqueness check keyed on the
manifest `name` — cannot exist while the name is not what the id is made of.

## Relation to `pve3`

This is a **third** symptom of the same asymmetry, alongside the three dangling
`bindsLane` links and the `kg-navigation` docs collision (`v3se`): all three
exist because the root declares `cat-bootstrap/skills/` as one of its own kg
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
