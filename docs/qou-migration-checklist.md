# qou migration checklist

Cross-repo TODO list for the **qou** side of the folio-assistant infrastructure
migration (`miga`). Compiled from the handoff + the folio-assistant work landed in
PR #14. Companion to `docs/folio-assistant-migration.md` (§6 has exact, copy-paste
instructions for A/B/C; §8 has the cross-agent session-start design).

> Convention: agents may create / `in-progress` items but should not resolve a
> sibling's. Tick a box only when its *Done when* holds.

## A/B/C — session-setup cleanup (handoff §6)

- [ ] **A. Strip 4 dangling hook refs from qou `.claude/settings.json`** — the
  scripts deleted by `39fc90f6`: `open-folio-assistant.sh`, `watch-main-prompt.sh`
  (SessionStart), `render-on-change.sh` (PostToolUse), `greeting-task-selection.sh`
  (UserPromptSubmit). Remove the entry, or restore the script
  (`git checkout 39fc90f6^ -- <path>`) — move wiring + script together.
  *Done when:* `settings.json` parses and every hook resolves to an executable script.
- [ ] **B. Port the Lean-flood fix to qou's `scripts/lean-build-bg.sh`** —
  (B.1) after the elan-dir check, add the `has timeout`-guarded `lean --version`
  probe that bails when the toolchain is broken **and** `release.lean-lang.org` is
  unreachable; (B.2) change `lake build … | tee` → `lake build > "$LOG" 2>&1`.
  *Done when:* a firewalled resume shows no "failed to parse release data" flood.
- [ ] **C. Retire qou's `session-status.sh`** — grep for refs first, repoint each
  to the CLI-independent surface (`coord-sweep`) in the same change, then `git rm`.
  *Done when:* no dangling refs; session start still emits the beans/coord surface.

## Sync canonical infra from folio-assistant (it now owns these)

- [ ] **`bean-coordination.md`** — replace qou's thin pointer with a sync from
  folio's canonical `.claude/skills/local/bean-coordination.md`.
- [ ] **`todo-manager.md`** — sync from folio's `.claude/skills/local/todo-manager.md`
  (includes the "Using beans for todos" guidance).
- [ ] **`install-beans.sh`** — vendor/mirror folio's `scripts/install-beans.sh` as
  the single source of truth.
- [ ] **Adopt the `AGENTS.md` pattern** — make qou's `AGENTS.md` the agent-generic
  source of truth; reduce `CLAUDE.md` / `GEMINI.md` to thin stubs (`@AGENTS.md` /
  "See AGENTS.md").

## Session-start harness (port folio's resolved Q2 design, §8)

- [ ] **Adopt the shared primer** — replace qou's `session-start-coord-sweep.sh`
  with (or rebase onto) folio's generalized primer (beans priming + default-branch
  delta + sibling sweep, CLI-independent).
- [ ] **Wire native Claude `SessionStart`** in qou's `.claude/settings.json` → the
  shared primer (this is item A's settings.json — do together).
- [ ] **(Optional, cross-agent)** add Gemini CLI / Antigravity `hooks.json`
  SessionStart entries invoking the same primer.
- [ ] **(Optional)** expose `beans prime` as an MCP tool in qou's server
  (folio's `work_plan_prime` in `src/tools/beans-prime.ts` is the reference) if
  qou runs its own MCP.

## todos → beans (Q1 decided: no separate todos platform)

- [ ] **3 goal queues** (`todos/1ppq-qbeta-queue.json`, `lean-discharge-queue.json`,
  `research-queue.json`) — convert to beans **or** relocate as bulk JSON; repoint
  their `coordinate.md` / `STATUS.md` links in the same change.
- [ ] **QA sidecar** (`todos/qa-q-CAL-1-2-3-audit.json`) — keep as bulk JSON;
  never `beans create` it.
- [ ] **`content-todos.ts` TodoItem store** — decide keep-at-`todos/` vs relocate;
  if relocating, repoint readers first.
- [ ] **Do NOT delete** any `todos/` file until its readers / links are repointed.

## Cross-repo bookkeeping (§7)

- [ ] Update qou's `bean-coordination.md` ownership note to point at
  folio-assistant as canonical.
- [ ] Close tracking beans: `j8el`, `bmwh`, `17ht`, `kpzd`, `d9nu`.
- [ ] Replace any remaining scattered handoff notes with a link to folio's
  `docs/folio-assistant-migration.md`.
