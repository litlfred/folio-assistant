---
# folio-assistant-tdmg
title: Phase I.7 — reconcile the three `todo-manager.md` copies (#223)
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-19T09:54:27Z
---

`AGENTS.md` records three copies, diverging two ways:

| copy | lines | inbound refs | generated? | CI-gated? |
|---|---|---|---|---|
| `skills/folio-core/todo-manager.md` | 201 | 3 | no | indirectly |
| `docs/reference/skill-instructions/todo-manager.md` | 202 | 1 | yes | yes |
| `.claude/skills/local/todo-manager.md` | 167 | **5** | no | **no** |

The copy with the **most** inbound references has **no guard at all** —
`GROUPS` in `scripts/gen-skill-docs.ts` does not list `.claude/skills/local/`.
188 diff lines between `folio-core` and `.claude/skills/local/`.

Self-contained; unblocks nothing; it is how one of them quietly becomes wrong.

Claimed by claude/fervent-mccarthy-nw4olk 2026-09-19. Pre-claim check per bean-coordination.md: status on origin/main was `todo`, no open PR named `tdmg`.

## Measured 2026-09-19 — the answer is evidence-based, but consolidation is not free

**FOUR copies, not three.** `.claude/skills/local` joined `GROUPS` in
`gen-skill-docs.ts`, so it now has a generated mirror too and IS CI-gated. The
bean's table above and `AGENTS.md`'s were both stale; `AGENTS.md` is corrected
(PR #382).

| copy | lines | generated? | has frontmatter? | served by `skill_fetch`? |
|---|---|---|---|---|
| `skills/folio-core/todo-manager.md` | 396 | no | **yes** — `name`, `description`, `allowed-tools` | **yes** |
| `docs/reference/skill-instructions/todo-manager.md` | 457 | yes | n/a | n/a |
| `.claude/skills/local/todo-manager.md` | 369 | no | **no — none at all** | **no** |
| `docs/reference/skill-instructions/local-todo-manager.md` | 389 | yes | n/a | n/a |

### `skills/folio-core/` is canonical, on four independent mechanisms

Probed, not inferred — `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` is the
table `skill_fetch` serves from, and it holds **7** packages including
`skills/folio-core`, with **no** `.claude/skills/local` entry.

1. `skill_fetch("todo-manager")` serves the `folio-core` copy. The local copy is
   **not servable at all**.
2. Only `folio-core` carries YAML frontmatter. The local copy has none, so it
   declares neither a name nor a description nor its allowed tools.
3. Only `folio-core` carries **`## Check before you create — STRICT`** — the
   exact-title existence check, the one-liner, and "≥ 1 match → claim instead".
   That is the rule that exists because an unguarded `beans create` produced
   **14,688** duplicates in `qou`.
4. `AGENTS.md` §"Getting skills" says to ask via `skill_fetch` rather than open
   a file, which resolves to `folio-core`.

**One earlier reading of mine was too strong and is corrected here:**
`generate-registry.ts` loads `.claude/skills/local` as **JSON only**, which I
first read as "nothing loads the `.md`". But `skillMdDirs()` in
`known-skills.ts` DOES scan that directory, so the file is in the 152-skill
corpus and `skill-has-entry-point` passes for it. It is in the corpus and not
servable — which is why the divergence was invisible to the audit.

### The live defect this caused, now fixed

Every documented reading path sent agents to the **unservable copy that lacks
the STRICT rule**:

- `docs/guides/agent-onboarding.md` — "Full discipline:
  `.claude/skills/local/todo-manager.md`" — **and its es / ru / zh / ar
  translations**. `AGENTS.md` says to read that guide *first*.
- `docs/qou-migration-checklist.md` called it "folio's **canonical**" copy and
  instructed a downstream repo to sync from it.
- `scripts/session-start-coord-sweep.sh`, printed at every session start.
- `scripts/install-beans.sh`, `docs/folio-assistant-migration.md` ×2.

All repointed at `skills/folio-core/`. The three historical mentions in
`folio-assistant-migration.md` (§"Dangling-ref repair: created
`.claude/skills/local/todo-manager.md`" — which is this file's origin) are left
as history.

**The same defect hit `bean-coordination.md` in the same sweep.** PR #382 added
"A claim is branch-local" to `skills/folio-core/bean-coordination.md`; the
`.claude/skills/local/bean-coordination.md` copy (62 lines vs 120, 184 diff
lines) does not carry it, and the onboarding guides pointed at that one. So the
rule shipped two hours ago was invisible to any agent following the documented
path.

### Why consolidation is NOT just "stub the loser"

**The divergence is two-way — each hand-authored copy carries rules the other
lacks.** Only `folio-core` has the STRICT section. Only the local copy has, as
a numbered `## Coordination discipline` list:

- **One source of truth per concern** — do not fork a bean into a parallel
  `todos/*.json` queue; link to the queue from the bean.
- **Move wiring and script together** — relocate a hook-backed script and its
  hook reference in one change.
- **Close on landing** — close the tracking bean and update any cross-repo
  ownership note.
- **`## Relationship to other surfaces`** — the `session-start-coord-sweep.sh`
  pointer.
- `beans ≠ sidecars` as an explicit slogan.

`grep -c` on each: 0 in `folio-core`, 1+ in local. So stubbing the local copy
today **drops four real rules**.

**And `folio-core` cannot simply absorb them.** It is at **396** lines against
`skill-not-a-document`'s hardcoded `n > 400` threshold in `scripts/kg-audit.ts`,
and it already fails `skill-is-brief` (p75 = 279). Four more rules trips a
criterion. This is the same wall that made me move the branch-local rule to
`bean-coordination.md` earlier today.

### Options, for the layout owner — not chosen here

1. **`bean-coordination.md` absorbs the four rules; local copies become stubs.**
   All four are coordination rules and that skill is at 120 lines with room.
   Deletes ~430 lines of unservable duplicate across the two files, keeps
   `folio-core/todo-manager.md` under 400. Cost: `bean-coordination.md` grows
   toward `skill-is-brief`; the stub pattern is the one `CLAUDE.md`/`GEMINI.md`
   already use, so it is precedented.
2. **Split `folio-core/todo-manager.md` first**, then merge. It is 396/400 and
   already over p75, so it wants splitting on its own merits — the reporting
   discipline is a different concern from the bean mechanics. Cost: a bigger
   change touching every inbound reference.
3. **Declare the divergence and guard it.** Leave both, add a test pinning the
   two-way delta with this bean id so it is intentional rather than accidental,
   and fix only the pointers. Cost: two hand-authored copies stay, and the next
   rule still has to be written twice.
