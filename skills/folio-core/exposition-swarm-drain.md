---
name: exposition-swarm-drain
roles: [collaborator, owner]
user_invocable: true
description: >
  Drain the paper's narrative blocks through an exposition-quality
  swarm: a small fleet of grouped-batch agents each audit their
  batch against the Milnor exposition gate (expo-milnor-clarity,
  H1–H8) plus the deterministic narrative defect checks
  (proof-sketch-vs-kind, proof-no-lean-mention-in-prose,
  proof-cross-block-duplication), then RESOLVE the flagged blocks
  with conservative, math-preserving edits. Each swarm agent owns
  its own branch (commits, pushes, opens a PR); the foreground
  session runs auto prepare-merge on each swarm branch and repeats
  batch-by-batch until the paper is completely drained. Sister to
  `/integration-backlog` (that drains watcher findings; this drains
  exposition quality).
---

# /exposition-swarm-drain — Milnor-exposition audit→resolve drain

Bring every narrative block up to the **Milnor exposition standard**
(one-voice style guide → "The Milnor exposition standard"), at scale,
autonomously, without hand-editing block by block.

## 0. When to use

- "swarm the exposition", "Milnor-audit the paper", "drain narrative
  quality", "run the audit+resolve swarm", "clean up the prose across
  chapter X / the whole paper".
- The paper has ~2,000 narrative blocks; this is the mechanism for
  processing them in bulk while keeping each edit conservative and
  each batch a reviewable PR.

## 1. The pattern (three roles)

```
                    ┌─────────────── foreground session (you) ───────────────┐
   enumerate  →     │  batch the blocks → launch swarm → auto prepare-merge   │  → repeat until drained
                    └────────────────────────────────────────────────────────┘
                              │ each batch
                              ▼
        ┌──────────── swarm agent (one per grouped batch) ────────────┐
        │  own branch → AUDIT each block (Milnor H1–H8 + defects)     │
        │            → RESOLVE flagged blocks (math-preserving edits) │
        │            → commit → push → open PR → return PR#           │
        └─────────────────────────────────────────────────────────────┘
```

1. **Foreground (this session)** — enumerate + batch the blocks, launch
   the swarm, then **auto prepare-merge** each swarm PR (via
   `/prepare-merge-auto`). Runs the drain loop until every batch is
   merged or explicitly parked. Does **not** stop for check-ins — go
   until completely drained (owner directive 2026-07-04).
2. **Swarm agent (grouped batch)** — each agent owns **one branch** and
   **one grouped batch** of blocks (not one block per agent — that
   over-creates PRs; see §3). It audits and resolves its whole batch,
   commits, pushes, opens a PR, and returns the PR number + a summary.
3. **Auto-merge** — the foreground runs `/prepare-merge-auto` on each
   returned PR: rebase, one-voice + lean checks, request reviews,
   resolve mechanical comments, merge (rebase-merge default). Merge is
   pre-authorized for this drain (owner directive); architectural review
   comments still escalate via `AskUserQuestion`.

## 2. The audit rubric (what each agent scores)

Score each block on the eight Milnor hallmarks, 0–2 each
(authoritative: `expo-milnor-clarity` spec,
[`docs/requirements/2026-07-04-folio-assistant-proof-narrative-checkers.md` §5A](../../../docs/requirements/2026-07-04-folio-assistant-proof-narrative-checkers.md);
author-facing: `one-voice-style-guide.md` → "The Milnor exposition standard"):

| | Hallmark |
|---|---|
| H1 | Economy — every sentence load-bearing |
| H2 | Concrete before abstract |
| H3 | The "Why" precedes the "What" |
| H4 | Uncluttered notation |
| H5 | Linear argument |
| H6 | Prose carries the argument |
| H7 | Surgical cleanliness / right-tool framing |
| H8 | Respect for the reader's time and intelligence |

**Gate (owner ruling 2026-07-04, STRICT):** `T = ΣHi`. `T = 16` → **pass**;
`12 ≤ T ≤ 15` → **warn**; `T ≤ 11` → **fail**. Perfection is the bar.

Also flag the deterministic narrative defects (independent of the score):
- **proof-sketch-vs-kind** — a provable-kind block presenting "Proof
  (sketch)"/an incompleteness admission.
- **proof-no-lean-mention-in-prose** — prose naming the Lean/sorry/Mathlib
  apparatus.
- **proof-cross-block-duplication** — a proof authored twice across
  sibling blocks.

## 3. Batching (grouped, review-sized)

- **One agent per grouped batch**, batch = a **chapter** (or a
  sub-cluster of a large chapter). Never one-block-per-agent — that
  fragments into hundreds of PRs and violates the "minimize PR creation"
  rule (AGENTS.md).
- **Size cap:** ≤ ~40 blocks per batch AND ≤ 49 files per resulting PR
  (the Gemini review limit). Split big chapters into coherent
  sub-clusters by section or topic stem. Get the actual per-chapter
  counts from the folio rather than a remembered table — they drift:

  ```sh
  for d in content/*/*/; do
    printf '%s %s\n' "$(ls "$d"*.md 2>/dev/null | wc -l)" "$d"
  done | sort -rn | head
  ```

- **Concurrency:** a "small swarm" is ≤ ~8 batch-agents live at once
  (the Workflow cap is `min(16, cores−2)`); launch chapters in waves.
- **Branch name:** each agent uses `claude/expo-milnor-<chapter>-<utc-ymd>`.

## 4. Conservative-edit discipline (STRICT — the resolve half)

Resolve agents edit `.md` prose only. They **must not**:
- change any mathematical statement, definition, equation, hypothesis, or
  proof step;
