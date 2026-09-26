---
# folio-assistant-9ici
title: readActiveVoices still reads folio.config.json after the hard break, so an old-name folio is HALF-configured
status: completed
type: task
priority: normal
parent: folio-assistant-zzmr
created_at: 2026-09-20T14:37:58Z
updated_at: 2026-09-20T14:37:58Z
---


## The contradiction, in two files a few directories apart

`schemas/harness-config.ts` states the rule in its own doc comment:

> "## `folio.config.json` is not read
>
> That was this file's name before 2026-09-18. It is **not** a fallback: a folio
> still carrying the old name is not configured, rather than **quietly
> half-configured by a path nothing else agrees about.** Rename the file."

`schemas/voices.ts:332` reads both:

```ts
for (const name of [HARNESS_CONFIG, "folio.config.json"]) {
```

So a folio on the old name gets its **voices** read and nothing else — which is
exactly the "quietly half-configured" state the comment says the hard break
exists to prevent. The comment asserts a property the code a few directories
away breaks.

## Not an oversight in the rename — a LEFTOVER from the version before it

Bean `6nfy` records both steps. The rename shipped **with** a legacy fallback
and a once-per-directory notice; then:

> *2026-09-18T17:39:02Z* — "Hard break on author's instruction:
> `folio.config.json` is no longer read at all, and `.folio/` became
> `.harness/`."

`resolveHarnessConfigPath` took the hard break. `readActiveVoices` kept the
loop. One of the eleven sites `6nfy` consolidated did not end up behind the
resolver after all — which is the failure `6nfy`'s own summary predicts, word
for word:

> "A legacy fallback written eleven times diverges at ten of them, and the one
> that forgets is the one a folio silently stops being configured by."

It diverged at one, and the divergence is in the direction that keeps a dead
name alive.

## Why this one is worth fixing rather than leaving

`readActiveVoices` has a careful three-state contract — absent / present /
unparseable — and its comment explains that collapsing the first and third is
"the defect this shape exists to prevent." All of that care is spent on a file
the rest of the platform refuses to read. A folio on the old name reaches
`readActiveVoices` and gets a **determined** answer, which is worse than the
third state: nothing anywhere says the other fifteen settings were dropped.

## Done when

- `readActiveVoices` reads `HARNESS_CONFIG` only, through
  `resolveHarnessConfigPath` like every other reader — the point of `6nfy`.
- A test asserts an old-name folio gets `undefined` from it, not a voice list.
  `scripts/tests/harness-dirs.test.ts:251` already asserts the hard break for
  the main resolver ("the old name is dead, not deprecated"); this is the
  matching case it does not cover.
- Grep for any THIRD site: this one was found by accident while investigating
  `5xfr`, not by a check, so "there are exactly two" is not established.

## Not in scope

Reinstating the fallback. The hard break is the owner's explicit instruction
(`6nfy`, 2026-09-18) and this bean is about honouring it, not revisiting it.

## Closed 2026-09-20 — fixed in #534, verified here

`readActiveVoices` goes through `resolveHarnessConfigPath` and nothing else.
The `[HARNESS_CONFIG, "folio.config.json"]` loop is gone, and the reason it
existed is recorded at the call site rather than lost: it was a LEFTOVER of
`6nfy`'s two-step rename — ship a legacy fallback, then hard-break on the
owner's instruction — and one of eleven consolidated sites kept the loop.

Which is `6nfy`'s own prediction landing on `6nfy`: *"a legacy fallback written
eleven times diverges at ten of them, and the one that forgets is the one a
folio silently stops being configured by."* It diverged at one, in the
direction that keeps a dead name alive.

The function now returns `undefined` — the third state — when no config
resolves, which is what makes the voice criteria RUN rather than reporting a
determined "no voices are active" over a config nobody read.
