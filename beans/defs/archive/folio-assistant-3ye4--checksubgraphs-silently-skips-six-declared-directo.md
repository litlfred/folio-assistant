---
# folio-assistant-3ye4
title: check:subgraphs silently skips six declared directories — repository scope falls out of attribution
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:29:19Z
updated_at: 2026-09-20T17:31:48Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 by the guard added in the same change, after `check:subgraphs`
reported **0 dangling links** over a corpus where a just-moved page still
carried seven.

## The gap

`owningDirectory` compares a file's path in the INSTANCE's path space. A
directory declared `scope: "repository"` resolves outside the instance, so
`relative(instanceRoot, file)` yields a `../…` path that matches no declared
prefix — and every file in it is attributed to nothing and swept past.

Six declared directories hold markdown and contributed **no** attributed file:

| directory | verdict |
|---|---|
| `fsh-guts/` | **deliberate.** Retired content is not held to link resolution — a thing in the trashcan is there because it was superseded, and its links pointing at what moved is expected |
| `bootstrap/skills/` | a gap |
| `beans/` | a gap |
| `todos/` | a gap |
| `memory/` | a gap |
| `smart-kg/methodologies/` | a gap |

## Why this is recorded rather than fixed here

The fix is a path-space decision, not a patch: `owningDirectory` would have to
compare against each directory's own root rather than the instance's, which
changes what "owns" means for every consumer of it — including
`subgraphTree`, where the repository-scoped `smart-kg/methodologies/` is
**deliberately** not read as a child of `methodologies/` (bean `x4v4`). Making
scoped directories attributable without breaking that is the work.

## Why the SILENCE was the defect, more than the gap

Skipping retired content is defensible. Skipping it silently is not: `0
dangling` then reads as *"everything resolves"* when it means *"everything I
looked at resolves"* — could-not-determine rendered as clean, which this
repository refuses in `ci-health`, in `health`, and in the kg-qa third state.
The sweep now prints what it did not examine, so the clean line above it is
bounded by something a reader can see.

## Done when

- [ ] a scoped directory's files are attributable to it, without
      `subgraphTree` starting to read `smart-kg/methodologies/` as nested
- [ ] `fsh-guts/` stays exempt, and the exemption is DECLARED rather than
      falling out of a path bug — it is currently the right answer for the
      wrong reason
- [ ] the `NOT EXAMINED` list is empty or every entry on it is a stated
      decision

---

## Resolved 2026-09-20 — and the fix was one argument, not a path rule

`owningDirectory` compares in the space of the path it is GIVEN, and
`scanSubgraphs` was handing it `relative(instanceRoot, file)`. Every resolved
directory already carries `absPath`, so absolute is the space in which an
instance-relative and a repository-scoped entry are commensurable at all.
Passing the absolute path is the whole fix.

**Attribution 636 → 1139 files.**

### The number moved the right way, which is the check that matters

Dangling links went **0 → 26**. That rise is the verification: a fix here that
left the count at zero would have attributed nothing and looked identical
from outside. The earlier "0 dangling" was a statement about six directories
the sweep never read.

The 26 split as 19 `fsh-guts`, 6 `beans`, 1 `bootstrap`.

### `fsh-guts` is now exempt BY DECLARATION

It was already skipped — by the path bug. **Right answer, wrong reason**, and
therefore not one anybody could rely on: the moment attribution was fixed, 19
findings appeared in retired content that is superseded by definition.

Keyed on the declared graph kind, not a new field: the directory already says
`graphs: ["fsh-guts"]` and `isPublishedGraphKind` already answers exactly this
question. Same shape as the `published: false` a skill now carries — the thing
says what it is. The sweep prints `EXEMPT BY DECLARATION` so the decision is
readable rather than inferred.

### The seven real ones were all wrong paths, not dead references

Every target existed. Six in `beans/` were pre-split (`../../skills/…` from
`beans/defs/`, which resolves to `beans/skills/`) or wrong-depth from
`beans/defs/archive/`; one in `bootstrap` wanted `../AGENTS.md` and asked
for `AGENTS.md`. All repointed, each target asserted to exist before writing.

### The trap the bean named in advance, checked

Making scoped paths attributable must not make `smart-kg/methodologies/` read
as a child of `methodologies/` — that separation is deliberate and settled in
`x4v4`. `subgraphTree` still reports `methodologies ⊃ methodology-crdm,
methodology-raci` and nothing else, and a test pins it.

### Now gated, and only now

`check:subgraphs` exits non-zero on a dangling link. It read 0 while six
directories went unattributed, so gating it then would have enforced a
statement about what the sweep happened to look at. The ENTANGLEMENT report
stays ungated on purpose — disentangling is outstanding work by the owner's
own framing, and a gate on that is one somebody switches off.

Falsified: added a link to nothing, gate exited 1; removed it, exited 0.

Verification: `bun run gates` **59/59**; `bun test` **4062 pass, 0 fail**.
