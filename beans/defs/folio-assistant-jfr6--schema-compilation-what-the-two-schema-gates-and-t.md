---
# folio-assistant-jfr6
title: 'SCHEMA + COMPILATION: what the two schema gates and tsc actually cover, and the generated-artefact class neither of them sees'
status: in-progress
type: task
priority: normal
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

## What exists, measured 2026-09-21

- Schema: `check:kind-validators`, `check:schema-nodes` — two gates.
- Compilation: `typecheck` (`tsc --noEmit -p tsconfig.json`).

## The class neither of them sees, demonstrated the hard way

`tsc` compiles the **generator**. It says nothing about the artefact the
generator writes. On 2026-09-21 six generated viewer pages shipped JavaScript
that did not parse while `typecheck`, every link check and the site build were
all green — because every check looked at the page as *text* or as a *file*.
**A page whose script does not parse is a 200 with working links.**
`generated-viewer-scripts.test.ts` now compiles each inline script via
`new Function`; that is one instance of a general gap, not the whole of it.

The general question this bean owns: **for each generated artefact kind, what
would a consumer actually do with it, and does any check do that?** A JSON that
parses is not a JSON that validates; a `.jsonld` that validates is not one whose
`@context` resolves; a `.bpmn` that is well-formed is not one the engine loads.

## Done when

- [x] Enumerated — **derived from `package.json`**, never listed: a check
      counts when its script runs with `--check`. **42** of them
- [x] The gap is the finding, and it is now reported per kind:
      `check:artefact-verification` requires each to declare what verifies the
      artefact **for its consumer**, or that nothing does **and why**
- [x] Derived, never hand-listed — a new generator is picked up with no edit
      to the gate, and a test pins that property

## The measurement

**Every one of the 42 checks asks about CURRENCY** — *would the generator
write something different from what is committed?* None asks the consumer's
question: *does this artefact work?*

`library:viz:check` was **green** while the page it generated could not run.
The committed bytes were exactly what the generator would write; the generator
was writing JavaScript that did not parse (PR #805).

| | |
|---|---|
| generated-artefact checks | **42** |
| containing **no** parse or validate call at all | **18** |

**The other 24 are `undetermined`, NOT `validated`** — they parse *something*,
which does not establish that they validate their *output*. They may be
parsing their input. A heuristic that cannot tell the difference must not
report it as if it could; writing "24 validated" would have been exactly the
over-claim this bean exists to find.

## A second finding, from reading the guard rather than trusting it

`generated-viewer-scripts.test.ts` — the guard added for #805 — said *"every
inline script in every generated viewer"* while walking **two hardcoded
trees**, `library` and `schemas`. Measured: **12 of 31** generated pages.
`voices`, `uploads` and `docs-auto` were never examined.

Widened to **derive** the trees. **12 → 31 pages, 19 newly covered.** All 19
parse, so nothing was broken — but nothing had been looking, which is the
state this bean is about.

That is the same defect as the one it was guarding against, one level up: a
narrower-than-stated coverage claim, invisible because what it misses is
silent.

## The declaration

`artefact-verification.json` — three states, and **undeclared is the
finding**: "nobody has said" is not "nothing to check". A `none` entry needs a
**reason**; an empty one looks decided and is not. The file may only shrink as
entries move from `none` to `verified`, and a declaration for a check that no
longer exists is reported stale.

Seeded honestly: **5 verified** (the viewer families the widened guard now
genuinely covers), **37 awaiting assessment** — marked as such rather than
described as fine.

`bun run gates` — 109 of 109.