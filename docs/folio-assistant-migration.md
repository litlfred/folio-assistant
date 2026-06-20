# Folio-Assistant Infrastructure Migration (`miga`)

**Status:** in progress · **Updated:** 2026-06-20
**Home:** this repo (`litlfred/folio-assistant`) is the canonical owner of the
generic agent infrastructure (beans work-plan, MCP server, session-start harness).
**Origin of work:** qou sessions `claude/modest-carson-xoqwps` (#2495),
`claude/beans-j8el-status-2026-06-20` (#2513),
`claude/folio-asst-beans-handoff-finalize-2026-06-20` (#2515).
**Tracking beans (qou-side):** `j8el`, `bmwh`, `17ht`, `kpzd`, `d9nu`.

> This is the single source of truth for the folio-assistant agent. It supersedes
> the earlier scattered handoff notes. §1–§3 give context, §4 records what has
> landed (qou-side and here), §5 is the folio-assistant task list, and §6 is the
> **full, self-contained requirements for the other agent** (qou-side, including
> `settings.json` work) to pick up.

---

## §1 What beans are

[`hmans/beans`](https://github.com/hmans/beans) is a Go flat-file issue tracker
storing issues as markdown under `.beans/`. It backs the agent session work-plan
and supersedes `TodoWrite` / `todos/*.json`. Discipline: **`beans ≠ sidecars`** —
never `beans create` a QA/witness/watcher queue; those stay as bulk JSON read by
their own `.ts` tooling. See `.claude/skills/local/todo-manager.md`.

## §2 Why this migration exists

The `miga` goal: qou holds **only** physics/compute/simulators; generic agent
infra (beans, MCP server, session-start harness) belongs in folio-assistant.

**Watch the failure mode:** qou commit `39fc90f6` deleted platform scripts but
left their hook references dangling. **Move *wiring* and *script* together.** A
script without its hook — or a hook reference without its script — is the bug.

## §3 Current state of this repo (folio-assistant)

The infra scripts have been copied here but still carry **QOU-specific paths**
that a generalization pass must address:

- `scripts/lean-build-bg.sh` — `/tmp/qou-lean-build-status.json`, `content/quantum-observable-universe/lean/`.
- `scripts/session-status.sh` — full capability dashboard ("QOU Session"), reads `/tmp/qou-*`.
- `scripts/session-start-coord-sweep.sh` — references `STATUS.md`, `docs/coordination/<goal>.md`, `todos/<goal>-queue.json`, and a `.claude/settings.json` SessionStart hook **that does not exist in this repo**.
- `scripts/install-beans.sh` — generic; provisions the `beans` CLI via `go install`.

Notably **absent** here: any `.claude/settings.json`; a `.beans/` store; a
`bean-coordination` skill. The active session-start hook here is
`.claude/skills/hooks/session-start.sh` (a capability prober), **not** a
settings.json hook set.

## §4 What has landed

**qou-side (per the originating sessions):**
- **#2495**: `install-beans.sh`; repaired bean-coordination stub; wired beans into
  CLAUDE.md; relocated 4 watcher queues + 38 doc repoints; repointed
  `qa-agent-drain-queue.ts`.
- **#2513**: marked bean `j8el` in-progress.
- **#2515**: handoff finalize + setup consolidation (A/B/C against qou's own
  `settings.json` + Lean scripts + retiring qou's `session-status.sh`).

**This repo (folio-assistant), this session:**
- **B (Lean flood) fixed in `scripts/lean-build-bg.sh`:** the firewall guard only
  bailed on a *missing* toolchain; an unusable-but-present elan (toolchains/ dir
  non-empty) bypassed it, so `lake` hit `release.lean-lang.org` and flooded the
  transcript with "failed to parse release data" backtraces on every resume.
  Added a `timeout`-bounded functional probe (`lean --version`) that bails when
  the toolchain is broken and the release server is unreachable, **and** changed
  the build step from `lake build 2>&1 | tee …` to a log-only redirect so any
  residual backtrace cannot reach the transcript (the timing report still reads
  the log).
- **Dangling-ref repair:** created `.claude/skills/local/todo-manager.md`, the
  beans-discipline / `bean-coordination` skill doc that `install-beans.sh`
  already referenced but which did not exist (the exact §2 failure mode).
- **This document** added as the canonical migration record.

**Deliberately NOT done here (and why):** Handoff item **C** ("retire
`session-status.sh`") was **not** applied in this repo. In qou, C was a dedup
against a wired `coord-sweep` SessionStart hook. In folio-assistant
`session-status.sh` is a substantive, multi-feature capability dashboard that is
**not wired to anything** (no `settings.json`), so the dedup rationale does not
apply and deleting it would discard working code a future wiring pass may want.
It is therefore left in place and tracked as a §5/§6 generalization item.
Handoff item **A** is qou-only (no `settings.json` exists here).

## §5 Tasks for the folio-assistant agent (priority order)

1. **Own the `bean-coordination` skill** — `.claude/skills/local/todo-manager.md`
   is the seed (this session). Flesh it out and sync the canonical version back to
   qou. *(started)*
2. **Own / generalize `install-beans.sh`** as the one source of truth.
3. **Provision the `beans` CLI in the MCP Docker image** (`Dockerfile`).
4. **Generalize the QOU-specific paths** in `lean-build-bg.sh`,
   `session-status.sh`, and `session-start-coord-sweep.sh` (drop the `/tmp/qou-*`
   and `content/quantum-observable-universe/` hard-coding; parameterize the goal
   ledger / queue locations).
5. **Own the permanent SessionStart surface** — consolidate to `beans prime`,
   **keep a CLI-independent fallback** (`session-start-coord-sweep.sh` is that
   fallback; `session-status.sh` is the richer CLI-dependent surface — decide
   whether to keep, fold, or retire it once a `settings.json` exists here).
6. **Own the generic session-start harness** — establish this repo's
   `.claude/settings.json` hook set so a future platform move cannot strand hook
   references again (§2).

## §6 Requirements for the qou-side / `settings.json` agent

This section is self-contained: an agent with access to the **qou** repo can act
on it without reading the originating session transcripts.

### A — Strip dangling hook references from qou `settings.json`
- **Where:** qou `.claude/settings.json` (this file does **not** exist in
  folio-assistant — do not look for it here).
- **What:** remove the 4 hook references whose backing scripts were deleted by
  commit `39fc90f6` (the §2 failure mode). Verify each removed reference has no
  remaining backing script; if a script *should* exist, restore the script
  instead of dropping the reference.
- **Done when:** `settings.json` parses and every remaining hook reference
  resolves to a present, executable script.

### B — Quiet the Lean hooks in qou (parity with this repo's fix)
- **Where:** qou's copy of `scripts/lean-build-bg.sh` (and any sibling Lean hook).
- **What:** apply the same two-part fix landed here:
  1. After the existing elan-toolchain dir check, add a `timeout`-bounded
     `lean --version` probe; if it fails **and** `release.lean-lang.org` is
     unreachable, `write_status unavailable` and `exit 0`.
  2. Change `lake build 2>&1 | tee "$LOG"` to `lake build > "$LOG" 2>&1` so the
     background hook's stdout no longer pipes elan backtraces into the transcript.
- **Done when:** resuming a firewalled session produces no "failed to parse
  release data" backtrace flood.

### C — Retire qou `session-status.sh`, keep one CLI-independent surface
- **Where:** qou.
- **What:** retire `session-status.sh` in favor of the single CLI-independent
  beans surface (qou's `coord-sweep §4b`). **Re-confirm before deleting** that no
  live `settings.json` hook or doc still points at `session-status.sh`; repoint or
  remove those references in the same change (move wiring + script together).
- **Note:** Do **not** delete folio-assistant's `session-status.sh` as part of
  this — see §4 "Deliberately NOT done here." It is unwired here and handled by
  §5.5.

### Consolidated document
- This file is the canonical f-a doc. The qou agent should replace any remaining
  scattered handoff notes with a link to it.

## §7 Cross-repo coordination

On landing the §5 items: update qou's `bean-coordination` ownership note and close
the tracking beans (`j8el`, `bmwh`, `17ht`, `kpzd`, `d9nu`). Do **not** delete
qou's remaining `todos/` files until the §5.4 / qou readers are repointed
(`/api/todos` route + the 3 goal queues and their `coordinate.md` / `STATUS.md`
links; leave the QA sidecar as bulk JSON).
