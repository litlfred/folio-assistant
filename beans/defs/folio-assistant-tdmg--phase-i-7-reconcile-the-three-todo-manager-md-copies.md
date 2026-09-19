---
# folio-assistant-tdmg
title: Phase I.7 — reconcile the three `todo-manager.md` copies (#223)
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-19T10:20:05Z
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

## Split done 2026-09-19 — option 2, chosen by the owner

`skills/folio-core/todo-manager.md` was **396 lines against a hardcoded
`n > 400`** in `scripts/kg-audit.ts`, and had been failing `skill-is-brief`
(`n > 280`) on `main` for as long as the criterion existed. It carried three
separable disciplines. Measured per section before cutting:

| section | lines | went to |
|---|---|---|
| frontmatter, title, disambiguation, lead | 49 | stayed |
| `## Opening brief` | 84 | **`opening-brief.md`** |
| `## Say which bean you are on — every turn` | 164 | **`turn-reporting.md`** |
| STRICT create-check, CLI-absent fallback, status vocabulary | 96 | stayed |

Result — and all three pass **every** `kg-qa` criterion, which none of them did
before:

| skill | lines | `skill-is-brief` | `skill-not-a-document` |
|---|---|---|---|
| `todo-manager` | 197 | **pass** (was fail at 392) | pass |
| `opening-brief` | 104 | pass | pass |
| `turn-reporting` | 184 | pass | pass |

**A two-way split was measured and rejected.** `Opening brief` +
`Say which bean` + new frontmatter lands at ~273 against the 280 threshold —
7 lines of margin, so the next paragraph anybody adds trips the criterion. Three
files each sit inside the corpus norm with room. They are also genuinely two
disciplines: what you say BEFORE the work, and what you say DURING and AFTER it,
which `AGENTS.md` already carries as two separate top-level sections.

**Nothing in the moved text was edited.** The split is a cut, so a reviewer can
diff the segments against the original rather than re-read prose.

### The four orphaned rules are now in the servable copy

Ported into `todo-manager.md`'s new `## Coordination discipline`, with a note
saying where they came from and why they were unreachable: "One source of truth
per concern", "Move wiring and script together", "Close on landing", and a
`## Relationship to other surfaces` carrying the
`session-start-coord-sweep.sh` pointer. `beans ≠ sidecars` was already covered
by the file's existing disambiguation block, so it is not duplicated.

### References

The reference surface is large — ~90 mentions of `todo-manager` — but almost all
name the **skill**, which still exists and still governs bean mechanics, so they
stay correct. Only the six naming a **moved section** were repointed:
`AGENTS.md` ×3 (the end-of-turn report, §"Opening brief", §"Say which bean you
are on"), `process-state.md`, `docs/proposals/agents-md-migration.md`, and
`docs/architecture/cat-harness-minimum.md`'s skill table, which now lists three
rows. References to §"Check before you create" were deliberately left alone —
that section did not move.

`opening-brief` and `turn-reporting` are registered in
`skills/folio-core/package-manifest.json` (80 skills) and are **automatically**
served by `skill_fetch` and published by `gen-skill-docs`, because both
discover the directory rather than holding a list — the property bean `wwbl`
established.

### Still open — the local copies are NOT stubbed yet

Deliberately not in the same change: a 500-line move plus two deletions in one
diff is unreviewable, and the stub should land against the split it points at.
`.claude/skills/local/todo-manager.md` (369 lines) and
`.claude/skills/local/bean-coordination.md` (62) remain unservable duplicates.
Their four unique rules are now safely in the servable copy, so stubbing them
no longer loses anything — which was the blocker.

## Done 2026-09-19 — the local copies are stubs

`.claude/skills/local/todo-manager.md` 369 → **29** lines and
`.claude/skills/local/bean-coordination.md` 62 → **21**, both thin pointers at
their `skills/folio-core/` counterparts, following the `CLAUDE.md` / `GEMINI.md`
pattern this repo already uses. ~380 lines of unservable duplicate gone.

### One check I had not run, and it changed the plan

I had verified `todo-manager`'s unique content in both directions and said
stubbing "loses nothing". **I had never measured `bean-coordination` that way.**
It turned out to carry five sections the servable copy lacked, including a rule
worth keeping:

> **If you stop mid-flight, leave the bean `in-progress` with a note saying
> where you got to**, so the next session resumes instead of re-deriving.

Checked whether that was covered elsewhere before porting: `continual-progress`
covers making in-flight work trackable and `bean-blocking` covers a *block* with
its expiry and handoff, but neither covers simply stopping. Ported, along with
the four-step Prime → Claim → Work → Hand-off lifecycle and the parallel-sessions
problem statement that motivates it. `skills/folio-core/bean-coordination.md` is
now 166 lines — inside both thresholds.

`## Session-start coordination sweep` was **not** ported: measured against
`AGENTS.md` §"At session start", which already carries every item in it.

### A false claim that was published, not just written

The old local `bean-coordination.md` described *itself* as "the generic source of
truth" from which downstream repos sync. `skills/folio-core/bean-coordination.md`
now carries a §"Which copy is canonical" saying the opposite, with the
measurement.

Worse, `gen-skill-docs.ts` **emitted** a banner onto the published pages reading:

> "Two different skills share this name … They are **not** copies: measured
> 2026-09-19 they differ by 202 diff lines … Which is canonical is an open
> question … **Read both before relying on either.**"

Every clause of that is now false, and it was live on the docs site. Replaced
with a **directional** banner: the canonical page says it is what `skill_fetch`
serves and to never edit the stub; the stub page says it is a stub and names the
real one. A generator that publishes a stale claim about which document governs
is worse than one that publishes no banner, because a reader acts on it.

**And a gap found while fixing it:** `SAME_BASENAME_DIFFERENT_DOCUMENT` held
`todo-manager` only. `bean-coordination` collides identically and had **no
banner at all**, so a reader landing on either page could not tell the other
existed. Added.

Three stale comments in `gen-skill-docs.ts` corrected too — they quoted "323 and
356 lines, 202 diff lines" and called the canonical question open.

### Verification

`tsc` 0 · `eslint` 0 · `bun test` 2344 pass / 0 fail · all nine gates from
`code-quality-gates.yml` · `gen-skill-docs --check` clean · `kg:audit:check`
clean. Both banner directions confirmed by reading the generated pages rather
than by trusting the template.

### What this bean did NOT settle

Nothing checks that two hand-authored copies of one skill agree with each other
— it is only that there are no longer two. Re-adding content to a stub would be
caught by review, not by a gate.
