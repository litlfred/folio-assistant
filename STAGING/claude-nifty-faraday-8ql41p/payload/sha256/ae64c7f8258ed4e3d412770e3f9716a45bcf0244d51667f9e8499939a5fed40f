---
# folio-assistant-65oe
title: 'library:viz is not reproducible across environments: refScan.filesRead embeds a count of the files on disk'
status: todo
type: task
priority: normal
created_at: 2026-10-03T15:40:27Z
updated_at: 2026-10-03T15:40:47Z
parent: folio-assistant-1xhc
---

## The defect

`cat-harness/docs/assets/library/index.json` ends with

    "refScan": { "filesRead": 2663, "unreadable": [] }

`filesRead` is a COUNT OF THE FILES THE SCAN READ ON DISK. It is therefore a
property of the checkout, not of the library, and it is committed. Any two
environments whose trees differ by even one scanned file disagree, so
`library:viz:check` reports stale whenever the last writer ran somewhere else.

## Measured, 2026-10-03, on `claude/hfag-rest`

The same file across twelve commits, by author:

    d374638e5  2663  Claude (this container)
    8772ae40b  2555  github-actions[bot]
    6e979ebbc  2648  Claude (this container)
    755bad293  2540  github-actions[bot]
    a7738fb1b  2648  Claude (this container)
    fae928ce7  2647  Claude (this container)
    edfac6899  2646  Claude (this container)
    76244c5ec  2538  Claude (a different container)
    97c64796c  2537  Claude (a different container)
    9cf1c6220  2646  Claude (this container)

**Two clusters about 108 apart**, strictly by where the writer ran — CI around
2540–2555, this container around 2646–2663, an earlier session around 2537–2538.
The values ALTERNATE as the bot and this session push in turn. That is not drift;
it is two environments each correctly reporting their own disk.

## Why it went unnoticed

`library:viz` is one of the two inputs `regen` names as **UNGATED** (with
`schema:viz`), so no gate ever compares it and CI never goes red on it. The loop
is therefore silent: each side regenerates, commits, and the other side sees
stale. Four consecutive main merges on #1949 produced four such commits from this
session, which I first attributed to `merge-main-bot` failing to regenerate
ungated inputs. **That attribution was wrong** — the bot runs `regen` through
`merge-base.ts` (line 236) and commits its output. Nothing was failing to
regenerate. The artefact cannot agree across machines.

## Why it is a defect and not a quirk

The audit-coverage skill already carries the rule this breaks: **a measurement
must not be a term in itself.** `filesRead` is a measurement of the run, baked
into the run's output, where it then functions as content for a staleness
comparison.

`unreadable: []` beside it is a different thing and should stay: it names FILES,
is empty in the good case, and is the "could not determine" signal a consumer
needs.

## Options, not a decision

1. Drop `filesRead` from the committed artefact. It answers a question about a
   run, and a run's statistics belong in a tool-run sidecar, not in the index.
2. Keep it but exclude it from the staleness comparison, so the check ignores it.
3. Make the scan's denominator declared rather than observed, so the count is a
   property of the declaration and reproducible.

Option 1 is the one that matches the existing rule. Not acted on here: the owner
decides what a published index carries.

## Done when
- [ ] owner picks an option
- [ ] `library:viz` output is identical for the same tree on CI and locally
- [ ] a test fixes that, so it cannot regress silently while ungated
