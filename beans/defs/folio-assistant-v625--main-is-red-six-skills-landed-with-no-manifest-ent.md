---
# folio-assistant-v625
title: 'MAIN IS RED: six skills landed with no manifest entry and no reference page — one cause, four failing gates'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-26T05:10:48Z
parent: folio-assistant-1xhc
updated_at: 2026-09-26T05:11:00Z
---

`main` was red in CI, and four of its seven failures had one cause: **six skill
files existed with no package-manifest entry and no published reference page.**

| file | manifest | reference page |
|---|---|---|
| `crdm/crdm-needs-assessment.md` | missing | missing |
| `crdm/crdm-impact-analysis.md` | missing | missing |
| `crdm/crdm-requirements-template.md` | missing | missing |
| `workflow/code-review-process.md` | missing | missing |
| `workflow/branch-freshness.md` | missing | missing |
| `workflow/release-lifecycle.md` | missing | missing |

Both `skill coverage` and `skill package manifests cover the package` named the
IDENTICAL six. This is the `decision-methodology-selector` defect (fixed
2026-09-25, one file) recurring at **six**.

## Registering a skill is a CHAIN, and nothing performs it atomically

This is the finding worth keeping. Fixing the two named gates made **four more**
go red, and fixing those made **two more** go red. Each regeneration staled the
next artefact:

```
add 6 to package-manifest.json
  -> gen-skill-docs            (6 reference pages)
     -> gen-docs-pages         (docs pages index)
        -> translation:index   (35 translations index)
           -> docs:harness     (harness docs)
              -> state:visualizer
```

Six steps. An author who adds a skill and runs the two obvious ones lands a
tree that is red in four other places, and **every one of those reds names a
generated file rather than the skill they added** — so the cause is invisible
from the symptom. That is why this recurred: the first author was not careless,
they were three steps short of a chain nobody has written down.

**`bun run gates` is the only thing that finds the whole chain**, and only by
running it repeatedly until the set stops changing: 7 -> 8 -> 7 -> 4 here, with
the membership changing each time, not just the count.

## A separate defect on the same four files

`check:retired-front-matter` was red on four of the six, and it is NOT the same
cause — measured before and after registering them: 4 findings both times. They
carried `roles: [reader, collaborator, owner]`, a field the gate records as
retired, read by nothing, and *dangling from its first commit* — those three
actor ids have never existed in any commit. Removed.

Worth separating because the shared file list made it LOOK like one cause. It
was two causes on one set of files, and asserting the first would have been
wrong.

## I committed `kfkh`'s defect while fixing this one

Adding `parent:` to this bean by regex inserted a SECOND `priority:` key, and
`check:bean-front-matter` caught it — the duplicate-front-matter-key defect
`kfkh` records, reproduced live by the tooling-free edit. Fixed by deduping
keys within the front-matter fence.

## Measured

| | before | after |
|---|---|---|
| `bun run gates` | 7 of 153 failed | **4 of 153** |
| `bun test` failures | 8 (local worktree) | **1** |
| `skill coverage` | 6 missing | 0 |
| `skill package manifests` | 6 unlisted | 0 |
| `check:retired-front-matter` | 4 | 0 |
| `gen-skill-docs --check` | red | green |

The remaining 4 are pre-existing on `main`, each verified there directly:
`bun test` (one failure, the drift test below), `check:glossary`,
`translation:drift:check` (**25 newly drifted — identical count on pristine
main**), `docs:auto:check`.

## Done when

- [x] The six are in their package manifests and have reference pages.
- [x] The retired `roles:` key is gone from the four that carried it.
- [x] Every artefact the chain stales is regenerated.
- [ ] The chain is written down somewhere an author adding a skill will find
      it — or, better, one command performs it. Neither is in this change.
- [ ] `translation:drift:check`'s 25, `check:glossary` and `docs:auto:check`
      are somebody's: all three are pre-existing and none is this bean's.

---

## 2026-09-26, ~40 minutes later — IT RECURRED, and that closes the argument

This bean's open Done-when was *"the chain is written down somewhere an author
adding a skill will find it — or, better, one command performs it."* It was a
prediction. It is now a measurement.

`cat-harness/skills/workflow/release-epic-planning.md` landed on `main` from a
sibling session **after** #1378 merged, carrying:

| | |
|---|---|
| package-manifest entry | **missing** |
| published reference page | **missing** |
| `roles: [reader, collaborator, owner]` | **present** — the retired key, again |

So BOTH defects #1378 fixed recurred within the hour, on the next skill added.
Registered here through the full six steps.

**The second one tells us how it propagates.** The retired `roles:` key is not
being typed fresh each time — it is being **copied from an existing skill file
as a template**. That is why removing it from four files did not stop it: the
template it is copied from was not one of the four, or the author copied one of
them before #1378 landed. A gate that fires after the fact cannot break that
loop; only the copied source can.

### What this rules out

- **Not carelessness.** Two independent authors, two independent sessions, the
  same six-step gap and the same copied key. A process that two careful people
  fail at in one hour is a process defect.
- **Not fixed by documentation alone.** #1378's commit message wrote the chain
  down in full, and it was written down before this author needed it. Prose in a
  merged commit is not reachable from the moment of authoring.

### What the fix has to look like

One command that performs all six steps, invoked by whoever adds a skill —
plus a template or scaffold that does not carry `roles:`. Either half alone
leaves the other loop open: a command nobody runs, or a clean template with a
five-step tail still done by hand.

Still an owner decision (where such a command lives, whether it hooks the
commit boundary), so recorded rather than built. But the evidence side is now
closed: this is not a hypothetical.

