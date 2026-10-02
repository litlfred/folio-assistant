---
# folio-assistant-5yrl
title: Declared image roles have no consumer check — dh4f applied to a role
status: completed
type: task
priority: normal
created_at: 2026-09-22T06:08:05Z
updated_at: 2026-09-22T07:16:07Z
parent: folio-assistant-o3xy
---


Split out of `blv9` on 2026-09-22, because the two are different questions
over different corpora and folding them in would have made one gate answer
two things.

`blv9` asked whether a path **will resolve** — its subject is Liquid
interpolations in Jekyll templates, and its gate
(`scripts/check-docs-templates.ts`, shipped 2026-09-22) judges literals and
DECLINES variables. This bean asks whether a declaration is **read at all**:
for every `role` on an `images[]` entry in an instance declaration, is there
a consumer that actually reads images filtered by that role?

That is the `dh4f` shape — a consumer scans nothing and reports a clean run
over it — applied to an image role instead of a directory.

## Why it is not a one-line grep, and this is the whole reason it needs a bean

`blv9` recorded the finding that makes the naive version wrong. It is worth
restating here rather than pointing at it, because a reader who only sees
"check every role has a consumer" will build the naive version:

> `cat-harness.json` declared `role: "browser-icon"` on `mark-small` and
> nothing consumed it — the site emitted no favicon at all. But the reason
> was **not an absent caller**. `imagesForRole()` (`schemas/kg-node.ts`)
> filters on `i.role === role && i.layout !== undefined`, and a mark carries
> no `layout`, so the lookup returned an EMPTY MAP and said nothing about
> why. A caller existed; it could not reach what was declared.

So the check wants **two halves**, and the second is the one that catches the
real instance:

1. every declared `role` is named by at least one consumer; **and**
2. every lookup used to consume one can actually MATCH what is declared — a
   role whose images carry no `layout`, queried through a layout-keyed
   function, is unreachable by construction.

Half (1) alone would have caught the favicon case only by accident.

## What is already fixed, so the gate is regression cover not a bug hunt

`imageForRole()` exists as a SIBLING of `imagesForRole()` — added rather than
loosening the layout-keyed one, because the two answer genuinely different
questions and merging them would hide the layout contract the landing path
depends on. The favicon is served. This bean does not re-fix that; it asks
for the check that would have found it.

## Expect a third state

`check-docs-templates` needed one (literal judged, variable declined) and
`check:partition` names its own. A consumer reached through a variable role,
or through an indirection this tool cannot follow, is **declined** — listed,
not counted clean, and never in the failing set. An examined-clean case and
an unexaminable one must not look alike.

## Out of scope, recorded so it is not re-derived

`blv9` also found a **prose** claim about an asset that was never true (a CSS
comment asserting the mark used `currentColor`, measured false against every
commit that ever touched the icons). A comment is a declaration too, but that
shape is not mechanically checkable, and saying so out loud is better than
pretending a gate will cover it.

## Done when

- [x] Half (1): every `role` declared on an `images[]` entry across every
      instance declaration is named by at least one consumer.
- [x] Half (2): every lookup used to consume a role can match what is
      declared — no layout-keyed query over layout-less images.
- [x] A third state for roles whose consumer cannot be determined; declined
      is listed and never counted clean.
- [x] Falsified both ways: remove a real consumer → caught; restore → clean,
      and the declined set does not move.
- [x] Registered in `package.json` and `code-quality-gates.yml`, and
      assigned in `scripts/partition/instance-rules.ts` with its reason.

## DONE 2026-09-22 — and it found a live orphan on its first real run

`bun run check:image-roles`, registered as gate **108**. Sixteen tests.

### It found `landing-architecture`, declared and named by nothing

Two images (`laptop`, `card`) in `cat-harness.json`, and **no theme in
`themes.ts` names that role** — six others do. Art that arrived for a theme
nobody wired. It is also incomplete: `resolveThemeBackdrop` refuses a partial
backdrop wholesale, so even once wired it would render nothing until a
`mobile` crop exists.

### Why the existing test could not see it, which is the whole argument

`schemas/themes.test.ts` walks **every** theme with a backdrop and asserts all
three layouts resolve. That is a good check, and it scans
**consumer → declaration** — so a declaration NO consumer names is outside its
domain *by construction*. It reports clean over exactly this case.

