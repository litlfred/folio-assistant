---
# folio-assistant-023p
title: 'A simulator block''s html: path is never checked, so a dangling one validates clean'
status: todo
type: task
parent: folio-assistant-1xhc
created_at: 2026-09-19T15:29:10Z
updated_at: 2026-09-19T15:29:10Z
---

## What

`content/pipeline/validate.ts` contains **no reference to `simulator` or
`.html`**. A `simulator` block declares `html: "simulators/x.html"`, and
nothing anywhere in the pipeline asks whether that file is on disk.

## How it was found

Measured 2026-09-19 while running `/prepare-merge` on qou#7444, which
repoints all 11 simulator paths out of the platform and into the folio.

Two of the eleven — `descent_rate_probe.html` and `multi_level_jet_sum.html`
— **exist in neither repository**. They were already dangling on qou's
`main`, at the old path, before that branch touched anything.

`bun run scripts/run-validate.ts` in qou exits **0** with 3 issues, none of
them about a simulator. Both dangling blocks pass clean. They were caught by
reading each path against the filesystem by hand, not by any gate.

`grep -n 'simulator\|\.html' content/pipeline/validate.ts` → no output.

## Why it belongs to this epic

A simulator block with a dead `html:` is indistinguishable, to every check
that runs, from one whose target is present. The folio renders a block whose
content cannot load, and the validator's `✓ Valid` is what says it is fine.

## Not the same as the `todo-html` tag

Both dangling blocks carry `tags: [..., "todo-html", ...]`, which records the
author's intent to write the file later. That is a **claim in a tag**, not a
check: nothing reads it, nothing reconciles it against disk, and a block that
loses the tag while keeping the dead path is reported by nobody.

## Done when

- A declared simulator asset that is not on disk is a finding, not silence.
- The three states are distinguished: present · absent · could-not-determine
  (an `http(s)` target, or a path outside the folio root). Absent is a
  finding; could-not-determine is never rendered as clean.
- A block tagged `todo-html` is reported **as a deferred stub** rather than
  dropped from the count — an intentional absence is still an absence, and
  "how many are deferred" is the number an author needs.
- The two known cases in qou appear in that report.

## Not in scope

Writing the two missing simulators. This bean is about the gate, not the
content; the folio decides whether those blocks get files or get scrapped.
