---
# folio-assistant-syzb
$schema: bean/1.0.0
title: 'Separation stage 6: carry cat-harness and cat-harness-tools as submodules at the same paths'
status: scrapped
type: task
priority: normal
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-09T17:41:06Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-w1gy
---

Stage 6 of the split plan: replace `cat-harness/` and `cat-harness-tools/` with submodules at the **same paths**, pinned to the seeded (post-QA) SHAs. `.gitmodules` +2; the 31 workflows already set `submodules: true`. Archive per D6 (owner 2026-10-01, default): `fsh-guts/retired/cat-harness-split.md` names the source SHA and lists `git archive <sha> cat-harness`, **no tarball** (a full one would add ≈69 MB to every clone).

Carried forward from `xsqm` (its one unchecked item, 2026-10-01): `cat-harness/docs/architecture/migration-plan.md` Phase II still has no pointer to `kg-separation` — add it here for both splits.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] `git submodule status` shows both at the seeded SHAs
- [ ] falsifier: `bun run cat gates --all` on the submodule checkout matches the pre-cutover run gate for gate, with no path edits; the rehearsal and `check:published-refs` pass
- [ ] `fsh-guts/retired/cat-harness-split.md` exists (manifest only)
- [ ] `migration-plan.md` Phase II points at `kg-separation` for bootstrap and cat-harness

## Scrapped 2026-10-09 — superseded by the owner's remote-mount design
The submodule cutover this stage describes was replaced by the owner's rulings of 2026-10-06 (bean `0mpw`; `w0at` amended, options 1+2) and the bootstrap precedent (#2470, *remote mounts, not git submodules*). The cut it was for has landed by that route instead:
- `cat-harness/` and `cat-harness-tools/` removed from main by commits fc645ae1 and 283ba67e and remote-mounted through `index.config.json` / `index.lock.json` in PR #2517 (merged 2026-10-08); main carries no `.gitmodules` (checked 2026-10-09).
- The archive went to `fsh-guts/separated/cat-harness{,-tools}.{md,tar.gz}` on `cat/cat-harness/fsh-guts` (both present, checked) — a tarball, not the manifest-only note D6 proposed; that change is the cutover's (owner, 2026-10-06: cutover directories go to fsh-guts).
- The gate-for-gate falsifier is now the index CI plus the standalone ratchet (`check:cat-harness-standalone`, cat-harness#52 / cat-harness-tools#16).
**Carried forward, not done:** `cat-harness/docs/concepts/architecture/migration-plan.md` §Phase II still has no pointer to `kg-separation` (grep, 2026-10-09). Recorded on the parent `iirv`. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