This gate scans **declaration → consumer**. The two are not redundant; they
are opposite directions over one join, and only one of them can see an orphan.

### Five states, because two would have been wrong six times over

Measured on this corpus, not designed in the abstract:

| state | count | why it is not a failure |
|---|---|---|
| `consumed` | 8 | — |
| `by-id` | 1 | `mark` is read via `decl.icon`, an **id** not a role. The role is genuinely unread and the image genuinely reached: failing it is wrong, passing it silently is a lie |
| `declined` | 0 | a role named only through a variable |
| `orphan` (permitted) | 1 | `landing-architecture`, named with its reason |
| `unreachable` | 0 | the favicon shape |

The six `landing-*` roles are consumed **indirectly** — `themes.ts` declares
`imageRole: "<role>"` and `resolveThemeBackdrop` reads the field. A check
looking inside lookup CALLS would have reported all six as orphans.

### Falsified four ways

1. Break a real consumer (`landing-library`'s `imageRole`) → caught, exit 1.
2. Wire `landing-architecture` up → **the permit becomes a finding**:
   *"permitted orphan … is no longer a finding — remove it"*.
3. Restore → clean, exit 0.
4. **Reproduce the favicon defect**: point `browser-icon` at the layout-keyed
   `imagesForRole` → caught, with the right DIAGNOSIS rather than the symptom —
   *"every consumer is layout-keyed (imagesForRole) and no image of this role
   declares a layout"*. That is the bug this bean exists for, now mechanical.

### I committed this gate's own defect, inside the gate, twice

Worth recording because both were invisible and both passed.

**One.** The first draft wrapped `readDeclaration` in `catch { continue; }`.
`cat-harness.json` **throws** without the `folio` graph kind registered, so the
only instance with images was silently skipped and the corpus fell to zero.
The `examined === 0` guard caught it — exit 2, *"examining nothing is not a
pass"* — which is the only reason it did not ship as a green gate over an
empty set. An unreadable declaration is now a **loud failure** that outranks
every clean finding.

**Two.** This file's own doc comment quotes `imagesForRole()`. The
dynamic-lookup scan matched that **prose**, marked the whole corpus
indeterminate, and turned `landing-architecture` from `orphan` into
`declined` — hiding the one live defect behind the third state built to be
honest. Comments are stripped before scanning now. *A tool that reads its own
prose is measuring itself.*

The second trigger was `kg-node.ts:484`, where `imageForRole` delegates to
`imagesForRole` with a variable role. That is the **definition** of the pair,
not a call site, and counting it made every orphan indeterminate.

### Coordination note, recorded where it will be seen

This gate carries `import "../schemas/folio-graph-kind.js"` for its side
effect — one of the 25 `harness → core` registration edges `q2wn` measured.
**PR #840 removes the need for it**, and its fixed regex will finally SEE it.
When #840 lands the import should be deleted here rather than rediscovered as
a violation. Written into `partition/instance-rules.ts` beside the
classification, not only here.

## Summary of Changes

- `cat-harness/scripts/check-image-roles.ts` — new gate, five states, a named
  permit list with a **stale-permit guard**.
- `cat-harness/scripts/tests/image-roles.test.ts` — 16 tests.
- `package.json`, `code-quality-gates.yml` — registered; 107 → 108.
- `scripts/partition/instance-rules.ts` — assigned to `harness`, with the #840
  coordination note.
- **No asset and no declaration was changed.** The orphan is permitted and
  named, because both fixes are the owner's: adding an `architecture` theme
  needs a mobile crop that does not exist, and removing the two declarations is
  deleting a durable artefact.

## 2026-09-22, same session — #840 landed and the coordination note paid off

The note written into `partition/instance-rules.ts` said the side-effect
import `import "../schemas/folio-graph-kind.js"` would become both
UNNECESSARY and VISIBLE when `q2wn`'s PR #840 merged, and should be deleted
then rather than rediscovered as a violation.

#840 merged within the hour. The import is **removed**, and the removal was
**tested rather than assumed**: with it gone, `readDeclaration` still resolves
the `folio` kind and the gate reports the identical 10 roles — because #840
moved the registry to a leaf and put the trigger at `cat-harness.ts`'s foot,
so loading the reader is now a precondition of calling it.

`gates` 108/108 on the merged tree. The note in `instance-rules.ts` is
rewritten from a prediction into a record of what happened; a coordination
note that survives its own event is the stale-permit defect in prose.
