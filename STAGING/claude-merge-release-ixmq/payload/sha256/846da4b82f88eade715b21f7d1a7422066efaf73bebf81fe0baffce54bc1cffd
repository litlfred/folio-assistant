---
# folio-assistant-syzb
title: 'Separation stage 6: carry cat-harness and cat-harness-tools as submodules at the same paths'
status: todo
type: task
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-01T06:58:02Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-w1gy
---

Stage 6 of the split plan: replace `cat-harness/` and `cat-harness-tools/` with submodules at the **same paths**, pinned to the seeded (post-QA) SHAs. `.gitmodules` +2; the 31 workflows already set `submodules: true`. Archive per D6 (owner 2026-10-01, default): `fsh-guts/retired/cat-harness-split.md` names the source SHA and lists `git archive <sha> cat-harness`, **no tarball** (a full one would add ≈69 MB to every clone).

Carried forward from `xsqm` (its one unchecked item, 2026-10-01): `cat-harness/docs/architecture/migration-plan.md` Phase II still has no pointer to `kg-separation` — add it here for both splits.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] `git submodule status` shows both at the seeded SHAs
- [ ] falsifier: `bun run gates --all` on the submodule checkout matches the pre-cutover run gate for gate, with no path edits; the rehearsal and `check:published-refs` pass
- [ ] `fsh-guts/retired/cat-harness-split.md` exists (manifest only)
- [ ] `migration-plan.md` Phase II points at `kg-separation` for bootstrap and cat-harness
