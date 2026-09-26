---
# folio-assistant-0jjz
title: 'BOOTSTRAP: one line at the top of AGENTS.md and README that starts a cold session'
status: completed
type: task
priority: high
created_at: 2026-09-19T08:56:10Z
updated_at: 2026-09-19T08:58:34Z
---

Raised by the owner 2026-09-19, mid-session:

> the agent should have been able to start a new session know how to start
> beans/instantiate fix with skills/readme/agents.md (one line directive, like
> read this file first or whatever)

## The defect, measured 2026-09-19 on this branch

A cold agent's first job is to get `beans` in hand — without it, it cannot
claim, cannot create, and works unclaimed. The instruction that says so
(`AGENTS.md` §"At session start", with
`scripts/install-beans.sh && export PATH="$HOME/.local/bin:$PATH"`) sits **at
line ~470 of a ~700-line file**, below thirteen other sections. `README.md`
opens with a description, six badges and a platform-vs-content note, and does
not mention beans at all before its own table of contents.

So the first thing to do is the last thing you find. There is no one-line
directive at the top of either file saying *do this first*.

## This has already cost something, and it is written down

`AGENTS.md` §"At session start" records it in its own words: on 2026-09-18 a
session read the sweep's then-parenthetical hint, carried on reading `beans/`
by hand, and completed **two merged PRs' worth of durable work unclaimed** —
the exact failure the work plan exists to prevent.

The fix applied then was to make the session-start hook run the installer
itself. That is the right move and it holds **only where the hook runs**. An
agent in another harness — Gemini CLI, Cursor, Copilot, all of which
`AGENTS.md` line 3 claims read this file natively — gets no hook and no sweep.
For them the buried paragraph is the whole bootstrap.

## What to do

A one-line directive at the very top of `AGENTS.md` and of `README.md`, above
everything else, pointing a cold agent at the bootstrap it must run first.
One line, not a section: the failure mode here is length, and adding a
fourteenth section to fix "the important thing is buried" would be self-
defeating.

Note the constraint in `AGENTS.md`'s own 🛑 banner: that file is a bootstrap
pointer and the discipline lives in `skills/`. A pointer is exactly what this
is, so it belongs there — but it must **point**, not restate. If it grows a
rule of its own it has become the migration debt the banner warns about.

## Done when

- [x] `AGENTS.md` and `README.md` each open with one line that a cold agent can
      act on without reading further
- [x] the line points at an existing skill or script; it states no new rule
- [x] an agent with no session-start hook can follow it and end up with `beans`
      on `PATH` and the work plan primed
- [x] `CLAUDE.md` and `GEMINI.md` still work as thin stubs — they inherit the
      line via `@AGENTS.md`, so they must not get their own copy

## Not doing

Rewriting the §"At session start" section. The content there is correct; it is
only unreachable from the top.


## Summary of Changes

One sentence added to each file, directly **below** the `# ` title and above
everything else — the description, the badges, the 🛑 banner. Above the title
was rejected: a floating sentence before the H1 breaks the document for a human
reader and for GitHub's rendering, and buys an agent nothing, since line 3 is
already the first line of body text.

`AGENTS.md:3`

```
**Cold start — run this before any durable work:** `scripts/install-beans.sh &&
export PATH="$HOME/.local/bin:$PATH" && beans prime`, then
[§"At session start"](#at-session-start) for the rest; the session-start hook
does it for you only where a hook runs.
```

`README.md:3`

```
🤖 **Agent cold start — run this before any durable work:**
`scripts/install-beans.sh && export PATH="$HOME/.local/bin:$PATH" && beans prime`,
then [`AGENTS.md` §"At session start"](AGENTS.md#at-session-start) for the rest.
```

It **points and does not restate**. The command is the one already written in
§"At session start" (`AGENTS.md:786`) plus the `beans prime` from that section's
own "Running the pieces by hand instead" line; the trailing clause paraphrases
that section's own account of the hook rather than adding a rule. Everything the
line does not carry — the `beans-fallback.ts` degraded path, the duplicate-title
guard, the order the sweep emits in — stays where it is, reached by the link.
The README reuses the 🤖 marker the file already uses for its agent-onboarding
pointer, so a human reader recognises the line as not addressed to them and
skips it in one glance.

**Verified 2026-09-19.**

- `grep -n install-beans AGENTS.md README.md` → the two new occurrences at
  `AGENTS.md:3` and `README.md:4`, alongside the five pre-existing ones.
- `ls -l scripts/install-beans.sh` → present, mode 755.
- The composite command run end to end in this container: exit 0, the installer
  reporting `beans already installed: /root/.local/bin/beans`, and `beans prime`
  emitting the work-plan priming block. On a container where the binary is
  absent the installer's `go install` path is the one the session-start sweep
  already uses; that branch was not exercised here, because the CLI was already
  installed.
- `bun run readme:audit` → `20 link(s) checked, 20 resolved, 0 dead; 24 not
  checked (external)`. Stashing the change and re-running gives 19/19, so the
  one added link is the new `AGENTS.md#at-session-start` and it resolves. The
  audit reports no pre-existing dead links.
- `bun run readme:sync:check` → unchanged: the README carries no generated
  markers, so the new line sits outside any managed region and nothing can
  overwrite it.
- `CLAUDE.md` and `GEMINI.md` read in full and left untouched — four lines each,
  ending in `@AGENTS.md`, so both inherit the directive with no second copy.

**Not verified:** that the line actually changes a cold agent's behaviour — that
is only observable in the next fresh session in a harness with no session-start
hook.
