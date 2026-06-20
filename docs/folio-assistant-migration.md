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

**Repo:** qou. **File:** `.claude/settings.json` (does **not** exist in
folio-assistant — do not look here).

Steps:
1. List what the offending commit removed:
   `git show 39fc90f6 --stat | grep -E '\.sh|\.ts'`.
2. For every hook entry in `.claude/settings.json` (`SessionStart`, `Stop`,
   `PreToolUse`, `PostToolUse`, …) extract the script path from its `command`.
3. Test each path: if the script file does **not** exist on `HEAD`, it is a
   dangling reference (expect 4).
4. Resolve each — **move wiring and script together** (§2):
   - If the script is genuinely retired → delete the whole hook entry.
   - If it should still run → restore it from history
     (`git checkout 39fc90f6^ -- <path>`) rather than dropping the reference.
5. **Done when:** `python3 -m json.tool .claude/settings.json >/dev/null` parses
   cleanly **and** every remaining hook `command` resolves to a present,
   executable script (`test -x <path>` for each).

### B — Quiet the Lean hooks in qou (parity with this repo's landed fix)

**Repo:** qou. **File:** qou's copy of `scripts/lean-build-bg.sh` (and any
sibling Lean SessionStart hook). This is a direct port of what landed in
folio-assistant PR #14. Both changes are required.

**B.1** — Immediately *after* the existing `elan_toolchain_dir` dir-emptiness
check and *before* `cd "$LEAN_DIR"`, insert a functional toolchain probe. The
script already `source`s `lib/lean-env.sh`, which provides the `has` helper:

```bash
# The dir-emptiness check above only catches a *missing* toolchain. But
# `setup-lean-toolchain` can bootstrap an elan shim whose toolchains/ dir
# exists yet cannot resolve a usable toolchain — the dir is non-empty, so the
# guard is bypassed, and every following `lake` call tries to fetch from
# release.lean-lang.org. In restricted-egress sandboxes that fails with a
# "failed to parse release data" backtrace on *every* resume, flooding the
# transcript. Probe the toolchain functionally (bounded by `timeout`, so a hung
# elan download can't stall the hook, when available) and bail cleanly when it
# is broken and the release server is unreachable. `timeout` is not present on
# every system (macOS, minimal containers); fall back to a bare probe rather
# than treating its absence (exit 127) as a broken toolchain.
lean_probe=(lean --version)
has timeout && lean_probe=(timeout 15 "${lean_probe[@]}")
if ! "${lean_probe[@]}" >/dev/null 2>&1; then
    if ! curl -sfI --max-time 5 https://release.lean-lang.org > /dev/null 2>&1; then
        write_status "unavailable" "Lean toolchain present but unusable and release.lean-lang.org unreachable (sandbox egress?)" "check" 0
        exit 0
    fi
fi
```

**B.2** — Change the build invocation so the background hook's stdout no longer
pipes elan/lake backtraces into the transcript (the timing report still reads
the log file, so nothing is lost):

```diff
-    if lake build 2>&1 | tee "$LOG_DIR/qou-lake-build.log"; then
+    if lake build > "$LOG_DIR/qou-lake-build.log" 2>&1; then
```

**Done when:** `bash -n scripts/lean-build-bg.sh` passes **and** resuming a
firewalled session produces no "failed to parse release data" backtrace flood.

### C — Retire qou `session-status.sh`, keep one CLI-independent surface

**Repo:** qou.

Steps:
1. Find every live reference before deleting:
   `grep -rn 'session-status\.sh' .claude/ scripts/ docs/ *.md`.
2. For each reference (especially the `.claude/settings.json` SessionStart hook
   and any docs), repoint it to the single CLI-independent beans surface —
   qou's `coord-sweep §4b` — in the **same change** (move wiring + script
   together).
3. `git rm scripts/session-status.sh`.
4. **Done when:** no dangling references to `session-status.sh` remain, session
   start still emits the beans/coord surface, and `settings.json` parses.

**Do NOT** delete folio-assistant's `session-status.sh` as part of this — see
§4 "Deliberately NOT done here." It is unwired here and handled by §5.5.

### Consolidated document
- This file is the canonical f-a doc. The qou agent should replace any remaining
  scattered handoff notes with a link to it.

## §7 Cross-repo coordination

On landing the §5 items: update qou's `bean-coordination` ownership note and close
the tracking beans (`j8el`, `bmwh`, `17ht`, `kpzd`, `d9nu`). Do **not** delete
qou's remaining `todos/` files until the §5.4 / qou readers are repointed
(`/api/todos` route + the 3 goal queues and their `coordinate.md` / `STATUS.md`
links; leave the QA sidecar as bulk JSON).