- invent mathematics or fake a proof;
- convert a "Proof (sketch)" to "Proof" unless the complete argument is
  **already present** (else leave it and set `needs_owner`).

**DO-NOT-TOUCH-DERIVATIONS rule (STRICT, added 2026-07-04 after a live
incident).** A resolve agent must **not edit the prose of a derivation,
computation, or proof body at all** — not even to "tighten" or "clarify"
it. Polishing a derivation can make a *wrong* one read more cleanly and
authoritative, which is worse than leaving it rough. (Incident: the swarm
reworded a `frobenius-relation-su2` derivation that was mathematically
false — it conflated the Hopf comultiplication with the Frobenius
comultiplication — and the cleaner prose lent the error false authority;
Gemini caught it, PR #3301.) Therefore:
- **Only edit the *surrounding exposition*** — the intro/motivation
  sentence, the notation-introduction, a redundant restatement *outside*
  the derivation, the closing interpretation. Leave every derivation /
  computation / proof step **verbatim**.
- If a derivation itself reads poorly, **do not fix it** — set
  `needs_owner` with a note. A resolve agent is not authorized to verify
  or repair mathematics.
- The audit stage **may** score H5/H6/H7 low on a muddy derivation and
  **flag** it, but the flag routes to `needs_owner`, not to an autonomous
  prose rewrite of the derivation.

They **may**: strip Lean/sorry/apparatus sentences; tighten wordy prose
*outside derivations*; reorder so motivation precedes machinery; introduce
a symbol at first use; de-duplicate a glyph. Anything requiring real math —
or any edit that would touch a derivation body — is returned as
`needs_owner` with a reason, **never** auto-faked or auto-polished.

**The review layer is the backstop, not the gate.** Every swarm PR still
goes through `/prepare-merge-auto` (Gemini + Copilot) before merge; that
layer caught the incident above. Do not merge a content batch on the
swarm's self-check alone.

Every resolve agent runs the render sanity battery before committing
(balanced `$`/`$$`/`{}`, no `\operatorname` → `\mathrm`, no list-hijack
line starting `+`/`-`/`*` inside `$$`, align-family fenced as ```` ```tex ````)
per `markdown-render-check`, and the block validates
(`bun run scripts/run-validate.ts content/<paper>`) before the PR opens.

## 5. Foreground drain loop

```
blocks = enumerate_narrative_blocks(paper)          # kind ∈ narrative, ≥40 words
batches = group_into_batches(blocks)                # §3 — per chapter / sub-cluster
for wave in chunks(batches, 8):                     # ≤8 agents live
    prs = swarm(wave)                               # §6 workflow → [PR#, …]
    for pr in prs:
        prepare_merge_auto(pr)                      # rebase, checks, reviews, merge
# repeat until batches exhausted — do NOT stop for check-ins
```

Stop conditions: the batch list is exhausted (drained), OR the owner says
stop, OR a batch's `needs_owner` items require a decision that blocks its
PR — park that one PR (comment why) and keep draining the rest.

## 6. Workflow skeleton (audit → resolve, pipelined per block within a batch)

A batch-agent may itself run this inner pipeline over its blocks. The
canonical script (iterate via `scriptPath`, not by resending):

```js
export const meta = { name: 'milnor-audit-resolve', description: '…',
  phases: [{title:'Audit'},{title:'Resolve'}] }
const blocks = Array.isArray(args) ? args : JSON.parse(args)   // args may arrive as a string
const results = await pipeline(blocks,
  (path) => agent(AUDIT_PROMPT(path),   {phase:'Audit',   agentType:'general-purpose', schema: AUDIT_SCHEMA}),
  (audit, path) => {
    if (!audit || (audit.verdict==='pass' && !audit.defects.length)) return {block:path, edited:false, skipped_reason:'clean'}
    if (audit.needs_owner) return {block:path, edited:false, skipped_reason:'needs owner: '+audit.needs_owner_reason}
    return agent(RESOLVE_PROMPT(path, audit), {phase:'Resolve', agentType:'general-purpose', schema: RESOLVE_SCHEMA})
  })
return results.filter(Boolean)
```

- **`agentType: 'general-purpose'`** so resolve agents have Edit/Write.
- **Schemas** force structured audit (scores/verdict/defects/fix_plan/
  needs_owner) and resolve (edited/changes/preserved_math/skipped_reason).
- **`pipeline` not `parallel`** — each block flows audit→resolve with no
  barrier; a warn block resolves while another is still being audited.
- **Guard `args`** — it can arrive as a JSON string; parse defensively.

## 7. Interaction with the flag-preservation guard

The Milnor gate can `fail`, so its verdicts are real blocking flags. Per
`qa-flag-preservation-audit.ts` (PR #3289), a distrusted `expo-milnor-clarity`
verdict must be **re-audited**, never `n/a`-cleared. Keep the per-block score
vector in the sidecar so a re-review re-scores rather than re-guesses.

## 8. Reporting

At the end of each wave, report a compact table: block · kind · Milnor
total · verdict · defects · edited?/needs_owner. At full drain, report the
score distribution (how many pass/warn/fail before vs after) and the list
of `needs_owner` blocks for the author.

## Cross-references

- Rubric spec: `docs/requirements/2026-07-04-folio-assistant-proof-narrative-checkers.md` §5A
- Author voice: `.claude/skills/local/one-voice-style-guide.md` → "The Milnor exposition standard"
- Merge pipeline: `.claude/skills/local/prepare-merge-auto.md`
- Sister drain: `.claude/skills/local/integration-backlog.md`
- Flag guard: `content/pipeline/qa-flag-preservation-audit.ts`
