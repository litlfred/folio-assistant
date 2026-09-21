---
# folio-assistant-rl3h
title: 46 markdown links point at files that do not exist
status: completed
type: task
priority: normal
created_at: 2026-09-20T14:22:43Z
updated_at: 2026-09-20T17:31:48Z
parent: folio-assistant-zzmr
---

Surfaced 2026-09-20 by `bun run subgraphs`, which was built for bean `x4v4`
and found this on its first honest run.

**46 markdown links point at files that do not exist**, after excluding
templates and illustrative placeholders:

| directory | dangling |
|---|---:|
| `cat-harness` (`skills/`) | 37 |
| `translation-sources` | 7 |
| `methodologies` | 2 |

`methodology-crdm` had **13** and has **0** — those were left by relocating
CRDM (bean `g43o`) and were repaired in the same change that found them,
with a regression test. **These 46 are not that**: they are older, and
nobody has established where they came from.

## Why this is its own bean and not part of `x4v4`

`x4v4` declared subgraph containment and measured entanglement. Fixing 46
links found along the way would be a second change riding in an unrelated
diff — the shape `#395` refused and bean `auap` did separately. The
relocation damage was different: it was **caused by this session**, so
repairing it is finishing the earlier work rather than widening this one.

## What the shape suggests, unverified

Most `cat-harness` entries look like the pre-split layout: targets such as
`../../../scripts/install-tex.sh` and
`../../../content/quantum-observable-universe/...` are three levels up from
`skills/folio-paper-adapter/`, which was right before the instance moved
under `cat-harness/` (commit `c25761d2cf`). Others are bare siblings —
`bib-qa.md`, `integration-watcher.md` — which is the same failure mode as
CRDM's: a file moved and its siblings' links did not follow.

**That is a hypothesis from reading paths, not a measurement.** Establishing
it means checking each target against the history, which is the work.

## Done when

- [ ] each of the 46 classified: target moved (repoint), target deleted
      (remove the link or the claim), or never existed (the link was wrong
      when written)
- [ ] repointed links verified to resolve, not just to look plausible
- [ ] a link that cannot be resolved is REMOVED rather than left — a
      link-shaped value that does not dereference is the `blv9` class, and a
      reader cannot tell a stale link from a wrong one
- [ ] `bun run subgraphs` reports 0 dangling, and the count becomes gateable

## One more, found 2026-09-20 and not counted above

`cat-harness/content/docs/publication-workflow/every-workflow-in-the-repo.md`
names **`bootstrap/workflows/bootstrap.bpmn`** in its table. That file does
not exist; the process is `initialize-harness.bpmn`, and `discussion.bpmn`
and `log-message.bpmn` sit beside it unnamed.

It is not in the 46 because `check:subgraphs` counts markdown LINK targets and
this is an inline code span, not a link. Same defect class — a reference that
does not resolve — reached by a different route, which is worth noting when
someone extends the sweep: **the count is of links, not of references.**

Fixing it is three table rows and no declaration. **Do not "fix" it by
declaring `bootstrap/workflows/` at the root** — that re-introduces the 88-
reference graph leak `instance-graph-isolation.test.ts` guards, which is bean
`7u3g`, scrapped for exactly that.

## Not in scope

The 21 cross-subgraph edges the same report lists. Those are real, resolving
references between subgraphs, and whether they should exist is the
disentangling question the owner described as in progress — a different
decision, needing them.

---

## Drained 2026-09-20 — 46 → 7, and most of the 46 were my own instrument

`bun run subgraphs` now reports **7**, all from one file whose existence is
the open question (bean `tc95`, needs the owner).

### The classification the bean asked for

| | count | what happened |
|---|---:|---|
| **moved** — exactly one file of that basename exists | 10 | repointed, every new target asserted to exist before writing |
| **ambiguous** — source vs its generated copy under `docs/reference/` | 18 | repointed at the **source**, never the generated copy |
| **never existed / deleted** | 18 | see below — most were not links at all |

### Most of the "never existed" were the checker's fault, not the corpus's

This is the finding, and it changes what the 46 meant. Of the 18:

- **`[`prop:Y`](Y.md)`** sits inside an inline code span showing what a
  cross-reference LOOKS like.
- **`[audit](../../../docs/audits/...)`** is a table cell in
  `one-voice-audit.md` quoting a pattern the audit tells you to find and
  REMOVE.
- **Two invented bean ids** in a blockquoted specimen turn report.

A link inside an example is not a link. `check-subgraphs` now strips fenced
blocks and inline code spans before scanning — the same rule, and the same
reason, as `check-declared-paths`'s `stripComments`, which exists because
its scanner matched its own documentation.

Counting these was worse than an ordinary false positive: **the remedy a
reader infers is to "fix" prose that is correct**, and in the bean case to
invent two beans so a link in an example resolves.

### A second instrument bug: a rendered page is not a file

`../skills.html` was reported broken beside
`../proposals/llm-authoring-tool-integration.html`. Jekyll builds the first
from `docs/skills.md`, which exists; the second has no source and `docs/
proposals/` is gone entirely. Testing `.html` on disk called both broken;
skipping `.html` would have called both fine. The checker now resolves a
`.html` target to its `.md` source, which tells them apart — and the second
was repointed at [issue #198](https://github.com/litlfred/folio-assistant/issues/198),
where `AGENTS.md` says the Lean tooling roadmap now lives.

### Genuinely dead, and unlinked rather than left

`STATUS.md` (×3 — a root dashboard this repository does not have),
`docs/workplans/2026-06-14-latex-build-caching-strategy.md`,
`scripts/check-sidecars.sh`,
`docs/requirements/2026-07-04-folio-assistant-proof-narrative-checkers.md`,
and `content/quantum-observable-universe/notation/notation-collisions.md`
(which is FOLIO content and correctly absent from the platform).

Each keeps its text and loses its link, with a parenthetical saying where it
went — because the bean's own rule is that a reader cannot tell a stale link
from a wrong one, and a bare name that says "no longer in this repository"
tells them.

### Found outside the sweep's reach, and fixed

`docs/guides/fr/agent-onboarding.md` — the REAL French translation — had
**5 broken links on the published site**, because it sits one level deeper
than its English source and the relative paths were never rewritten.
`docs/` is not a declared directory, so `check:subgraphs` cannot see it; this
turned up only by following the stray file. Fixed, and both onboarding pages
now resolve every relative link.

### Still open

The 7, all in `translations/fr/agent-onboarding.md` — bean `tc95`. Until
that is settled the count cannot be gated, so this bean stays open.

---

## Closed 2026-09-20 — 0 dangling, and the count is finally worth gating

The last seven were found only after bean `3ye4` fixed attribution: this
sweep had been reporting **0** while six declared directories went unread, so
"drained to zero" was true of what it looked at and not of the corpus.

Those seven — six in `beans/`, one in `bootstrap/` — were all **wrong
paths, not dead references**; every target existed and each was repointed
with the target asserted first.

`check:subgraphs` now **gates** on dangling links, which is what this bean's
last `## Done when` item asked for and what could not honestly be done until
the number meant something.
