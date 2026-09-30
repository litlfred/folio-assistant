---
# folio-assistant-8zsb
title: 'bun test reads the CHECKOUT PATH: 2 tests fail in any worktree not named folio-assistant'
status: todo
type: task
priority: normal
created_at: 2026-09-30T17:53:09Z
updated_at: 2026-09-30T17:53:34Z
parent: folio-assistant-1xhc
---

## What was measured

`bun test` on `origin/main` `da684477383`, run four times, varying **only the
directory the checkout sits in**. Same commit, same `node_modules`, same
command.

| checkout path | basename | parent | result |
|---|---|---|---|
| `/home/user/folio-assistant` | `folio-assistant` | `/home/user` | pass |
| `/tmp/probe-main/folio-assistant` | `folio-assistant` | `/tmp/probe-main` | **28 pass, 0 fail** |
| `/tmp/wt-main-probe` | `wt-main-probe` | `/tmp` | **2 fail** |
| `/tmp/wt-ymsu` | `wt-ymsu` | `/tmp` | **2 fail** |

Two failures, and they are **two different mechanisms**. Conflating them
would hide one.

## Mechanism 1 — the BASENAME is asserted

`cat-harness/scripts/tests/navbar-consistency.test.ts:208`

```ts
const names = instanceRootsIn(REPO).map((p) => p.split("/").pop());
expect(names).toContain("folio-assistant"); // the root declares
```

`instanceRootsIn` returns **paths**; `.pop()` turns the repository root into
whatever its directory happens to be called. The literal it is compared
against is the instance's **declared id**. Those are equal only by the
convention that you clone into a directory named after the repo.

Received in `/tmp/wt-main-probe`:

```
[ "wt-main-probe", "agent-skills", "bootstrap", "bootstrap-tools", ... ]
```

Every other entry is a real declared instance. The first is a directory name.
The assertion is testing `basename(REPO)`, which is a fact about the
**operator's filesystem**, not about the corpus.

## Mechanism 2 — the PARENT is scanned, and `/tmp` is full of fixtures

`cat-harness/scripts/tests/voice-skills.test.ts:145` →
`readVoicesGraph` → `directoriesForGraph` → `resolveDirectories` →
`readDeclaration`:

```
error: /tmp/folio-dir-bad-01bGPz/folio-dir-bad-01bGPz.json is not valid JSON:
       JSON Parse error: Expected '}'
  at readDeclaration (cat-harness/schemas/cat-harness.ts:3419)
```

`/tmp/folio-dir-bad-01bGPz/folio-dir-bad-01bGPz.json` contains, in full:

```
{ not json at all
```

It is a **deliberate fixture**, built by a test that wants to prove a bad
declaration is reported rather than swallowed — and it is **never cleaned
up**. There are **163** of them in this container, the oldest dated Sep 23.

Alone that is litter. It becomes a failure because a checkout placed directly
in `/tmp` makes `/tmp` the repository's parent, so the resolver walks into the
litter and hits a file that is invalid **on purpose**. The controlled pair is
rows 2 and 3 of the table: same `/tmp`-adjacent placement, parent
`/tmp/probe-main` (empty) passes, parent `/tmp` (163 fixtures) fails.

## Why this is not a curiosity

**The standard agent worktree is `.claude/worktrees/agent-<hash>`.** Its
basename is never `folio-assistant`. So mechanism 1 fires for **every agent
that runs `bun test` in the worktree this repository tells it to use** — two
red tests that have nothing to do with the change under test.

That is `ymsu` symptom (2) — *a gate that fails for something that is not its
subject* — arriving from a direction `ymsu` did not cover: not a gate writing
into its own subject, but a gate **reading its operator's filesystem layout**
as if it were corpus.

## What it cost, measured

One full `bun run gates` run on #1616 (~25 min) reported `✗ 1 of 189 failed`
for these two tests. The branch was clean. The gate set was measuring the
worktree's name.

## Done when

- [ ] `navbar-consistency.test.ts:208` asserts against the **declared** id,
      not `basename(REPO)` — or the test is retired if the property it wants
      is already covered by the denominator test beside it
- [ ] the `folio-dir-bad-*` fixture cleans up after itself (`afterEach`/
      `rmSync`), so a crashed run leaves at most one
- [ ] decide — separately, and **not** in the same change — whether
      `resolveDirectories` walking the checkout's **parent** is intended.
      It may well be; that is what finds sibling instances. If it is, the fix
      is entirely in the fixture, and this box closes with that reasoning
      written down rather than with a code change.
- [ ] the 163 leftovers in this container are **not** deleted by an agent on
      its own initiative (`deletion-requires-confirmation`); they are `/tmp`
      scratch in an ephemeral container and will go with it.

## Not established

Whether any test **other** than these two reads the checkout path. The
measurement above is a whole-suite run, so the count 2 is the suite's answer
under one wrong name — it is **not** a proof that no third test would fail
under a different one.
