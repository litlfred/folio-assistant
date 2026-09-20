---
# folio-assistant-a02m
title: 'SOLE-DIRECTORY: excising directoryForGraph relocated its defect into 32 call sites'
status: todo
type: bug
priority: high
parent: folio-assistant-kupb
created_at: 2026-09-20T11:24:49Z
updated_at: 2026-09-20T11:24:49Z
---

`ec24133a` ("excise directoryForGraph — and it took a silently-dead CI gate
with it") removed this, on the owner's instruction "excise singulsar":

```ts
export function directoryForGraph(root, graph, registry = defaultGraphKinds) {
  return resolveDirectories([{ name: "(local)", root, own: true }], registry)
    .find((d) => d.graphs.includes(graph))?.absPath;
}
```

**It removed the function, not the behaviour.** `.find(...)` is "the first one,
silently"; so is `directoriesForGraph(...)[0]`, which is what every caller was
rewritten to. Measured 2026-09-20 across the repository: **32 call sites** spell
it by hand. `scripts/schema-nodes.ts:60` carries a comment saying it was fixed
*there*, the same day — one of thirty-two, and the gate it fixed had been
scanning 1 of 3 declared `schemas` directories.

## Why it is not yet wrong, and when it becomes wrong

`[0]` is correct by ACCIDENT: every graph kind these sites ask for is currently
declared exactly once, so the first is the only. Six of the sites ask for
`library` or `uploads` — the two that `frs5` makes plural, by declaring
`library` in `who-iris/` beside wherever `milnorlink` lands.

At that moment each of the six silently scans one of two directories and
reports a clean run over both. That is `dh4f` exactly, and it is the same shape
as the two defects this branch already found by accident
(`check:schema-nodes` gating 1 of 3, `check:l1-complete` a no-op in CI).

## Done when

- [ ] An accessor exists that **refuses** when a graph resolves to more than
      one directory, rather than picking. Refusing is the property; arity is
      not — a silent singular is what got excised, and re-adding one would be
      the same bug with a new name.
- [ ] The 32 `[0]` sites are migrated, or each is annotated with why it
      genuinely wants the first.
- [ ] A gate fails on a NEW `directoriesForGraph(...)[0]`, since the last fix
      was one site at a time and that is how thirty-one were left.
- [ ] Done BEFORE the `frs5` move, not after: fix the detector, then make the
      thing it detects true, so a site that needs both fails by name.

## Falsifier

If migrating turns up sites where two directories are normal and refusing is
wrong, "sole" is the wrong abstraction and those sites need to fan out instead.
That is decided from the failures, not from reading.
