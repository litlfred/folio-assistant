---
# folio-assistant-ucb9
title: bun run gates says which GATE failed, never which TEST — so a gate red for a known reason masks a new one
status: completed
type: bug
priority: normal
created_at: 2026-09-20T13:23:53Z
updated_at: 2026-09-20T13:56:16Z
parent: folio-assistant-o3xy
---

Found 2026-09-20 by being caught out by it, on bean `7yvd`.

## What happened

`bun test` was red locally for a known, unrelated reason — the stale
gitignored `scripts/__pycache__` of bean `koth`. Six new BPMN diagrams then
introduced a SECOND failure in the same gate
(`every activity names a skill or declares why it has none`, 17 activities).

`bun run gates` reported:

```
✗ 2 of 55 failed:
  · bun test   (typescript / bun test)
  · bun run check:undeclared-files:check
```

Identical output before and after the new failure existed. I read it as the
known one and pushed. CI caught it.

## Why this is the tool's gap and not only mine

A gate that is ALREADY red is the normal state while work is in progress, and
the summary gives a reader no way to tell "still the one I know about" from
"that one plus a new one". The information exists — `bun test` prints
`(fail) <name>` per failure — and is discarded at the summary.

The cost is asymmetric in the direction that matters: a gate going from red
to red-for-a-new-reason is **invisible**, while a gate going green→red is
loud. The invisible transition is the one that reaches CI.

## What would have caught it

Printing the failing test names under a failed `bun test` gate — the two or
three lines the runner already emits. `bun run gates` would then have read:

```
· bun test   (typescript / bun test)
    (fail) the root is clean, and stays that way
    (fail) no activity is silently skill-less        ← new
```

## Worth considering, not assumed

Whether this generalises past `bun test`. Several gates are `*:check`
scripts whose own output already names what drifted, so the summary may only
need to stop swallowing stdout on a failed gate rather than special-case one
runner. Measure before building.

## This bean's own diagnosis was WRONG, and the fix is different because of it

It says the summary "discards" the output. Read `gates.ts` before building:
each gate ran with `stdio: "inherit"`, so everything **was** printed. It
scrolled past. Nothing was captured, so the summary had nothing to quote.

That changes the fix. "Stop swallowing stdout" was never available — there was
no swallowing. And the obvious alternative, capturing with `spawnSync` and
printing after each gate, would have worked while trading a minute of live
`bun test` output for the recap. That is a regression bought with a fix.

So: a **tee**. `Bun.spawn` with piped streams pumped through to this process as
they arrive — the live output a reader already relies on — and accumulated so
the summary can quote the failing lines at the end.

`salientFailures` is deliberately NOT a `bun test` parser. Three shapes are
recognised, each naming a different kind of drift: `(fail) <name>`, a
`*:check` script's `✗`, and a thrown `error:`. Special-casing one runner would
have left every other gate exactly as opaque as before.

Capped at six distinct lines with the cap ANNOUNCED, and an unrecognised
shape returns empty with the caller saying so out loud — "this gate printed
nothing I recognised, scroll up" is a different statement from printing the
gate bare, and an unrecognised shape is not an absence of one.

## Falsified against the real situation

Two simultaneous test failures, one standing in for the known one and one for
the arrival:

```
✗ 1 of 56 failed:
  · bun test   (typescript / bun test)
      error: expect(received).toBe(expected)
      (fail) a known failure somebody is already living with [0.21ms]
      (fail) a SECOND failure that arrived later [0.12ms]
```

Which is what would have saved the session that filed this.

## Done when

- [x] a gate that is red for a NEW reason is distinguishable, in the summary,
      from one still red for the reason you already knew about
- [x] whatever the mechanism, it does not require the reader to re-run the
      gate by hand to find out — the tee keeps live output AND the recap
