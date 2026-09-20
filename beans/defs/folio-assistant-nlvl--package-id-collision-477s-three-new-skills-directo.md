---
# folio-assistant-nlvl
title: 'PACKAGE ID COLLISION: #477''s three new skills/ directories declare no name, so four claim the id ''skills'' — and #576 turns that from silent into a broken site publish'
status: todo
type: bug
priority: high
created_at: 2026-09-20T18:30:22Z
updated_at: 2026-09-20T18:30:22Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 while getting PR #576 mergeable after #477 landed (session_017PqeiS4JYySSWGAYLedmus).

## Measured

`#477` created three new top-level instances, each with a `skills/` directory
holding one skill and **no `package-manifest.json`**:

| directory | skills | declared name |
|---|---|---|
| `kg-navigation/skills` | 1 | none |
| `large-datasets/skills` | 1 | none |
| `who-iris/skills` | 1 | none |
| `cat-harness/src/skills` | 1 | none |

A package id falls back to the directory basename when no manifest names it,
so all four mint the id `skills` and collide. `cat-bootstrap/skills` is the
counter-example that shows the intended shape: it declares
`"name": "cat-bootstrap"` and does not collide.

## Why it is invisible on main today, and what changes

On `main` the collision is **silent**: a `seen` Set drops whichever claimant
arrives second, and every signal reads healthy — which is exactly the defect
PR #576 (`r1vw`) fixes by turning a second claimant into a reported problem.

So the two changes interact. With #576's branch merged onto current main,
`bun run kg:export` exits 1 with three findings:

```
✗ two skill directories claim package id "skills": src/skills and ../kg-navigation/skills
✗ two skill directories claim package id "skills": src/skills and ../large-datasets/skills
✗ two skill directories claim package id "skills": src/skills and ../who-iris/skills
```

**That is load-bearing, not cosmetic.** `kg-export.ts` runs in
`docs-site.yml` (the published site) and in `feature-staging.yml` (every
preview). Merging #576 as it stands would break both on the next push.

`bun test`, `eslint`, `tsc`, `gen:jsonld:check`, `kg:schema:check`,
`ns:check` and `check:schema-nodes` all pass on that merged tree — the
failure is only reachable through `kg-export`, which no gate in
`code-quality-gates.yml` runs.

## Why this is not an agent's call

A package id is a **published identifier**: it appears in `_kg/*.jsonld` as
the node an `inPackage` edge points at. Naming one wrong is cheap to write
and expensive to withdraw, and #576's own body deliberately left the sibling
question open — *"that is a decision about `src/skills/`, not about how an id
is minted"*.

## Options

1. **Name the three after their instance** (`kg-navigation`, `large-datasets`,
   `who-iris`), following `cat-bootstrap`'s precedent, and leave
   `cat-harness/src/skills` as the sole `skills` claimant. Smallest change,
   resolves the collision, does not touch the open question.
2. Name all four, deciding `src/skills` at the same time.
3. Make a collision a reported finding that does not fail `kg-export`, and
   name them later. Keeps the site publishing, but ships the published graph
   with a known-wrong node.

## Done when

- [ ] The owner has chosen a naming
- [ ] Each affected `skills/` directory declares a manifest `name`, or the
      decision not to is recorded
- [ ] `bun run kg:export` exits 0 with #576's branch merged onto main
- [ ] A gate runs `kg-export` (or its collision check) in
      `code-quality-gates.yml`, so this class of failure is not reachable only
      through the publish workflow

Blocks: PR #576 (`r1vw` + `rday`).
